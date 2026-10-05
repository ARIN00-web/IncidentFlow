import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { EventBusService } from '../../infrastructure/kafka/event-bus.service';
import { NotificationQueueService } from '../notifications/notification.queue';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { ListIncidentsDto } from './dto/list-incidents.dto';

const transitions: Record<string, string[]> = {
  OPEN: ['ACKNOWLEDGED'],
  ACKNOWLEDGED: ['INVESTIGATING'],
  INVESTIGATING: ['MITIGATED'],
  MITIGATED: ['RESOLVED'],
  RESOLVED: [],
};

@Injectable()
export class IncidentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly events: EventBusService,
    private readonly notifications: NotificationQueueService,
  ) {}

  async create(dto: CreateIncidentDto, userId: number) {
    const result = await this.db.transaction(async (client) => {
      const incident = await client.query(
        `INSERT INTO incidents
         (title, severity, status, created_by)
         VALUES ($1, $2, 'OPEN', $3)
         RETURNING id, title, severity, status, created_by, created_at, updated_at`,
        [dto.title.trim(), dto.severity, userId],
      );

      const row = incident.rows[0];

      await client.query(
        `INSERT INTO incident_timeline
         (incident_id, actor_id, event_type, message)
         VALUES ($1, $2, 'INCIDENT_CREATED', $3)`,
        [row.id, userId, 'Incident created'],
      );

      return row;
    });

    const event = {
      eventId: randomUUID(),
      eventType: 'IncidentCreated',
      occurredAt: new Date().toISOString(),
      incidentId: result.id,
      severity: result.severity,
      createdBy: userId,
    };

    await this.events.publish(
      'incident-events',
      String(result.id),
      event,
    );

    await this.notifications.addIncidentCreated(result.id, result.severity);

    return result;
  }

  async findAll(query: ListIncidentsDto) {
    const values: unknown[] = [];
    const conditions: string[] = [];

    if (query.status) {
      values.push(query.status);
      conditions.push(`status = $${values.length}`);
    }

    if (query.severity) {
      values.push(query.severity);
      conditions.push(`severity = $${values.length}`);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM incidents ${where}`,
      values,
    );

    const limit = query.limit ?? 20;
    const page = query.page ?? 1;
    const offset = (page - 1) * limit;

    values.push(limit);
    values.push(offset);

    const result = await this.db.query(
      `SELECT i.id, i.title, i.severity, i.status,
              i.created_by, i.created_at, i.updated_at,
              u.name AS creator_name
       FROM incidents i
       JOIN users u ON u.id = i.created_by
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${values.length - 1}
       OFFSET $${values.length}`,
      values,
    );

    return {
      data: result.rows,
      page,
      limit,
      total: Number(countResult.rows[0].count),
    };
  }

  async findById(id: number) {
    const cacheKey = `incident:${id}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const result = await this.db.query(
      `SELECT i.id, i.title, i.severity, i.status,
              i.created_by, i.created_at, i.updated_at,
              u.name AS creator_name
       FROM incidents i
       JOIN users u ON u.id = i.created_by
       WHERE i.id = $1`,
      [id],
    );

    if (!result.rowCount) {
      throw new NotFoundException('Incident not found');
    }

    const timeline = await this.timeline(id);
    const assignments = await this.assignments(id);

    const incident = {
      ...result.rows[0],
      timeline,
      assignments,
    };

    await this.redis.set(cacheKey, JSON.stringify(incident), 60);
    return incident;
  }

  async update(id: number, dto: UpdateIncidentDto, userId: number) {
    const current = await this.getRaw(id);

    if (dto.status && dto.status !== current.status) {
      if (!transitions[current.status]?.includes(dto.status)) {
        throw new BadRequestException(
          `Invalid status transition: ${current.status} -> ${dto.status}`,
        );
      }

      if (
        dto.status === 'RESOLVED' &&
        current.severity === 'CRITICAL'
      ) {
        const commander = await this.db.query(
          `SELECT 1
           FROM incident_assignments ia
           JOIN users u ON u.id = ia.user_id
           WHERE ia.incident_id = $1
             AND u.role IN ('INCIDENT_COMMANDER', 'ADMIN')
           LIMIT 1`,
          [id],
        );

        if (!commander.rowCount) {
          throw new BadRequestException(
            'A CRITICAL incident requires an Incident Commander or Admin assignment before resolution',
          );
        }
      }
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (dto.title !== undefined) {
      values.push(dto.title.trim());
      fields.push(`title = $${values.length}`);
    }

    if (dto.severity !== undefined) {
      values.push(dto.severity);
      fields.push(`severity = $${values.length}`);
    }

    if (dto.status !== undefined) {
      values.push(dto.status);
      fields.push(`status = $${values.length}`);
    }

    if (!fields.length) {
      return this.findById(id);
    }

    values.push(new Date());
    fields.push(`updated_at = $${values.length}`);

    values.push(id);

    const result = await this.db.query(
      `UPDATE incidents
       SET ${fields.join(', ')}
       WHERE id = $${values.length}
       RETURNING id, title, severity, status, created_by, created_at, updated_at`,
      values,
    );

    await this.db.query(
      `INSERT INTO incident_timeline
       (incident_id, actor_id, event_type, message)
       VALUES ($1, $2, 'INCIDENT_UPDATED', $3)`,
      [id, userId, dto.status
        ? `Status changed to ${dto.status}`
        : 'Incident updated'],
    );

    await this.redis.del(`incident:${id}`);

    await this.events.publish(
      'incident-events',
      String(id),
      {
        eventId: randomUUID(),
        eventType: 'IncidentUpdated',
        occurredAt: new Date().toISOString(),
        incidentId: id,
        status: result.rows[0].status,
      },
    );

    return result.rows[0];
  }

  async assign(id: number, userId: number, actorId: number) {
    await this.getRaw(id);

    const user = await this.db.query(
      'SELECT id FROM users WHERE id = $1',
      [userId],
    );

    if (!user.rowCount) {
      throw new NotFoundException('User not found');
    }

    await this.db.query(
      `INSERT INTO incident_assignments (incident_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, userId],
    );

    await this.db.query(
      `INSERT INTO incident_timeline
       (incident_id, actor_id, event_type, message)
       VALUES ($1, $2, 'ENGINEER_ASSIGNED', $3)`,
      [id, actorId, `User ${userId} assigned`],
    );

    await this.redis.del(`incident:${id}`);

    await this.events.publish(
      'incident-events',
      String(id),
      {
        eventId: randomUUID(),
        eventType: 'EngineerAssigned',
        occurredAt: new Date().toISOString(),
        incidentId: id,
        userId,
      },
    );

    return { message: 'Engineer assigned' };
  }

  async timeline(id: number) {
    const result = await this.db.query(
      `SELECT it.id, it.event_type, it.message, it.created_at,
              it.actor_id, u.name AS actor_name
       FROM incident_timeline it
       LEFT JOIN users u ON u.id = it.actor_id
       WHERE it.incident_id = $1
       ORDER BY it.created_at ASC`,
      [id],
    );
    return result.rows;
  }

  async assignments(id: number) {
    const result = await this.db.query(
      `SELECT u.id, u.name, u.email, u.role, ia.assigned_at
       FROM incident_assignments ia
       JOIN users u ON u.id = ia.user_id
       WHERE ia.incident_id = $1
       ORDER BY ia.assigned_at ASC`,
      [id],
    );
    return result.rows;
  }

  private async getRaw(id: number) {
    const result = await this.db.query(
      `SELECT id, title, severity, status, created_by, created_at, updated_at
       FROM incidents WHERE id = $1`,
      [id],
    );

    if (!result.rowCount) {
      throw new NotFoundException('Incident not found');
    }

    return result.rows[0];
  }
}
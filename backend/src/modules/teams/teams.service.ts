import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @Inject(DatabaseService)
    private readonly db: DatabaseService,
  ) {}

  async findAll() {
    const result = await this.db.query(
      `SELECT id, name, created_at FROM teams ORDER BY id DESC`,
    );
    return result.rows;
  }

  async create(dto: CreateTeamDto) {
    try {
      const result = await this.db.query(
        `INSERT INTO teams (name) VALUES ($1)
         RETURNING id, name, created_at`,
        [dto.name.trim()],
      );
      return result.rows[0];
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('Team already exists');
      }
      throw error;
    }
  }

  async addMember(teamId: number, userId: number) {
    const team = await this.db.query('SELECT id FROM teams WHERE id = $1', [teamId]);
    if (!team.rowCount) throw new NotFoundException('Team not found');

    const user = await this.db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!user.rowCount) throw new NotFoundException('User not found');

    await this.db.query(
      `INSERT INTO team_members (team_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [teamId, userId],
    );

    return { message: 'Member added' };
  }

  async members(teamId: number) {
    const result = await this.db.query(
      `SELECT u.id, u.name, u.email, u.role
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY u.id`,
      [teamId],
    );
    return result.rows;
  }
}
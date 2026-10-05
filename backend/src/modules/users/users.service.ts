import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const result = await this.db.query(
      `SELECT id, name, email, role, created_at
       FROM users ORDER BY id DESC`,
    );
    return result.rows;
  }

  async findById(id: number) {
    const result = await this.db.query(
      `SELECT id, name, email, role, created_at
       FROM users WHERE id = $1`,
      [id],
    );

    if (!result.rowCount) {
      throw new NotFoundException('User not found');
    }

    return result.rows[0];
  }
}
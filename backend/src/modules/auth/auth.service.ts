import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  password_hash: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.db.query<{ id: number }>(
      'SELECT id FROM users WHERE email = $1',
      [email],
    );

    if (existing.rowCount) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password);

    const result = await this.db.query<UserRow>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'ENGINEER')
       RETURNING id, name, email, role, password_hash`,
      [dto.name.trim(), email, passwordHash],
    );

    return this.publicUser(result.rows[0]);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const result = await this.db.query<UserRow>(
      `SELECT id, name, email, role, password_hash
       FROM users WHERE email = $1`,
      [email],
    );

    const user = result.rows[0];

    if (!user || !(await argon2.verify(user.password_hash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      accessToken: token,
      user: this.publicUser(user),
    };
  }

  private publicUser(user: UserRow) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
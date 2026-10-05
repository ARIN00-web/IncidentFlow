import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  findAll() {
    return this.teams.findAll();
  }

  @Post()
  create(@Body() dto: CreateTeamDto) {
    return this.teams.create(dto);
  }

  @Post(':teamId/members/:userId')
  addMember(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() _user: AuthUser,
  ) {
    return this.teams.addMember(teamId, userId);
  }

  @Get(':teamId/members')
  members(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teams.members(teamId);
  }
}
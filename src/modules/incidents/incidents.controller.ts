import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { ListIncidentsDto } from './dto/list-incidents.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Post()
  create(
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.incidents.create(dto, user.id);
  }

  @Get()
  findAll(@Query() query: ListIncidentsDto) {
    return this.incidents.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.incidents.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.incidents.update(id, dto, user.id);
  }

  @Post(':id/assign/:userId')
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.incidents.assign(id, userId, actor.id);
  }

  @Get(':id/timeline')
  timeline(@Param('id', ParseIntPipe) id: number) {
    return this.incidents.timeline(id);
  }

  @Get(':id/assignments')
  assignments(@Param('id', ParseIntPipe) id: number) {
    return this.incidents.assignments(id);
  }
}
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const STATUSES = [
  'OPEN',
  'ACKNOWLEDGED',
  'INVESTIGATING',
  'MITIGATED',
  'RESOLVED',
] as const;

export class UpdateIncidentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: typeof STATUSES[number];
}
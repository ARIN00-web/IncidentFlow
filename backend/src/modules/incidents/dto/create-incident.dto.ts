import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export class CreateIncidentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @IsIn(SEVERITIES)
  severity!: typeof SEVERITIES[number];
}
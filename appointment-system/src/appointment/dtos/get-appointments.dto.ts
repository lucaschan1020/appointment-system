import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class GetAppointmentsQueryDto {
  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  appointmentDate: Date;
}

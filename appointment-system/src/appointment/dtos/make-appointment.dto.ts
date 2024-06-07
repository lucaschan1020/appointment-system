import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class MakeAppointmentBodyDto {
  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  appointmentStartDateTime: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  appointmentEndDateTime: Date;
}

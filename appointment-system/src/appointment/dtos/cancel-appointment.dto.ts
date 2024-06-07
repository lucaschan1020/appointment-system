import { Type } from 'class-transformer';
import { IsDefined, IsNumber } from 'class-validator';

export class CancelAppointmentParamDto {
  @IsNumber()
  @Type(() => Number)
  @IsDefined()
  appointmentId: number;
}

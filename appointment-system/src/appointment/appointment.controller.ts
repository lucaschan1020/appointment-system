import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { MakeAppointmentBodyDto } from './dtos/make-appointment.dto';
import { GetAppointmentsQueryDto } from './dtos/get-appointments.dto';
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import { CancelAppointmentParamDto } from './dtos/cancel-appointment.dto';

@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @ApiQuery({
    name: 'appointmentDate',
    required: true,
    type: Date,
  })
  @Get()
  async getAppointments(@Query() query: GetAppointmentsQueryDto) {
    return await this.appointmentService.getAppointments({
      startDate: query.appointmentDate,
    });
  }

  @Post()
  async makeAppointment(@Body() body: MakeAppointmentBodyDto) {
    return await this.appointmentService.makeAppointment({
      startDateTime: body.appointmentStartDateTime,
      endDateTime: body.appointmentEndDateTime,
    });
  }

  @ApiParam({
    name: 'appointmentId',
    required: true,
    type: Number,
  })
  @Delete('/:appointmentId')
  async cancelAppointment(@Param() param: CancelAppointmentParamDto) {
    return await this.appointmentService.cancelAppointment({
      appointmentId: param.appointmentId,
    });
  }
}

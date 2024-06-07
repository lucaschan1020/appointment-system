import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { DatabaseModule } from 'src/database/database.module';
import { Appointment } from 'src/models/appointment.entity';
import { AppointmentRepository } from 'src/repositories/appointment.repository';

@Module({
  imports: [DatabaseModule.forFeature([Appointment])],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentRepository],
})
export class AppointmentModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { Appointment } from './models/appointment.entity';
import { AppointmentRepository } from './repositories/appointment.repository';
import { AppointmentModule } from './appointment/appointment.module';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([Appointment]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AppointmentModule,
  ],
  controllers: [],
  providers: [AppointmentRepository],
})
export class AppModule {}

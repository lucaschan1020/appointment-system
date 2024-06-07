import { BadRequestException, Injectable } from '@nestjs/common';
import {
  addDays,
  addMinutes,
  differenceInMinutes,
  getMinutes,
  getSeconds,
  isSameDay,
  setHours,
  startOfDay,
} from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { Appointment } from 'src/models/appointment.entity';
import { AppointmentRepository } from 'src/repositories/appointment.repository';
import { LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual } from 'typeorm';
import * as config from './config/appointment-config.json';

@Injectable()
export class AppointmentService {
  private readonly operationStartTime = config.operationHour.startTime;
  private readonly operationEndTime = config.operationHour.endTime;
  private readonly eachSlotDuration = config.eachSlotDuration;
  private readonly eachAppointmentMaxSlotSpan =
    config.eachAppointmentMaxSlotSpan;
  private readonly timezone = config.timezone;

  private readonly localBlockedDates = config.blockedDates.map((date) =>
    toZonedTime(new Date(date), this.timezone),
  );
  private readonly blockedTime = config.blockedTimes.map((time) => ({
    startTime: time.startTime,
    endTime: time.endTime,
  }));

  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  getAppointments = async (args: { startDate: Date }) => {
    const localStartDate = toZonedTime(args.startDate, this.timezone);
    const localStartOfDay = startOfDay(localStartDate);
    const localEndOfDay = startOfDay(addDays(localStartOfDay, 1));

    const utcStartOfDay = fromZonedTime(localStartOfDay, this.timezone);
    const utcEndOfDay = fromZonedTime(localEndOfDay, this.timezone);
    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentStartDate: MoreThanOrEqual(utcStartOfDay),
        appointmentEndDate: LessThan(utcEndOfDay),
      },
    });

    const localOperationStartTime = setHours(
      localStartOfDay,
      this.operationStartTime,
    );
    const localOperationEndTime = setHours(
      localStartOfDay,
      this.operationEndTime,
    );
    const utcOperationStartTime = fromZonedTime(
      localOperationStartTime,
      this.timezone,
    );
    const utcOperationEndTime = fromZonedTime(
      localOperationEndTime,
      this.timezone,
    );

    const slots = [];
    for (
      let currentStartTime = utcOperationStartTime;
      currentStartTime <= utcOperationEndTime;
      currentStartTime = addMinutes(currentStartTime, this.eachSlotDuration)
    ) {
      const currentEndTime = addMinutes(
        currentStartTime,
        this.eachSlotDuration,
      );
      const appointment = appointments.find(
        (appointment) =>
          (appointment.appointmentStartDate <= currentStartTime &&
            appointment.appointmentEndDate > currentStartTime) ||
          (appointment.appointmentStartDate < currentEndTime &&
            appointment.appointmentEndDate >= currentEndTime),
      );

      slots.push({
        date: utcStartOfDay,
        time: currentStartTime,
        available: appointment ? 0 : 1,
        appointmentId: appointment ? appointment.id : null,
      });
    }

    return slots;
  };

  makeAppointment = async (args: {
    startDateTime: Date;
    endDateTime: Date;
  }) => {
    const localStartDateTime = toZonedTime(args.startDateTime, this.timezone);
    const localStartOfDay = startOfDay(localStartDateTime);
    const localEndDateTime = toZonedTime(args.endDateTime, this.timezone);
    const localNow = toZonedTime(new Date(), this.timezone);
    if (localStartDateTime < localNow) {
      throw new BadRequestException('Cannot make appointment in the past');
    }

    const isStartTimeFormatValid =
      getMinutes(localStartDateTime) % this.eachSlotDuration === 0 &&
      getSeconds(localStartDateTime) === 0;
    if (!isStartTimeFormatValid) {
      throw new BadRequestException('Invalid start time format');
    }

    const isEndTimeFormatValid =
      getMinutes(localEndDateTime) % this.eachSlotDuration === 0 &&
      getSeconds(localEndDateTime) === 0;
    if (!isEndTimeFormatValid) {
      throw new BadRequestException('Invalid end time format');
    }

    if (localStartDateTime >= localEndDateTime) {
      throw new BadRequestException('End date must be after start date');
    }

    const localOperationStartTime = setHours(
      localStartOfDay,
      this.operationStartTime,
    );
    const localOperationEndTime = setHours(
      localStartOfDay,
      this.operationEndTime,
    );

    if (
      localStartDateTime < localOperationStartTime ||
      localEndDateTime > localOperationEndTime
    ) {
      throw new BadRequestException(
        'Appointment must be within operation hours',
      );
    }

    const maxDuration = this.eachSlotDuration * this.eachAppointmentMaxSlotSpan;
    if (
      differenceInMinutes(localEndDateTime, localStartDateTime) > maxDuration
    ) {
      throw new BadRequestException('Appointment duration too long');
    }

    const isBlockedDate = this.localBlockedDates.some((blockedDate) => {
      return isSameDay(blockedDate, localStartDateTime);
    });
    if (isBlockedDate) {
      throw new BadRequestException('Blocked date');
    }

    const isBlockedTime = this.blockedTime.some((blockedTime) => {
      const localBlockedStartTime = setHours(
        localStartOfDay,
        blockedTime.startTime,
      );
      const localBlockedEndTime = setHours(
        localStartOfDay,
        blockedTime.endTime,
      );
      return (
        (localBlockedStartTime <= localStartDateTime &&
          localBlockedEndTime > localStartDateTime) ||
        (localBlockedStartTime < localEndDateTime &&
          localBlockedEndTime >= localEndDateTime)
      );
    });

    if (isBlockedTime) {
      throw new BadRequestException('Blocked time');
    }

    const clashAppointments = await this.appointmentRepository.find({
      where: [
        {
          appointmentStartDate: LessThanOrEqual(args.startDateTime),
          appointmentEndDate: MoreThan(args.startDateTime),
        },
        {
          appointmentStartDate: LessThan(args.endDateTime),
          appointmentEndDate: MoreThanOrEqual(args.endDateTime),
        },
      ],
    });

    if (clashAppointments.length > 0) {
      throw new BadRequestException('Clash with existing appointments');
    }

    const newAppointment = new Appointment({
      appointmentStartDate: args.startDateTime,
      appointmentEndDate: args.endDateTime,
    });

    return await this.appointmentRepository.save(newAppointment);
  };

  cancelAppointment = async (args: { appointmentId: number }) => {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: args.appointmentId },
    });
    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    const utcNow = new Date();
    if (appointment.appointmentStartDate < utcNow) {
      throw new BadRequestException('Cannot cancel appointment in the past');
    }

    return await this.appointmentRepository.remove(appointment);
  };
}

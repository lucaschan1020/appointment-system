import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from 'src/database/abstract.repository';
import { Appointment } from 'src/models/appointment.entity';
import { EntityManager, Repository } from 'typeorm';

export class AppointmentRepository extends AbstractRepository<Appointment> {
  protected readonly logger = new Logger(Appointment.name);

  constructor(
    @InjectRepository(Appointment)
    repository: Repository<Appointment>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }
}

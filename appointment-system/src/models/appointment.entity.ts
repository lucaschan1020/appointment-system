import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Appointment extends AbstractEntity<Appointment> {
  @Column({ type: 'timestamp without time zone' })
  appointmentStartDate: Date;

  @Column({ type: 'timestamp without time zone' })
  appointmentEndDate: Date;
}

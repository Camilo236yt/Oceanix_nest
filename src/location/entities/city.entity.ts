import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index, JoinColumn } from 'typeorm';
import { State } from './state.entity';
import { Address } from './address.entity';

@Entity('cities')
@Index('idx_cities_name_state', ['name', 'stateId'])
@Index('idx_cities_postal_code', ['postalCode'])
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string; // Código postal

  @Column({ type: 'varchar', length: 10, nullable: true })
  areaCode: string; // Código de área telefónica

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'int', nullable: true })
  population: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone: string; // America/Bogota, America/Mexico_City, etc.

  @Column({ type: 'bool', default: false })
  isCapital: boolean; // Si es capital del departamento/estado

  @Column({ type: 'bool', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Column({ type: 'uuid' })
  stateId: string;

  @ManyToOne(() => State, (state) => state.cities, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'stateId' })
  state: State;

  @OneToMany(() => Address, (address) => address.city)
  addresses: Address[];
}
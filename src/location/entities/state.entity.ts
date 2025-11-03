import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index, JoinColumn } from 'typeorm';
import { Country } from './country.entity';
import { City } from './city.entity';
import { Address } from './address.entity';

@Entity('states')
@Index('idx_states_name_country', ['name', 'countryId'])
@Index('idx_states_code', ['code'])
export class State {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  code: string; // Estado/Departamento code (CUN, ANT, VAL, etc.)

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string; // Department, State, Province, Region, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  capital: string; // Capital del departamento/estado

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'bool', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Column({ type: 'uuid' })
  countryId: string;

  @ManyToOne(() => Country, (country) => country.states, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'countryId' })
  country: Country;

  @OneToMany(() => City, (city) => city.state)
  cities: City[];

  @OneToMany(() => Address, (address) => address.state)
  addresses: Address[];
}
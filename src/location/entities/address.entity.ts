import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index, JoinColumn } from 'typeorm';
import { Country } from './country.entity';
import { State } from './state.entity';
import { City } from './city.entity';
import { User } from '../../users/entities/user.entity';
import { Enterprise } from '../../enterprise/entities/enterprise.entity';

@Entity('addresses')
@Index('idx_addresses_postal_code', ['postalCode'])
@Index('idx_addresses_city', ['cityId'])
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  streetAddress: string; // Dirección principal (Calle 100 #15-20)

  @Column({ type: 'varchar', length: 100, nullable: true })
  neighborhood: string; // Barrio/Colonia

  @Column({ type: 'varchar', length: 100, nullable: true })
  locality: string; // Localidad/Comuna/Distrito

  @Column({ type: 'varchar', length: 50, nullable: true })
  apartment: string; // Apartamento, suite, unidad, etc.

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string;

  @Column({ type: 'text', nullable: true })
  additionalInfo: string; // Información adicional para encontrar la dirección

  @Column({ type: 'text', nullable: true })
  references: string; // Referencias del lugar

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 50, default: 'primary' })
  type: string; // primary, billing, shipping, work, home, etc.

  @Column({ type: 'bool', default: true })
  isActive: boolean;

  @Column({ type: 'bool', default: false })
  isDefault: boolean; // Dirección por defecto

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Column({ type: 'uuid' })
  countryId: string;

  @ManyToOne(() => Country, (country) => country.addresses, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'countryId' })
  country: Country;

  @Column({ type: 'uuid' })
  stateId: string;

  @ManyToOne(() => State, (state) => state.addresses, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'stateId' })
  state: State;

  @Column({ type: 'uuid' })
  cityId: string;

  @ManyToOne(() => City, (city) => city.addresses, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'cityId' })
  city: City;

  // Polimorfismo para usuarios y empresas
  @OneToMany(() => User, (user) => user.address)
  users: User[];

  @OneToMany(() => Enterprise, (enterprise) => enterprise.address)
  enterprises: Enterprise[];
}
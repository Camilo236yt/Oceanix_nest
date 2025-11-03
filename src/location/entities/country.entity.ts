import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { State } from './state.entity';
import { Address } from './address.entity';

@Entity('countries')
@Index('idx_countries_code', ['code'], { unique: true })
@Index('idx_countries_name', ['name'])
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 3, unique: true })
  code: string; // ISO 3166-1 alpha-3 (COL, USA, MEX, etc.)

  @Column({ type: 'varchar', length: 2, unique: true })
  iso2: string; // ISO 3166-1 alpha-2 (CO, US, MX, etc.)

  @Column({ type: 'varchar', length: 5, nullable: true })
  phoneCode: string; // +57, +1, +52, etc.

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency: string; // COP, USD, MXN, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  capital: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  region: string; // Americas, Europe, Asia, etc.

  @Column({ type: 'varchar', length: 50, nullable: true })
  subregion: string; // South America, North America, etc.

  @Column({ type: 'bool', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => State, (state) => state.country)
  states: State[];

  @OneToMany(() => Address, (address) => address.country)
  addresses: Address[];
}
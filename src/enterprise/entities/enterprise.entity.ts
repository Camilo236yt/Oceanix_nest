import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Address } from '../../location/entities/address.entity';
import { BusinessIdentificationType } from '../../users/constants';
import { EnterpriseConfig } from '../../enterprise-config/entities/enterprise-config.entity';
import { EnterpriseDocument } from '../../enterprise-config/entities/enterprise-document.entity';
import { Incidencia } from '../../incidencias/entities/incidencia.entity';

@Entity('enterprises')
@Index('idx_enterprises_name', { synchronize: false })
@Index('idx_enterprises_subdomain', { synchronize: false })
export class Enterprise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  subdomain: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  // Relación con Address
  @Column({ type: 'uuid', nullable: true })
  addressId: string;

  @ManyToOne(() => Address, (address) => address.enterprises, {
    nullable: true,
    eager: true
  })
  @JoinColumn({ name: 'addressId' })
  address: Address;

  @Column({ type: 'enum', enum: BusinessIdentificationType, nullable: true })
  taxIdType: BusinessIdentificationType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxIdNumber: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string;

  @Column({ type: 'bool', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.enterprise)
  users: User[];

  @OneToMany(() => Role, (role) => role.enterprise)
  roles: Role[];

  @OneToMany(() => Incidencia, (incidencia) => incidencia.enterprise)
  incidencias: Incidencia[];

  @OneToOne(() => EnterpriseConfig, (config) => config.enterprise, {
    nullable: true,
    cascade: true,
  })
  config: EnterpriseConfig;

  @OneToMany(() => EnterpriseDocument, (document) => document.enterprise)
  documents: EnterpriseDocument[];
}

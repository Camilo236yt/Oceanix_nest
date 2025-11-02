import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text' })
  description?: string;

  @Column({ type: 'bool', default: true })
  isActive?: boolean;

  @ManyToOne(() => Permission, (permission) => permission.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  parent?: Permission;

  @OneToMany(() => Permission, (permission) => permission.parent)
  children?: Permission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

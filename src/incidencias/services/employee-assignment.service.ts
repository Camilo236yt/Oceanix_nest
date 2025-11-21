import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Incidencia } from '../entities/incidencia.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/entities/user-role.entity';
import { Role } from '../../roles/entities/role.entity';
import { IncidenciaStatus } from '../enums/incidencia.enums';

@Injectable()
export class EmployeeAssignmentService {
  private readonly logger = new Logger(EmployeeAssignmentService.name);

  constructor(
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Get the employee with the least workload for automatic assignment
   * @param enterpriseId Enterprise ID
   * @returns User ID of the employee with least active incidencias, or null if none available
   */
  async getEmployeeWithLeastWorkload(enterpriseId: string): Promise<string | null> {
    // 1. Get employees with roles that can receive incidents
    const employees = await this.getEmployeesCanReceiveIncidents(enterpriseId);

    if (employees.length === 0) {
      this.logger.warn(`No employees with canReceiveIncidents role found for tenant ${enterpriseId}`);
      return null;
    }

    // 2. Count active incidencias for each employee
    const workloads = await Promise.all(
      employees.map(async (employee) => ({
        userId: employee.id,
        email: employee.email,
        count: await this.countActiveIncidencias(employee.id),
      }))
    );

    // 3. Sort by workload (ascending) and return the one with least
    workloads.sort((a, b) => a.count - b.count);

    const selected = workloads[0];
    this.logger.log(
      `Selected employee ${selected.email} with ${selected.count} active incidencias for assignment`
    );

    return selected.userId;
  }

  /**
   * Get all employees in a tenant that have a role with canReceiveIncidents = true
   */
  private async getEmployeesCanReceiveIncidents(enterpriseId: string): Promise<User[]> {
    // 1. Find all roles in this tenant that can receive incidents
    const roles = await this.roleRepository.find({
      where: {
        enterpriseId: enterpriseId,
        canReceiveIncidents: true,
        isActive: true,
      },
    });

    if (roles.length === 0) {
      return [];
    }

    const roleIds = roles.map((r) => r.id);

    // 2. Find all user-role assignments for these roles
    const userRoles = await this.userRoleRepository.find({
      where: {
        roleId: In(roleIds),
        enterpriseId: enterpriseId,
      },
    });

    const userIds = [...new Set(userRoles.map((ur) => ur.userId))];

    if (userIds.length === 0) {
      return [];
    }

    // 3. Get the actual user entities
    const employees = await this.userRepository.find({
      where: {
        id: In(userIds),
        isActive: true,
        enterpriseId: enterpriseId,
      },
      select: ['id', 'email', 'name', 'lastName'],
    });

    return employees;
  }

  /**
   * Count active (PENDING or IN_PROGRESS) incidencias assigned to an employee
   */
  private async countActiveIncidencias(employeeId: string): Promise<number> {
    return await this.incidenciaRepository.count({
      where: {
        assignedEmployeeId: employeeId,
        status: In([IncidenciaStatus.PENDING, IncidenciaStatus.IN_PROGRESS]),
        isActive: true,
      },
    });
  }
}

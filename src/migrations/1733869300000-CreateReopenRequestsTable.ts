import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateReopenRequestsTable1733869300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla incidencia_reopen_requests
    await queryRunner.createTable(
      new Table({
        name: 'incidencia_reopen_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'incidenciaId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'requestedByUserId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'clientReason',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: "'PENDING'",
            isNullable: false,
          },
          {
            name: 'reviewedByUserId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'reviewNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reviewedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'enterpriseId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'incidencia_reopen_requests',
      new TableIndex({
        name: 'idx_reopen_requests_incidencia',
        columnNames: ['incidenciaId'],
      }),
    );

    await queryRunner.createIndex(
      'incidencia_reopen_requests',
      new TableIndex({
        name: 'idx_reopen_requests_enterprise',
        columnNames: ['enterpriseId'],
      }),
    );

    await queryRunner.createIndex(
      'incidencia_reopen_requests',
      new TableIndex({
        name: 'idx_reopen_requests_status',
        columnNames: ['status'],
      }),
    );

    // Crear foreign keys
    await queryRunner.createForeignKey(
      'incidencia_reopen_requests',
      new TableForeignKey({
        columnNames: ['incidenciaId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'incidencias',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'incidencia_reopen_requests',
      new TableForeignKey({
        columnNames: ['requestedByUserId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'incidencia_reopen_requests',
      new TableForeignKey({
        columnNames: ['reviewedByUserId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla (las foreign keys se eliminan automáticamente)
    await queryRunner.dropTable('incidencia_reopen_requests', true);
  }
}

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFinalStateTracking1733869200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna finalStateReachedAt a la tabla incidencias
    await queryRunner.addColumn(
      'incidencias',
      new TableColumn({
        name: 'finalStateReachedAt',
        type: 'timestamp',
        isNullable: true,
        default: null,
      }),
    );

    // Backfill: Actualizar incidencias existentes en estados finales
    // Usamos updatedAt como valor inicial para incidencias cerradas/canceladas/resueltas
    await queryRunner.query(`
      UPDATE incidencias
      SET "finalStateReachedAt" = "updatedAt"
      WHERE status IN ('CLOSED', 'CANCELLED', 'RESOLVED')
        AND "finalStateReachedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna
    await queryRunner.dropColumn('incidencias', 'finalStateReachedAt');
  }
}

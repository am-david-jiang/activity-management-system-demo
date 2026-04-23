import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1776968164041 implements MigrationInterface {
  name = 'InitialSchema1776968164041';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`roles\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`name\` enum ('user', 'admin') NOT NULL DEFAULT 'user', UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`name\` varchar(100) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_users_email\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`credentials\` (\`id\` varchar(36) NOT NULL, \`password\` varchar(255) NOT NULL, \`refresh_token\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(36) NOT NULL, UNIQUE INDEX \`IDX_credentials_refresh_token\` (\`refresh_token\`), UNIQUE INDEX \`UQ_credentials_user_id\` (\`user_id\`), UNIQUE INDEX \`REL_c68a6c53e95a7dc357f4ebce8f\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`participants\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`user_id\` char(36) NOT NULL, \`name\` varchar(32) NOT NULL, \`email\` varchar(255) NULL, \`phone_number\` varchar(11) NOT NULL, \`weixin_account\` varchar(64) NULL, \`qq_account\` varchar(64) NULL, UNIQUE INDEX \`IDX_participants_user_id\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`events\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`title\` varchar(140) NOT NULL, \`description\` text NULL, \`start_date\` datetime(6) NOT NULL, \`end_date\` datetime(6) NOT NULL, \`address\` varchar(255) NOT NULL, \`activity_id\` int UNSIGNED NOT NULL, INDEX \`IDX_events_activity_id\` (\`activity_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activities\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`activity_name\` varchar(255) NOT NULL, \`start_date\` date NOT NULL, \`end_date\` date NOT NULL, \`budget\` decimal(14,2) NOT NULL, \`apply_end_date\` date NOT NULL, \`status\` varchar(32) NOT NULL DEFAULT 'active', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`poster_generation_logs\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`activity_id\` int UNSIGNED NOT NULL, \`prompt\` text NOT NULL, \`image_url\` varchar(2048) NULL, \`status\` enum ('pending', 'success', 'failed') NOT NULL DEFAULT 'pending', \`retry_count\` int UNSIGNED NOT NULL DEFAULT '0', \`error_message\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`completed_at\` datetime(6) NULL, INDEX \`IDX_poster_generation_logs_activity_id\` (\`activity_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_roles\` (\`user_id\` varchar(36) NOT NULL, \`role_id\` int UNSIGNED NOT NULL, INDEX \`IDX_87b8888186ca9769c960e92687\` (\`user_id\`), INDEX \`IDX_b23c65e50a758245a33ee35fda\` (\`role_id\`), PRIMARY KEY (\`user_id\`, \`role_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`activity_participants\` (\`participant_id\` int UNSIGNED NOT NULL, \`activity_id\` int UNSIGNED NOT NULL, INDEX \`IDX_1c3b882b84cc5d51780f68083f\` (\`participant_id\`), INDEX \`IDX_9cb6d690439d69efb428151cf0\` (\`activity_id\`), PRIMARY KEY (\`participant_id\`, \`activity_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`credentials\` ADD CONSTRAINT \`FK_c68a6c53e95a7dc357f4ebce8f0\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`events\` ADD CONSTRAINT \`FK_c2e6a3b0b54da0d73b130d83d52\` FOREIGN KEY (\`activity_id\`) REFERENCES \`activities\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`poster_generation_logs\` ADD CONSTRAINT \`FK_eeb12cc2a27583de023e8ab7869\` FOREIGN KEY (\`activity_id\`) REFERENCES \`activities\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_87b8888186ca9769c960e926870\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_b23c65e50a758245a33ee35fda1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_participants\` ADD CONSTRAINT \`FK_1c3b882b84cc5d51780f68083f5\` FOREIGN KEY (\`participant_id\`) REFERENCES \`participants\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_participants\` ADD CONSTRAINT \`FK_9cb6d690439d69efb428151cf0a\` FOREIGN KEY (\`activity_id\`) REFERENCES \`activities\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`activity_participants\` DROP FOREIGN KEY \`FK_9cb6d690439d69efb428151cf0a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`activity_participants\` DROP FOREIGN KEY \`FK_1c3b882b84cc5d51780f68083f5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_b23c65e50a758245a33ee35fda1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_87b8888186ca9769c960e926870\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`poster_generation_logs\` DROP FOREIGN KEY \`FK_eeb12cc2a27583de023e8ab7869\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`events\` DROP FOREIGN KEY \`FK_c2e6a3b0b54da0d73b130d83d52\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`credentials\` DROP FOREIGN KEY \`FK_c68a6c53e95a7dc357f4ebce8f0\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9cb6d690439d69efb428151cf0\` ON \`activity_participants\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_1c3b882b84cc5d51780f68083f\` ON \`activity_participants\``,
    );
    await queryRunner.query(`DROP TABLE \`activity_participants\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_b23c65e50a758245a33ee35fda\` ON \`user_roles\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_87b8888186ca9769c960e92687\` ON \`user_roles\``,
    );
    await queryRunner.query(`DROP TABLE \`user_roles\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_poster_generation_logs_activity_id\` ON \`poster_generation_logs\``,
    );
    await queryRunner.query(`DROP TABLE \`poster_generation_logs\``);
    await queryRunner.query(`DROP TABLE \`activities\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_events_activity_id\` ON \`events\``,
    );
    await queryRunner.query(`DROP TABLE \`events\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_participants_user_id\` ON \`participants\``,
    );
    await queryRunner.query(`DROP TABLE \`participants\``);
    await queryRunner.query(
      `DROP INDEX \`REL_c68a6c53e95a7dc357f4ebce8f\` ON \`credentials\``,
    );
    await queryRunner.query(
      `DROP INDEX \`UQ_credentials_user_id\` ON \`credentials\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_credentials_refresh_token\` ON \`credentials\``,
    );
    await queryRunner.query(`DROP TABLE \`credentials\``);
    await queryRunner.query(`DROP INDEX \`IDX_users_email\` ON \`users\``);
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``,
    );
    await queryRunner.query(`DROP TABLE \`roles\``);
  }
}

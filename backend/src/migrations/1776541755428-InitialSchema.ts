import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1776541755428 implements MigrationInterface {
  name = 'InitialSchema1776541755428';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."roles_name_enum" AS ENUM('user', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" "public"."roles_name_enum" NOT NULL DEFAULT 'user', CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "credentials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "password" character varying NOT NULL, "refresh_token" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "UQ_fce9200db924066bd1d3248dc0c" UNIQUE ("refresh_token"), CONSTRAINT "REL_8d3a07b8e994962efe57ebd0f2" UNIQUE ("userId"), CONSTRAINT "PK_1e38bc43be6697cdda548ad27a6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "participants" ("id" SERIAL NOT NULL, "user_id" character varying(36) NOT NULL, "name" character varying(32) NOT NULL, "email" character varying, "phone_number" character varying(11) NOT NULL, "weixin_account" character varying, "qq_account" character varying, CONSTRAINT "UQ_1427a77e06023c250ed3794a1ba" UNIQUE ("user_id"), CONSTRAINT "PK_1cda06c31eec1c95b3365a0283f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "events" ("id" SERIAL NOT NULL, "title" character varying(140) NOT NULL, "description" text, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "address" character varying(255) NOT NULL, "activity_id" integer NOT NULL, CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "activities" ("id" SERIAL NOT NULL, "activity_name" character varying NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "budget" numeric(14,2) NOT NULL, "apply_end_date" date NOT NULL, "status" character varying NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."poster_generation_logs_status_enum" AS ENUM('pending', 'success', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "poster_generation_logs" ("id" SERIAL NOT NULL, "activity_id" integer NOT NULL, "prompt" text NOT NULL, "image_url" text, "status" "public"."poster_generation_logs_status_enum" NOT NULL DEFAULT 'pending', "retry_count" integer NOT NULL DEFAULT '0', "error_message" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "completed_at" TIMESTAMP, CONSTRAINT "PK_190e49e14cac06874f6d46bb900" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role_id" integer NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "activity_participants" ("participant_id" integer NOT NULL, "activity_id" integer NOT NULL, CONSTRAINT "PK_41029616818871d2d45ccc2fcfc" PRIMARY KEY ("participant_id", "activity_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1c3b882b84cc5d51780f68083f" ON "activity_participants" ("participant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9cb6d690439d69efb428151cf0" ON "activity_participants" ("activity_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "credentials" ADD CONSTRAINT "FK_8d3a07b8e994962efe57ebd0f20" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD CONSTRAINT "FK_c2e6a3b0b54da0d73b130d83d52" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_participants" ADD CONSTRAINT "FK_1c3b882b84cc5d51780f68083f5" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_participants" ADD CONSTRAINT "FK_9cb6d690439d69efb428151cf0a" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_participants" DROP CONSTRAINT "FK_9cb6d690439d69efb428151cf0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_participants" DROP CONSTRAINT "FK_1c3b882b84cc5d51780f68083f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT "FK_c2e6a3b0b54da0d73b130d83d52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credentials" DROP CONSTRAINT "FK_8d3a07b8e994962efe57ebd0f20"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9cb6d690439d69efb428151cf0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1c3b882b84cc5d51780f68083f"`,
    );
    await queryRunner.query(`DROP TABLE "activity_participants"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b23c65e50a758245a33ee35fda"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`,
    );
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "poster_generation_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."poster_generation_logs_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "activities"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TABLE "participants"`);
    await queryRunner.query(`DROP TABLE "credentials"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TYPE "public"."roles_name_enum"`);
  }
}

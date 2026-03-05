import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

/**
 * Shared Prisma client with explicit PostgreSQL pool lifecycle management.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const adapter = new PrismaPg(pool);

    super({ adapter });

    this.pool = pool;
  }

  /**
   * Connects Prisma when Nest initializes this provider.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Closes Prisma and underlying pg pool during shutdown.
   */
  async onModuleDestroy() {
    // Disconnect Prisma + close PG pool
    await this.$disconnect();
    await this.pool.end();
  }
}

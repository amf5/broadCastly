import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { logger } from '../../utils/logger.js';

dotenv.config();

/**
 * MySQL / TiDB Cloud Configuration
 */
export const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',

  port: parseInt(
    process.env.MYSQL_PORT || '3306',
    10
  ),

  user: process.env.MYSQL_USER || 'root',

  password: process.env.MYSQL_PASSWORD || '',

  database: process.env.MYSQL_DATABASE || 'live_stream',

  /**
   * Connection Pool
   */
  connectionLimit: parseInt(
    process.env.MYSQL_POOL_SIZE || '20',
    10
  ),

  waitForConnections: true,

  queueLimit: 0,

  /**
   * Connection Timeout
   */
  connectTimeout: parseInt(
    process.env.MYSQL_CONNECT_TIMEOUT || '30000',
    10
  ),

  /**
   * SSL
   *
   * TiDB Cloud requires SSL.
   */
  ssl:
    process.env.MYSQL_SSL === 'true'
      ? {
          rejectUnauthorized:
            process.env.MYSQL_SSL_REJECT === 'true',
        }
      : undefined,

  /**
   * TiDB Cloud Authentication
   *
   * TiDB may request mysql_clear_password
   * during authentication.
   *
   * This is safe when the connection is protected
   * by SSL/TLS.
   */
  enableCleartextPlugin: true,

  /**
   * Other MySQL options
   */
  charset: 'utf8mb4',

  timezone: '+00:00',

  supportBigNumbers: true,

  bigNumberStrings: true,

  multipleStatements: false,

  dateStrings: true,
};

/**
 * MySQL Connection Pool
 */
export const mysqlPool =
  mysql.createPool(mysqlConfig);

/**
 * Connect / Verify MySQL
 */
export const connectMySQL = async (
  retries: number = 5
): Promise<void> => {
  let attempt = 0;

  while (attempt < retries) {
    let connection:
      | mysql.PoolConnection
      | undefined;

    try {
      connection =
        await mysqlPool.getConnection();

      console.log(
        `✅ MySQL connected successfully (${process.env.MYSQL_HOST})`
      );

      logger.info(
        `MySQL connected successfully (${process.env.MYSQL_HOST})`
      );

      /**
       * Verify the connection with a simple query.
       */
      await connection.query(`
        SELECT
          1 AS connected,
          VERSION() AS version,
          DATABASE() AS db_name
      `);

      console.log('✅ Connection verified');

      connection.release();

      return;
    } catch (error) {
      attempt++;

      if (connection) {
        connection.release();
      }

      console.error(
        `❌ MySQL connection error (attempt ${attempt}/${retries}):`,
        error
      );

      logger.error(
        `MySQL connection error (attempt ${attempt}/${retries}):`,
        error
      );

      if (attempt < retries) {
        const waitTime = attempt * 2000;

        console.log(
          `🔄 Retrying in ${waitTime / 1000} seconds...`
        );

        await new Promise<void>((resolve) =>
          setTimeout(resolve, waitTime)
        );
      } else {
        throw new Error(
          `Failed to connect to MySQL after ${retries} attempts`
        );
      }
    }
  }
};

/**
 * Disconnect MySQL
 */
export const disconnectMySQL =
  async (): Promise<void> => {
    try {
      await mysqlPool.end();

      console.log('✅ MySQL disconnected');

      logger.info('MySQL disconnected');
    } catch (error) {
      logger.error(
        'Error disconnecting MySQL:',
        error
      );
    }
  };

/**
 * Execute Query
 *
 * Values are passed separately using `?`
 * placeholders to protect against SQL injection.
 */
export const query = async <T = any>(
  sql: string,
  params?: any[]
): Promise<T> => {
  const startTime = Date.now();

  try {
    const [rows] =
      await mysqlPool.execute(
        sql,
        params
      );

    const duration =
      Date.now() - startTime;

    /**
     * Log slow queries
     */
    if (duration > 1000) {
      logger.warn(
        'Slow query detected:',
        {
          sql,
          params,
          duration: `${duration}ms`,
        }
      );
    }

    return rows as T;
  } catch (error) {
    logger.error(
      'MySQL query error:',
      {
        sql,
        params,
        error,
      }
    );

    throw error;
  }
};

/**
 * Transaction
 */
export const transaction = async <T>(
  callback: (
    connection: mysql.PoolConnection
  ) => Promise<T>
): Promise<T> => {
  const connection =
    await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    const result =
      await callback(connection);

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();

    logger.error(
      'Transaction failed:',
      error
    );

    throw error;
  } finally {
    connection.release();
  }
};

/**
 * MySQL Health Check
 */
export const healthCheckMySQL =
  async (): Promise<{
    status: boolean;
    details: any;
  }> => {
    try {
      const startTime =
        Date.now();

      const [rows] =
        await mysqlPool.query(`
          SELECT
            1 AS health,
            NOW() AS time,
            DATABASE() AS db_name,
            VERSION() AS version
        `);

      const responseTime =
        Date.now() - startTime;

      const pool =
        mysqlPool as any;

      return {
        status: true,

        details: {
          ...(rows as any)[0],

          responseTime:
            `${responseTime}ms`,

          poolSize:
            pool.config?.connectionLimit || 0,

          totalConnections:
            pool._allConnections?.length || 0,

          freeConnections:
            pool._freeConnections?.length || 0,

          queueLength:
            pool._queue?.length || 0,

          isConnected:
            pool._closed === false,

          host:
            process.env.MYSQL_HOST,

          database:
            process.env.MYSQL_DATABASE,
        },
      };
    } catch (error) {
      return {
        status: false,

        details: {
          error:
            (error as Error).message,

          timestamp:
            new Date().toISOString(),
        },
      };
    }
  };

/**
 * Connection Pool Statistics
 */
export const getPoolStats = () => {
  const pool =
    mysqlPool as any;

  return {
    connectionLimit:
      pool.config?.connectionLimit || 0,

    totalConnections:
      pool._allConnections?.length || 0,

    freeConnections:
      pool._freeConnections?.length || 0,

    queueLength:
      pool._queue?.length || 0,

    isConnected:
      pool._closed === false,

    poolSize:
      pool.config?.connectionLimit || 0,
  };
};

/**
 * Simple Database Helpers
 */
export const db = {
  /**
   * Find One
   */
  async findOne<T = any>(
    table: string,
    where: Record<string, any>
  ): Promise<T | null> {
    const keys =
      Object.keys(where);

    if (keys.length === 0) {
      throw new Error(
        'Where clause is empty'
      );
    }

    const conditions =
      keys
        .map(
          (key) => `${key} = ?`
        )
        .join(' AND ');

    const values =
      Object.values(where);

    const sql = `
      SELECT *
      FROM ${table}
      WHERE ${conditions}
      LIMIT 1
    `;

    const rows =
      await query<T[]>(
        sql,
        values
      );

    return rows[0] || null;
  },

  /**
   * Find Many
   */
  async findMany<T = any>(
    table: string,
    where: Record<string, any> = {},
    limit: number = 50
  ): Promise<T[]> {
    const safeLimit =
      Number.isInteger(limit) &&
      limit > 0
        ? Math.min(limit, 1000)
        : 50;

    const keys =
      Object.keys(where);

    if (keys.length === 0) {
      const sql = `
        SELECT *
        FROM ${table}
        LIMIT ${safeLimit}
      `;

      return await query<T[]>(sql);
    }

    const conditions =
      keys
        .map(
          (key) => `${key} = ?`
        )
        .join(' AND ');

    const values =
      Object.values(where);

    const sql = `
      SELECT *
      FROM ${table}
      WHERE ${conditions}
      LIMIT ${safeLimit}
    `;

    return await query<T[]>(
      sql,
      values
    );
  },

  /**
   * Create
   */
  async create<T = any>(
    table: string,
    data: Record<string, any>
  ): Promise<T> {
    const keys =
      Object.keys(data);

    if (keys.length === 0) {
      throw new Error(
        'Data cannot be empty'
      );
    }

    const placeholders =
      keys
        .map(() => '?')
        .join(', ');

    const values =
      Object.values(data);

    const sql = `
      INSERT INTO ${table}
      (${keys.join(', ')})
      VALUES (${placeholders})
    `;

    const result =
      await query<any>(
        sql,
        values
      );

    return {
      ...data,
      insertId: result.insertId,
    } as T;
  },

  /**
   * Update
   */
  async update<T = any>(
    table: string,
    id: string | number,
    data: Record<string, any>
  ): Promise<T | null> {
    const keys =
      Object.keys(data);

    if (keys.length === 0) {
      throw new Error(
        'Update data cannot be empty'
      );
    }

    const sets =
      keys
        .map(
          (key) => `${key} = ?`
        )
        .join(', ');

    const values = [
      ...Object.values(data),
      id,
    ];

    const sql = `
      UPDATE ${table}
      SET ${sets}
      WHERE id = ?
    `;

    await query(
      sql,
      values
    );

    return this.findOne<T>(
      table,
      { id }
    );
  },

  /**
   * Delete
   */
  async delete(
    table: string,
    id: string | number
  ): Promise<boolean> {
    const sql = `
      DELETE FROM ${table}
      WHERE id = ?
    `;

    const result =
      await query<any>(
        sql,
        [id]
      );

    return result.affectedRows > 0;
  },

  /**
   * Count
   */
  async count(
    table: string,
    where: Record<string, any> = {}
  ): Promise<number> {
    const keys =
      Object.keys(where);

    if (keys.length === 0) {
      const sql = `
        SELECT COUNT(*) AS total
        FROM ${table}
      `;

      const result =
        await query<any>(sql);

      return Number(
        result[0].total
      );
    }

    const conditions =
      keys
        .map(
          (key) => `${key} = ?`
        )
        .join(' AND ');

    const values =
      Object.values(where);

    const sql = `
      SELECT COUNT(*) AS total
      FROM ${table}
      WHERE ${conditions}
    `;

    const result =
      await query<any>(
        sql,
        values
      );

    return Number(
      result[0].total
    );
  },
};

/**
 * Default Export
 */
export default {
  mysqlPool,
  mysqlConfig,
  connectMySQL,
  disconnectMySQL,
  query,
  transaction,
  healthCheckMySQL,
  getPoolStats,
  db,
};
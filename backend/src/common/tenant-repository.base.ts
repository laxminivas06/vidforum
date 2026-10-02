import { PoolClient, QueryResult } from 'pg';
import { db } from '../config/database';
import { TenantViolationError, ResourceNotFoundError } from './error-format';

export interface BaseEntity {
  id: string;
  institution_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string | null;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * TenantScopedRepository
 * Enforces Rule 6: Every tenant-owned record carries institution_id and query isolation
 */
export abstract class TenantScopedRepository<T extends BaseEntity> {
  protected readonly tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Validates that institutionId is present and non-empty. Throws TenantViolationError otherwise.
   */
  protected validateTenant(institutionId: string): void {
    if (!institutionId || typeof institutionId !== 'string' || !institutionId.trim()) {
      throw new TenantViolationError('Mandatory tenant context (institution_id) is missing');
    }
  }

  /**
   * Find a single entity by ID strictly scoped to institution_id
   */
  public async findById(institutionId: string, id: string): Promise<T | null> {
    this.validateTenant(institutionId);

    const query = `
      SELECT * FROM ${this.tableName}
      WHERE institution_id = $1 
        AND id = $2 
        AND (deleted_at IS NULL)
      LIMIT 1
    `;
    const res = await db.query(query, [institutionId, id]);
    return (res.rows[0] as T) || null;
  }

  /**
   * Find a single entity or throw 404 ResourceNotFoundError
   */
  public async findByIdOrFail(institutionId: string, id: string): Promise<T> {
    const record = await this.findById(institutionId, id);
    if (!record) {
      throw new ResourceNotFoundError(this.tableName, id);
    }
    return record;
  }

  /**
   * Find many records with pagination and sorting strictly scoped to institution_id
   */
  public async findMany(
    institutionId: string,
    options: PaginationOptions = {},
    customWhereClause: string = '',
    customParams: any[] = []
  ): Promise<PaginatedResult<T>> {
    this.validateTenant(institutionId);

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;
    const sortOrder = options.sortOrder === 'DESC' ? 'DESC' : 'ASC';
    const sortBy = options.sortBy || 'created_at';

    // Base parameters always starts with institutionId
    const baseParams: any[] = [institutionId, ...customParams];
    const whereConditions = [
      'institution_id = $1',
      'deleted_at IS NULL',
    ];

    if (customWhereClause) {
      whereConditions.push(customWhereClause);
    }

    const whereStr = whereConditions.join(' AND ');

    // 1. Total count query
    const countQuery = `SELECT count(*)::int as total FROM ${this.tableName} WHERE ${whereStr}`;
    const countRes = await db.query(countQuery, baseParams);
    const total = countRes.rows[0]?.total || 0;

    // 2. Paginated data query
    const limitParamIndex = baseParams.length + 1;
    const offsetParamIndex = baseParams.length + 2;

    const dataQuery = `
      SELECT * FROM ${this.tableName}
      WHERE ${whereStr}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const dataRes = await db.query(dataQuery, [...baseParams, limit, offset]);

    return {
      items: dataRes.rows as T[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Soft delete an entity within the tenant
   */
  public async softDelete(institutionId: string, id: string, deletedBy?: string): Promise<boolean> {
    this.validateTenant(institutionId);

    const query = `
      UPDATE ${this.tableName}
      SET deleted_at = now(), updated_at = now()
      WHERE institution_id = $1 AND id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const res = await db.query(query, [institutionId, id]);
    return (res.rowCount || 0) > 0;
  }
}

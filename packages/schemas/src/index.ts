import { z } from 'zod';

/**
 * Common Base Entity Schema
 */
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  institution_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid().optional(),
  updated_by: z.string().uuid().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
});

/**
 * Standard Pagination Request Schema
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['ASC', 'DESC']).default('ASC'),
  search: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * Standard API Success Envelope Schema
 */
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
    meta: z
      .object({
        page: z.number().optional(),
        limit: z.number().optional(),
        total: z.number().optional(),
        totalPages: z.number().optional(),
        timestamp: z.string().optional(),
      })
      .optional(),
  });

/**
 * Standard API Error Envelope Schema
 */
export const ApiErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(ApiErrorDetailSchema).optional(),
  }),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string().optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorSchema>;

/**
 * Tenant Identification Schema
 */
export const TenantContextSchema = z.object({
  institutionId: z.string().uuid(),
  institutionCode: z.string().min(2).max(20),
  institutionName: z.string().min(1),
});

export type TenantContext = z.infer<typeof TenantContextSchema>;

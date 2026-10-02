/**
 * Standardized API Error Envelopes for VID Platform
 * Strictly enforces Section 18 error format and Rule 6/26 server-side contracts
 */

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[];

  constructor(message: string, statusCode: number = 400, code: string = 'BAD_REQUEST', details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TenantViolationError extends AppError {
  constructor(message: string = 'Cross-tenant resource access forbidden', institutionId?: string) {
    super(message, 403, 'CROSS_TENANT_ACCESS_DENIED', institutionId ? [{ field: 'institution_id', message: `Unauthorized tenant: ${institutionId}` }] : undefined);
    this.name = 'TenantViolationError';
  }
}

export class PermissionDeniedError extends AppError {
  constructor(permissionCode: string) {
    super(`Insufficient privileges: required permission '${permissionCode}' missing`, 403, 'PERMISSION_DENIED', [{ field: 'permission', message: permissionCode }]);
    this.name = 'PermissionDeniedError';
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    super(`${resource}${identifier ? ` '${identifier}'` : ''} not found or inaccessible in current tenant`, 404, 'NOT_FOUND');
    this.name = 'ResourceNotFoundError';
  }
}

export function formatErrorResponse(err: Error | AppError, requestId?: string): { statusCode: number; payload: ApiErrorResponse } {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      payload: {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      },
    };
  }

  // Fallback for unhandled exceptions
  return {
    statusCode: 500,
    payload: {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected internal system error occurred',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    },
  };
}

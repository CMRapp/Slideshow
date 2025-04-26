import { DatabaseError, ErrorResponse } from '../types/database';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleDatabaseError(error: unknown): ErrorResponse {
  const dbError = error as DatabaseError;
  console.error('Database error:', {
    message: dbError.message,
    code: dbError.code,
    detail: dbError.detail,
    stack: dbError.stack
  });

  return {
    error: 'Database operation failed',
    details: dbError.message,
    code: dbError.code,
    timestamp: new Date().toISOString()
  };
}

export function handleAppError(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: error.message,
      details: error.details,
      code: error.code,
      timestamp: new Date().toISOString()
    };
  }

  const unknownError = error as Error;
  console.error('Unexpected error:', {
    message: unknownError.message,
    stack: unknownError.stack
  });

  return {
    error: 'An unexpected error occurred',
    details: unknownError.message,
    timestamp: new Date().toISOString()
  };
}

export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new AppError(
      `Missing required fields: ${missingFields.join(', ')}`,
      400,
      'MISSING_FIELDS'
    );
  }
}

export function validateFileType(
  mimeType: string,
  allowedTypes: string[]
): void {
  if (!allowedTypes.includes(mimeType)) {
    throw new AppError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      400,
      'INVALID_FILE_TYPE'
    );
  }
}

export function validateFileSize(
  fileSize: number,
  maxSize: number
): void {
  if (fileSize > maxSize) {
    throw new AppError(
      `File size exceeds maximum allowed size of ${maxSize} bytes`,
      400,
      'FILE_TOO_LARGE'
    );
  }
} 
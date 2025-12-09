import HTTP_STATUS from "http-status";

type ErrorOptions = {
  statusCode?: number;
  code?: string;
  details?: unknown;
  cause?: unknown;
  isOperational?: boolean;
};

export class AppError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;
  isOperational: boolean;
  override cause?: unknown;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = options.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
    this.code = options.code;
    this.details = options.details;
    this.isOperational = options.isOperational ?? this.statusCode < 500;
    this.cause = options.cause;
  }
}

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;

export const toAppError = (
  error: unknown,
  fallbackMessage: string,
  options: ErrorOptions = {}
): AppError => {
  if (isAppError(error)) {
    return error;
  }

  return new AppError(fallbackMessage, {
    ...options,
    cause: error instanceof Error ? error : undefined,
  });
};

export type ErrorResponse = {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
  timestamp: string;
  stack?: string;
};

export const buildErrorResponse = (
  error: unknown,
  { includeStack }: { includeStack: boolean }
) => {
  const appError = toAppError(error, "Internal server error");

  const response: ErrorResponse = {
    success: false,
    message: appError.message,
    code: appError.code,
    details: appError.details,
    timestamp: new Date().toISOString(),
  };

  if (includeStack && appError.stack) {
    response.stack = appError.stack;
  }

  return response;
};

/**
 * Utility to wrap async Express handlers and forward errors to the
 * central error handler without repetitive try/catch blocks.
 */
export const asyncHandler =
  (handler: import("express").RequestHandler) =>
  (
    req: import("express").Request,
    res: import("express").Response,
    next: import("express").NextFunction
  ) =>
    Promise.resolve(handler(req, res, next)).catch(next);



import type { Core } from '@strapi/types';

interface AuditErrorContext {
  contentType?: string;
  recordId?: string;
  action?: string;
  userId?: number;
  operation?: string;
  [key: string]: any;
}

/**
 * Centralized error handling for audit logging operations
 */
export class AuditErrorHandler {
  private strapi: Core.Strapi;

  constructor(strapi: Core.Strapi) {
    this.strapi = strapi;
  }

  /**
   * Log audit system errors with structured context
   */
  logAuditError(error: Error, context: AuditErrorContext = {}) {
    const errorContext = {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context,
    };

    this.strapi.log.error('Audit logging system error', errorContext);
  }

  /**
   * Log audit operation failures
   */
  logOperationFailure(operation: string, error: Error, context: AuditErrorContext = {}) {
    this.logAuditError(error, {
      operation,
      ...context,
    });
  }

  /**
   * Log configuration errors
   */
  logConfigurationError(error: Error, configKey?: string) {
    this.logAuditError(error, {
      operation: 'configuration_validation',
      configKey,
    });
  }

  /**
   * Log middleware errors
   */
  logMiddlewareError(error: Error, context: AuditErrorContext = {}) {
    this.logAuditError(error, {
      operation: 'middleware_execution',
      ...context,
    });
  }

  /**
   * Log service errors
   */
  logServiceError(error: Error, method: string, context: AuditErrorContext = {}) {
    this.logAuditError(error, {
      operation: 'service_method',
      method,
      ...context,
    });
  }

  /**
   * Log API errors
   */
  logApiError(error: Error, endpoint: string, context: AuditErrorContext = {}) {
    this.logAuditError(error, {
      operation: 'api_request',
      endpoint,
      ...context,
    });
  }

  /**
   * Handle and log database errors
   */
  logDatabaseError(error: Error, query?: string, context: AuditErrorContext = {}) {
    this.logAuditError(error, {
      operation: 'database_operation',
      query,
      ...context,
    });
  }

  /**
   * Create a safe wrapper for async operations that logs errors but doesn't throw
   */
  safeExecute<T>(
    operation: () => Promise<T>,
    context: AuditErrorContext = {}
  ): Promise<T | null> {
    return operation().catch((error) => {
      this.logAuditError(error, context);
      return null;
    });
  }

  /**
   * Create a wrapper for operations that should not fail the main process
   */
  nonBlockingExecute<T>(
    operation: () => Promise<T>,
    context: AuditErrorContext = {}
  ): Promise<void> {
    return operation()
      .catch((error) => {
        this.logAuditError(error, {
          operation: 'non_blocking_operation',
          ...context,
        });
      })
      .then(() => {
        // Always resolve to void, never reject
      });
  }
}

/**
 * Create an error handler instance
 */
export const createErrorHandler = (strapi: Core.Strapi) => {
  return new AuditErrorHandler(strapi);
};

/**
 * Get error handler instance from utils
 */
export const getErrorHandler = (strapi: Core.Strapi) => {
  return createErrorHandler(strapi);
};
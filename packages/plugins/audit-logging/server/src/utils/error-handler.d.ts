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
export declare class AuditErrorHandler {
    private strapi;
    constructor(strapi: Core.Strapi);
    /**
     * Log audit system errors with structured context
     */
    logAuditError(error: Error, context?: AuditErrorContext): void;
    /**
     * Log audit operation failures
     */
    logOperationFailure(operation: string, error: Error, context?: AuditErrorContext): void;
    /**
     * Log configuration errors
     */
    logConfigurationError(error: Error, configKey?: string): void;
    /**
     * Log middleware errors
     */
    logMiddlewareError(error: Error, context?: AuditErrorContext): void;
    /**
     * Log service errors
     */
    logServiceError(error: Error, method: string, context?: AuditErrorContext): void;
    /**
     * Log API errors
     */
    logApiError(error: Error, endpoint: string, context?: AuditErrorContext): void;
    /**
     * Handle and log database errors
     */
    logDatabaseError(error: Error, query?: string, context?: AuditErrorContext): void;
    /**
     * Create a safe wrapper for async operations that logs errors but doesn't throw
     */
    safeExecute<T>(operation: () => Promise<T>, context?: AuditErrorContext): Promise<T | null>;
    /**
     * Create a wrapper for operations that should not fail the main process
     */
    nonBlockingExecute<T>(operation: () => Promise<T>, context?: AuditErrorContext): Promise<void>;
}
/**
 * Create an error handler instance
 */
export declare const createErrorHandler: (strapi: Core.Strapi) => AuditErrorHandler;
/**
 * Get error handler instance from utils
 */
export declare const getErrorHandler: (strapi: Core.Strapi) => AuditErrorHandler;
export {};
//# sourceMappingURL=error-handler.d.ts.map
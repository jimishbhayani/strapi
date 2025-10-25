import type { Core } from '@strapi/types';
interface AuditLogConfig {
    enabled?: boolean;
    excludeContentTypes?: string[];
    retentionDays?: number;
    captureUserAgent?: boolean;
    captureIpAddress?: boolean;
}
/**
 * Get audit logging configuration with defaults
 */
export declare const getAuditLogConfig: (strapi: Core.Strapi) => AuditLogConfig;
/**
 * Check if audit logging is enabled globally
 */
export declare const isAuditLoggingEnabled: (strapi: Core.Strapi) => boolean;
/**
 * Check if a content type should be excluded from audit logging
 */
export declare const isContentTypeExcluded: (strapi: Core.Strapi, contentType: string) => boolean;
/**
 * Check if audit logging is enabled for a specific content type
 */
export declare const isLoggingEnabledForContentType: (strapi: Core.Strapi, contentType: string) => boolean;
/**
 * Validate audit logging configuration
 */
export declare const validateAuditLogConfig: (config: AuditLogConfig) => string[];
/**
 * Get environment variable overrides for audit log configuration
 */
export declare const getEnvironmentOverrides: () => Partial<AuditLogConfig>;
export {};
//# sourceMappingURL=config.d.ts.map
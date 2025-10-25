import type { Core } from '@strapi/types';
interface RequestContext {
    state?: {
        user?: {
            id: number;
            [key: string]: any;
        };
    };
    request?: {
        header?: {
            'user-agent'?: string;
            [key: string]: any;
        };
        ip?: string;
        ips?: string[];
    };
}
interface AuditMetadata {
    userId?: number;
    userAgent?: string;
    ipAddress?: string;
}
/**
 * Extract user information from request context
 */
export declare const extractUserInfo: (ctx?: RequestContext) => {
    userId?: number;
};
/**
 * Extract IP address from request context
 */
export declare const extractIpAddress: (ctx?: RequestContext) => string | undefined;
/**
 * Extract user agent from request context
 */
export declare const extractUserAgent: (ctx?: RequestContext) => string | undefined;
/**
 * Extract all audit metadata from request context
 */
export declare const extractAuditMetadata: (strapi: Core.Strapi, ctx?: RequestContext) => AuditMetadata;
/**
 * Extract changed fields by comparing old and new data
 */
export declare const extractChangedFields: (oldData: any, newData: any) => any;
/**
 * Sanitize payload data to remove sensitive information
 */
export declare const sanitizePayload: (data: any, contentType?: string) => any;
/**
 * Prepare audit entry data from operation context
 */
export declare const prepareAuditEntryData: (strapi: Core.Strapi, { contentType, recordId, action, oldData, newData, ctx, }: {
    contentType: string;
    recordId: string;
    action: 'create' | 'update' | 'delete';
    oldData?: any;
    newData?: any;
    ctx?: RequestContext;
}) => {
    contentType: string;
    recordId: string;
    action: "create" | "update" | "delete";
    userId: number | undefined;
    payload: any;
    changedFields: any;
    timestamp: Date;
    userAgent: string | undefined;
    ipAddress: string | undefined;
};
export {};
//# sourceMappingURL=metadata.d.ts.map
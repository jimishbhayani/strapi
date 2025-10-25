import type { Core } from '@strapi/types';
import type { AuditLogEntry, AuditLogQuery } from '../types';
declare const createAuditLogService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    /**
     * Create a new audit log entry
     */
    createAuditEntry(entry: AuditLogEntry): Promise<any>;
    /**
     * Find audit logs with filtering and pagination
     */
    findAuditLogs(query?: AuditLogQuery): Promise<{
        data: any[];
        meta: {
            pagination: {
                page: number;
                pageSize: number;
                pageCount: number;
                total: number;
            };
        };
    }>;
    /**
     * Check if audit logging is enabled for a specific content type
     */
    isLoggingEnabled(contentType: string): boolean;
    /**
     * Get audit log statistics
     */
    getAuditLogStats(): Promise<{
        totalLogs: number;
        actionStats: any;
        recentActivity: any[];
    }>;
};
export default createAuditLogService;
//# sourceMappingURL=audit-log.d.ts.map
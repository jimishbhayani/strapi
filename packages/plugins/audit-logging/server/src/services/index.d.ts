declare const _default: {
    'audit-log': ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        createAuditEntry(entry: import("../types").AuditLogEntry): Promise<any>;
        findAuditLogs(query?: import("../types").AuditLogQuery): Promise<{
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
        isLoggingEnabled(contentType: string): boolean;
        getAuditLogStats(): Promise<{
            totalLogs: number;
            actionStats: any;
            recentActivity: any[];
        }>;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map
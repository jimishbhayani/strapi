/**
 * Default configuration for the audit logging plugin
 */
declare const _default: {
    default: {
        auditLog: {
            enabled: boolean;
            excludeContentTypes: string[];
            retentionDays: number;
            captureUserAgent: boolean;
            captureIpAddress: boolean;
            maxPageSize: number;
            defaultPageSize: number;
        };
    };
    validator: (config: any) => void;
};
export default _default;
//# sourceMappingURL=index.d.ts.map
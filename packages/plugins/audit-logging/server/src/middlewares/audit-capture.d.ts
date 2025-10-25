import type { Core } from '@strapi/types';
/**
 * Audit capture middleware that integrates with Strapi's document service
 * to automatically log all content operations
 */
export declare const createAuditCaptureMiddleware: ({ strapi }: {
    strapi: Core.Strapi;
}) => (context: any, next: () => Promise<any>) => Promise<any>;
/**
 * Register audit capture middleware with Strapi's document service
 */
export declare const registerAuditCaptureMiddleware: ({ strapi }: {
    strapi: Core.Strapi;
}) => void;
//# sourceMappingURL=audit-capture.d.ts.map
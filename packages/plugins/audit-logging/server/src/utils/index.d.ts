import type { Core } from '@strapi/types';
/**
 * Get a service from the audit-logging plugin
 */
export declare const getService: <T = any>(name: string, { strapi }?: {
    strapi: Core.Strapi;
}) => T;
/**
 * Get plugin configuration
 */
export declare const getPluginConfig: (strapi: Core.Strapi) => {};
export * from './config';
export * from './error-handler';
//# sourceMappingURL=index.d.ts.map
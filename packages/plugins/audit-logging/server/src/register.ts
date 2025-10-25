import type { Core } from '@strapi/types';
import { addAuditLogsIndexes } from './migrations';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  // Register database migration for audit logs indexes
  strapi.db.migrations.providers.internal.register(addAuditLogsIndexes);
  
  strapi.log.info('Audit logging plugin registered successfully');
};
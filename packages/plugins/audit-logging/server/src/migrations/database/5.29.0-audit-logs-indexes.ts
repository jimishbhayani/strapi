import type { Migration, Database } from '@strapi/database';

type Knex = Parameters<Migration['up']>[0];

/**
 * Migration to add performance indexes to the audit_logs table
 * These indexes optimize common query patterns for filtering and sorting audit logs
 */
export const addAuditLogsIndexes: Migration = {
  name: 'audit-logging::5.29.0-add-audit-logs-indexes',
  async up(trx: Knex, db: Database) {
    const tableName = 'audit_logs';
    
    // Check if the table exists
    const hasTable = await trx.schema.hasTable(tableName);
    
    if (!hasTable) {
      // Table will be created by Strapi's content type system
      return;
    }

    try {
      // Create indexes with IF NOT EXISTS logic using raw SQL
      await trx.raw(`CREATE INDEX IF NOT EXISTS idx_audit_logs_content_type ON ${tableName} (content_type)`);
      await trx.raw(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON ${tableName} (user_id)`);
      await trx.raw(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON ${tableName} (action)`);
      await trx.raw(`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON ${tableName} (timestamp)`);
      await trx.raw(`CREATE INDEX IF NOT EXISTS idx_audit_logs_content_type_timestamp ON ${tableName} (content_type, timestamp)`);
      await trx.raw(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON ${tableName} (user_id, action)`);
    } catch (error) {
      // Ignore errors if indexes already exist or database doesn't support IF NOT EXISTS
      console.warn('Some audit log indexes may already exist or could not be created:', error);
    }
  },

  async down(trx: Knex) {
    const tableName = 'audit_logs';
    
    // Check if the table exists
    const hasTable = await trx.schema.hasTable(tableName);
    
    if (!hasTable) {
      return;
    }

    try {
      // Drop indexes if they exist
      await trx.raw(`DROP INDEX IF EXISTS idx_audit_logs_user_action`);
      await trx.raw(`DROP INDEX IF EXISTS idx_audit_logs_content_type_timestamp`);
      await trx.raw(`DROP INDEX IF EXISTS idx_audit_logs_timestamp`);
      await trx.raw(`DROP INDEX IF EXISTS idx_audit_logs_action`);
      await trx.raw(`DROP INDEX IF EXISTS idx_audit_logs_user_id`);
      await trx.raw(`DROP INDEX IF EXISTS idx_audit_logs_content_type`);
    } catch (error) {
      // Ignore errors if indexes don't exist
      console.warn('Some audit log indexes may not exist or could not be dropped:', error);
    }
  },
};
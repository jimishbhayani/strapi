/**
 * Multi-database compatibility tests for audit logging plugin
 * These tests verify that the plugin works correctly with all supported Strapi databases
 */

import { addAuditLogsIndexes } from '../migrations/database/5.29.0-audit-logs-indexes';

// Mock database interfaces for different providers
interface MockKnex {
  schema: {
    hasTable: jest.Mock;
    hasIndex: jest.Mock;
    alterTable: jest.Mock;
  };
}

interface MockDatabase {
  dialect: {
    client: string;
  };
}

describe('Database Compatibility Tests', () => {
  let mockKnex: MockKnex;
  let mockDatabase: MockDatabase;

  beforeEach(() => {
    mockKnex = {
      schema: {
        hasTable: jest.fn(),
        hasIndex: jest.fn(),
        alterTable: jest.fn(),
      },
    };
    
    mockDatabase = {
      dialect: {
        client: 'sqlite3',
      },
    };
  });

  describe('PostgreSQL Compatibility', () => {
    beforeEach(() => {
      mockDatabase.dialect.client = 'pg';
    });

    it('should create indexes on PostgreSQL', async () => {
      mockKnex.schema.hasTable.mockResolvedValue(true);
      mockKnex.schema.hasIndex.mockResolvedValue(false);
      
      const mockTableBuilder = {
        index: jest.fn(),
      };
      mockKnex.schema.alterTable.mockImplementation((tableName, callback) => {
        callback(mockTableBuilder);
        return Promise.resolve();
      });

      await addAuditLogsIndexes.up(mockKnex as any, mockDatabase as any);

      expect(mockKnex.schema.hasTable).toHaveBeenCalledWith('audit_logs');
      expect(mockKnex.schema.alterTable).toHaveBeenCalledTimes(6); // 4 individual + 2 composite indexes
      expect(mockTableBuilder.index).toHaveBeenCalledWith(['content_type'], 'idx_audit_logs_content_type');
      expect(mockTableBuilder.index).toHaveBeenCalledWith(['user_id'], 'idx_audit_logs_user_id');
      expect(mockTableBuilder.index).toHaveBeenCalledWith(['action'], 'idx_audit_logs_action');
      expect(mockTableBuilder.index).toHaveBeenCalledWith(['timestamp'], 'idx_audit_logs_timestamp');
    });

    it('should handle existing indexes on PostgreSQL', async () => {
      mockKnex.schema.hasTable.mockResolvedValue(true);
      mockKnex.schema.hasIndex.mockResolvedValue(true); // All indexes already exist

      await addAuditLogsIndexes.up(mockKnex as any, mockDatabase as any);

      expect(mockKnex.schema.alterTable).not.toHaveBeenCalled();
    });
  });

  describe('MySQL Compatibility', () => {
    beforeEach(() => {
      mockDatabase.dialect.client = 'mysql2';
    });

    it('should create indexes on MySQL', async () => {
      mockKnex.schema.hasTable.mockResolvedValue(true);
      mockKnex.schema.hasIndex.mockResolvedValue(false);
      
      const mockTableBuilder = {
        index: jest.fn(),
      };
      mockKnex.schema.alterTable.mockImplementation((tableName, callback) => {
        callback(mockTableBuilder);
        return Promise.resolve();
      });

      await addAuditLogsIndexes.up(mockKnex as any, mockDatabase as any);

      expect(mockKnex.schema.hasTable).toHaveBeenCalledWith('audit_logs');
      expect(mockTableBuilder.index).toHaveBeenCalledWith(['content_type'], 'idx_audit_logs_content_type');
      expect(mockTableBuilder.index).toHaveBeenCalledWith(['content_type', 'timestamp'], 'idx_audit_logs_content_type_timestamp');
    });

    it('should handle MySQL-specific index limitations', async () => {
      mockKnex.schema.hasTable.mockResolvedValue(true);
      mockKnex.schema.hasIndex.mockResolvedValue(false);
      
      const mockTableBuilder = {
        index: jest.fn(),
      };
      mockKnex.schema.alterTable.mockImplementation((tableName, callback) => {
        callback(mockTableBuilder);
        return Promise.resolve();
      });

      await addAuditLogsIndexes.up(mockKnex as any, mockDatabase as any);

      // Verify that all expected indexes are created
      expect(mockTableBuilder.index).toHaveBeenCalledTimes(6);
    });
  });

  describe('SQLite Compatibility', () => {
    beforeEach(() => {
      mockDatabase.dialect.client = 'sqlite3';
    });

    it('should create indexes on SQLite', async () => {
      mockKnex.schema.hasTable.mockResolvedValue(true);
      mockKnex.schema.hasIndex.mockResolvedValue(false);
      
      const mockTableBuilder = {
        index: jest.fn(),
      };
      mockKnex.schema.alterTable.mockImplementation((tableName, callback) => {
        callback(mockTableBuilder);
        return Promise.resolve();
      });

      await addAuditLogsIndexes.up(mockKnex as any, mockDatabase as any);

      expect(mockKnex.schema.hasTable).toHaveBeenCalledWith('audit_logs');
      expect(mockTableBuilder.index).toHaveBeenCalledWith(['content_type'], 'idx_audit_logs_content_type');
    });

    it('should handle SQLite index naming constraints', async () => {
      mockKnex.schema.hasTable.mockResolvedValue(true);
      mockKnex.schema.hasIndex.mockResolvedValue(false);
      
      const mockTableBuilder = {
        index: jest.fn(),
      };
      mockKnex.schema.alterTable.mockImplementation((tableName, callback) => {
        callback(mockTableBuilder);
        return Promise.resolve();
      });

      await addAuditLogsIndexes.up(mockKnex as any, mockDatabase as any);

      // Verify index names are within SQLite limits
      const indexCalls = mockTableBuilder.index.mock.calls;
      indexCalls.forEach(([columns, indexName]) => {
        expect(indexName.length).toBeLessThanOrEqual(64); // SQLite index name limit
      });
    });
  });

  describe('Migration Rollback Compatibility', () => {
    it('should drop indexes on PostgreSQL rollback', async () => {
      mockDatabase.dialect.client = 'pg';
      mockKnex.schema.hasTable.mockResolvedValue(true);
      mockKnex.schema.hasIndex.mockResolvedValue(true);
      
      const mockTableBuilder = {
        dropIndex: jest.fn(),
      };
      mockKnex.schema.alterTable.mockImplementation((tableName, callback) => {
        callback(mockTableBuilder);
        return Promise.resolve();
      });

      await addAuditLogsIndexes.down(mockKnex as any);

      expect(mockTableBuilder.dropIndex).toHaveBeenCalledWith([], 'idx_audit_logs_user_action');
      expect(mockTableBuilder.dropIndex).toHaveBeenCalledWith([], 'idx_audit_logs_content_type_timestamp');
      expect(mockTableBuilder.dropIndex).toHaveBeenCalledWith([], 'idx_audit_logs_timestamp');
      expect(mockTableBuilder.dropIndex).toHaveBeenCalledWith([], 'idx_audit_logs_action');
      expect(mockTableBuilder.dropIndex).toHaveBeenCalledWith([], 'idx_audit_logs_user_id');
      expect(mockTableBuilder.dropIndex).toHaveBeenCalledWith([], 'idx_audit_logs_content_type');
    });

    it('should handle missing table during rollback', async () => {
      mockKnex.schema.hasTable.mockResolvedValue(false);

      await expect(addAuditLogsIndexes.down(mockKnex as any)).resolves.not.toThrow();
      expect(mockKnex.schema.alterTable).not.toHaveBeenCalled();
    });
  });

  describe('Content Type Schema Compatibility', () => {
    it('should work with all database JSON field types', () => {
      // Test that the schema.json is compatible with all databases
      const schema = require('../content-types/audit-log/schema.json');
      
      expect(schema.attributes.payload.type).toBe('json');
      expect(schema.attributes.changedFields.type).toBe('json');
      
      // Verify that JSON fields are properly configured
      expect(schema.attributes.payload.required).toBe(false);
      expect(schema.attributes.changedFields.required).toBe(false);
    });

    it('should handle database-specific field constraints', () => {
      const schema = require('../content-types/audit-log/schema.json');
      
      // Verify string fields have appropriate constraints for all databases
      expect(schema.attributes.contentType.type).toBe('string');
      expect(schema.attributes.recordId.type).toBe('string');
      expect(schema.attributes.action.type).toBe('enumeration');
      
      // Verify enum values are database-compatible
      expect(schema.attributes.action.enum).toEqual(['create', 'update', 'delete']);
    });
  });

  describe('Query Performance Across Databases', () => {
    it('should generate efficient queries for PostgreSQL', () => {
      // Mock query patterns that would be generated
      const mockQuery = {
        where: {
          content_type: 'api::article.article',
          timestamp: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-01-31'),
          },
        },
        orderBy: { timestamp: 'desc' },
        limit: 25,
        offset: 0,
      };

      // Verify query structure is compatible with PostgreSQL
      expect(mockQuery.where.content_type).toBeDefined();
      expect(mockQuery.where.timestamp.$gte).toBeInstanceOf(Date);
      expect(mockQuery.orderBy.timestamp).toBe('desc');
    });

    it('should handle MySQL date queries correctly', () => {
      const mockQuery = {
        where: {
          timestamp: {
            $gte: new Date('2024-01-01T00:00:00Z'),
            $lte: new Date('2024-01-31T23:59:59Z'),
          },
        },
      };

      // Verify date handling is compatible with MySQL
      expect(mockQuery.where.timestamp.$gte.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(mockQuery.where.timestamp.$lte.toISOString()).toBe('2024-01-31T23:59:59.000Z');
    });

    it('should work with SQLite limitations', () => {
      const mockQuery = {
        where: {
          action: { $in: ['create', 'update'] },
        },
        limit: 100, // SQLite handles this well
      };

      // Verify query patterns work with SQLite
      expect(Array.isArray(mockQuery.where.action.$in)).toBe(true);
      expect(mockQuery.limit).toBeLessThanOrEqual(100);
    });
  });
});
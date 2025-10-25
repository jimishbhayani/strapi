import { createAuditLogService } from '../audit-log';

// Mock Strapi
const mockStrapi = {
  db: {
    query: jest.fn(),
  },
  config: {
    get: jest.fn(),
  },
  log: {
    debug: jest.fn(),
    error: jest.fn(),
  },
};

// Mock query builder
const mockQueryBuilder = {
  create: jest.fn(),
  findWithCount: jest.fn(),
  count: jest.fn(),
  findMany: jest.fn(),
};

describe('Audit Log Service', () => {
  let auditLogService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStrapi.db.query.mockReturnValue(mockQueryBuilder);
    auditLogService = createAuditLogService({ strapi: mockStrapi as any });
  });

  describe('createAuditEntry', () => {
    it('should create audit entry with valid data', async () => {
      const entryData = {
        contentType: 'api::article.article',
        recordId: '123',
        action: 'create' as const,
        userId: 1,
        payload: { title: 'Test Article' },
        timestamp: new Date(),
      };

      const mockCreatedEntry = { id: 1, ...entryData };
      mockQueryBuilder.create.mockResolvedValue(mockCreatedEntry);

      const result = await auditLogService.createAuditEntry(entryData);

      expect(mockStrapi.db.query).toHaveBeenCalledWith('plugin::audit-logging.audit-log');
      expect(mockQueryBuilder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentType: entryData.contentType,
          recordId: entryData.recordId,
          action: entryData.action,
          userId: entryData.userId,
          payload: entryData.payload,
        }),
      });
      expect(result).toEqual(mockCreatedEntry);
    });

    it('should throw validation error for missing required fields', async () => {
      const invalidData = {
        contentType: '',
        recordId: '123',
        action: 'create' as const,
      };

      await expect(auditLogService.createAuditEntry(invalidData)).rejects.toThrow(
        'Missing required fields: contentType, recordId, or action'
      );
    });

    it('should throw validation error for invalid action type', async () => {
      const invalidData = {
        contentType: 'api::article.article',
        recordId: '123',
        action: 'invalid' as any,
      };

      await expect(auditLogService.createAuditEntry(invalidData)).rejects.toThrow(
        'Invalid action type. Must be create, update, or delete'
      );
    });

    it('should set timestamp if not provided', async () => {
      const entryData = {
        contentType: 'api::article.article',
        recordId: '123',
        action: 'create' as const,
      };

      const mockCreatedEntry = { id: 1, ...entryData };
      mockQueryBuilder.create.mockResolvedValue(mockCreatedEntry);

      await auditLogService.createAuditEntry(entryData);

      expect(mockQueryBuilder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timestamp: expect.any(Date),
        }),
      });
    });
  });

  describe('findAuditLogs', () => {
    it('should find audit logs with default pagination', async () => {
      const mockResults = [
        { id: 1, contentType: 'api::article.article', action: 'create' },
        { id: 2, contentType: 'api::article.article', action: 'update' },
      ];
      const mockPagination = { total: 2 };

      mockQueryBuilder.findWithCount.mockResolvedValue({
        results: mockResults,
        pagination: mockPagination,
      });

      const result = await auditLogService.findAuditLogs();

      expect(mockQueryBuilder.findWithCount).toHaveBeenCalledWith({
        where: {},
        orderBy: { timestamp: 'desc' },
        offset: 0,
        limit: 25,
      });

      expect(result).toEqual({
        data: mockResults,
        meta: {
          pagination: {
            page: 1,
            pageSize: 25,
            pageCount: 1,
            total: 2,
          },
        },
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        contentType: 'api::article.article',
        userId: 1,
        action: 'create',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      mockQueryBuilder.findWithCount.mockResolvedValue({
        results: [],
        pagination: { total: 0 },
      });

      await auditLogService.findAuditLogs(filters);

      expect(mockQueryBuilder.findWithCount).toHaveBeenCalledWith({
        where: {
          contentType: 'api::article.article',
          userId: 1,
          action: 'create',
          timestamp: {
            $gte: new Date('2024-01-01T00:00:00Z'),
            $lte: new Date('2024-01-31T23:59:59Z'),
          },
        },
        orderBy: { timestamp: 'desc' },
        offset: 0,
        limit: 25,
      });
    });

    it('should handle array of actions', async () => {
      const filters = {
        action: ['create', 'update'],
      };

      mockQueryBuilder.findWithCount.mockResolvedValue({
        results: [],
        pagination: { total: 0 },
      });

      await auditLogService.findAuditLogs(filters);

      expect(mockQueryBuilder.findWithCount).toHaveBeenCalledWith({
        where: {
          action: { $in: ['create', 'update'] },
        },
        orderBy: { timestamp: 'desc' },
        offset: 0,
        limit: 25,
      });
    });

    it('should enforce maximum page size', async () => {
      mockQueryBuilder.findWithCount.mockResolvedValue({
        results: [],
        pagination: { total: 0 },
      });

      await auditLogService.findAuditLogs({ pageSize: 150 });

      expect(mockQueryBuilder.findWithCount).toHaveBeenCalledWith({
        where: {},
        orderBy: { timestamp: 'desc' },
        offset: 0,
        limit: 100, // Should be capped at 100
      });
    });
  });

  describe('isLoggingEnabled', () => {
    it('should return true when logging is enabled and content type not excluded', () => {
      mockStrapi.config.get.mockReturnValue({
        auditLog: {
          enabled: true,
          excludeContentTypes: ['strapi::core-store'],
        },
      });

      const result = auditLogService.isLoggingEnabled('api::article.article');
      expect(result).toBe(true);
    });

    it('should return false when logging is globally disabled', () => {
      mockStrapi.config.get.mockReturnValue({
        auditLog: {
          enabled: false,
        },
      });

      const result = auditLogService.isLoggingEnabled('api::article.article');
      expect(result).toBe(false);
    });

    it('should return false when content type is excluded', () => {
      mockStrapi.config.get.mockReturnValue({
        auditLog: {
          enabled: true,
          excludeContentTypes: ['api::article.article'],
        },
      });

      const result = auditLogService.isLoggingEnabled('api::article.article');
      expect(result).toBe(false);
    });

    it('should return true by default if configuration check fails', () => {
      mockStrapi.config.get.mockImplementation(() => {
        throw new Error('Config error');
      });

      const result = auditLogService.isLoggingEnabled('api::article.article');
      expect(result).toBe(true);
    });
  });

  describe('getAuditLogStats', () => {
    it('should return audit log statistics', async () => {
      const mockTotalLogs = 100;
      const mockActionStats = [
        { action: 'create', count: 40 },
        { action: 'update', count: 35 },
        { action: 'delete', count: 25 },
      ];
      const mockRecentActivity = [
        { id: 1, action: 'create', timestamp: new Date() },
      ];

      mockQueryBuilder.count.mockResolvedValue(mockTotalLogs);
      mockStrapi.db.connection = {
        raw: jest.fn().mockResolvedValue({
          rows: mockActionStats,
        }),
      };
      mockQueryBuilder.findMany.mockResolvedValue(mockRecentActivity);

      const result = await auditLogService.getAuditLogStats();

      expect(result).toEqual({
        totalLogs: mockTotalLogs,
        actionStats: mockActionStats,
        recentActivity: mockRecentActivity,
      });
    });
  });
});
import controller from '../audit-log';

// Mock dependencies
const mockAuditLogService = {
  findAuditLogs: jest.fn(),
  getAuditLogStats: jest.fn(),
};

const mockStrapi = {
  log: {
    error: jest.fn(),
  },
};

// Mock utils
jest.mock('../../utils', () => ({
  getService: jest.fn(),
}));

import { getService } from '../../utils';

describe('Audit Log Controller', () => {
  let mockCtx: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    (getService as jest.Mock).mockReturnValue(mockAuditLogService);
    global.strapi = mockStrapi as any;
    
    mockCtx = {
      query: {},
      state: { user: { id: 1 } },
      body: null,
      badRequest: jest.fn(),
      internalServerError: jest.fn(),
    };
  });

  describe('find', () => {
    it('should return audit logs with default parameters', async () => {
      const mockResult = {
        data: [
          { id: 1, contentType: 'api::article.article', action: 'create' },
        ],
        meta: {
          pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 },
        },
      };

      mockAuditLogService.findAuditLogs.mockResolvedValue(mockResult);

      await controller.find(mockCtx);

      expect(mockAuditLogService.findAuditLogs).toHaveBeenCalledWith({});
      expect(mockCtx.body).toEqual(mockResult);
    });

    it('should handle query parameters correctly', async () => {
      mockCtx.query = {
        contentType: 'api::article.article',
        userId: '1',
        action: 'create,update',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
        page: '2',
        pageSize: '50',
        sort: 'timestamp:asc',
      };

      const mockResult = {
        data: [],
        meta: { pagination: { page: 2, pageSize: 50, pageCount: 0, total: 0 } },
      };

      mockAuditLogService.findAuditLogs.mockResolvedValue(mockResult);

      await controller.find(mockCtx);

      expect(mockAuditLogService.findAuditLogs).toHaveBeenCalledWith({
        contentType: 'api::article.article',
        userId: 1,
        action: ['create', 'update'],
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
        page: 2,
        pageSize: 50,
        sort: 'timestamp:asc',
      });
    });

    it('should validate userId parameter', async () => {
      mockCtx.query = { userId: 'invalid' };

      await controller.find(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('userId must be a valid number');
      expect(mockAuditLogService.findAuditLogs).not.toHaveBeenCalled();
    });

    it('should validate action parameter', async () => {
      mockCtx.query = { action: 'invalid-action' };

      await controller.find(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith(
        'Invalid action(s): invalid-action. Valid actions are: create, update, delete'
      );
    });

    it('should validate date parameters', async () => {
      mockCtx.query = { startDate: 'invalid-date' };

      await controller.find(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('startDate must be a valid ISO date string');
    });

    it('should validate page parameter', async () => {
      mockCtx.query = { page: '0' };

      await controller.find(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('page must be a positive number');
    });

    it('should validate pageSize parameter', async () => {
      mockCtx.query = { pageSize: '150' };

      await controller.find(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith('pageSize must be a number between 1 and 100');
    });

    it('should validate sort parameter', async () => {
      mockCtx.query = { sort: 'invalid-field:desc' };

      await controller.find(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith(
        'Invalid sort field: invalid-field. Valid fields are: timestamp, contentType, action, userId'
      );
    });

    it('should validate sort direction', async () => {
      mockCtx.query = { sort: 'timestamp:invalid' };

      await controller.find(mockCtx);

      expect(mockCtx.badRequest).toHaveBeenCalledWith(
        'Invalid sort direction: invalid. Valid directions are: asc, desc'
      );
    });

    it('should handle service errors', async () => {
      mockAuditLogService.findAuditLogs.mockRejectedValue(new Error('Service error'));

      await controller.find(mockCtx);

      expect(mockStrapi.log.error).toHaveBeenCalledWith(
        'Failed to retrieve audit logs',
        expect.objectContaining({
          error: 'Service error',
          user: 1,
        })
      );
      expect(mockCtx.internalServerError).toHaveBeenCalledWith('Failed to retrieve audit logs');
    });

    it('should handle single action parameter', async () => {
      mockCtx.query = { action: 'create' };

      const mockResult = {
        data: [],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } },
      };

      mockAuditLogService.findAuditLogs.mockResolvedValue(mockResult);

      await controller.find(mockCtx);

      expect(mockAuditLogService.findAuditLogs).toHaveBeenCalledWith({
        action: 'create',
      });
    });

    it('should handle multiple actions parameter', async () => {
      mockCtx.query = { action: 'create,update,delete' };

      const mockResult = {
        data: [],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } },
      };

      mockAuditLogService.findAuditLogs.mockResolvedValue(mockResult);

      await controller.find(mockCtx);

      expect(mockAuditLogService.findAuditLogs).toHaveBeenCalledWith({
        action: ['create', 'update', 'delete'],
      });
    });
  });

  describe('getStats', () => {
    it('should return audit log statistics', async () => {
      const mockStats = {
        totalLogs: 100,
        actionStats: [
          { action: 'create', count: 40 },
          { action: 'update', count: 35 },
          { action: 'delete', count: 25 },
        ],
        recentActivity: [
          { id: 1, action: 'create', timestamp: new Date() },
        ],
      };

      mockAuditLogService.getAuditLogStats.mockResolvedValue(mockStats);

      await controller.getStats(mockCtx);

      expect(mockAuditLogService.getAuditLogStats).toHaveBeenCalled();
      expect(mockCtx.body).toEqual({
        data: mockStats,
      });
    });

    it('should handle service errors', async () => {
      mockAuditLogService.getAuditLogStats.mockRejectedValue(new Error('Stats error'));

      await controller.getStats(mockCtx);

      expect(mockStrapi.log.error).toHaveBeenCalledWith(
        'Failed to retrieve audit log statistics',
        expect.objectContaining({
          error: 'Stats error',
          user: 1,
        })
      );
      expect(mockCtx.internalServerError).toHaveBeenCalledWith('Failed to retrieve audit log statistics');
    });
  });
});
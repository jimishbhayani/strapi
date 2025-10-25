import { createAuditCaptureMiddleware } from '../audit-capture';

// Mock dependencies
const mockAuditLogService = {
  createAuditEntry: jest.fn(),
};

const mockStrapi = {
  documents: jest.fn(),
  requestContext: {
    get: jest.fn(),
  },
  log: {
    warn: jest.fn(),
    error: jest.fn(),
  },
  service: jest.fn(),
};

// Mock utils
jest.mock('../../utils', () => ({
  getService: jest.fn(),
  isLoggingEnabledForContentType: jest.fn(),
}));

import { getService, isLoggingEnabledForContentType } from '../../utils';

describe('Audit Capture Middleware', () => {
  let middleware: any;
  let mockNext: jest.Mock;
  let mockContext: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    (getService as jest.Mock).mockReturnValue(mockAuditLogService);
    (isLoggingEnabledForContentType as jest.Mock).mockReturnValue(true);
    
    mockNext = jest.fn();
    middleware = createAuditCaptureMiddleware({ strapi: mockStrapi as any });
    
    mockContext = {
      uid: 'api::article.article',
      action: 'create',
      params: {
        documentId: 'doc-123',
        locale: 'en',
      },
    };
  });

  describe('middleware execution', () => {
    it('should skip if logging is not enabled for content type', async () => {
      (isLoggingEnabledForContentType as jest.Mock).mockReturnValue(false);
      
      const result = { id: 1, title: 'Test Article' };
      mockNext.mockResolvedValue(result);

      const middlewareResult = await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockAuditLogService.createAuditEntry).not.toHaveBeenCalled();
      expect(middlewareResult).toBe(result);
    });

    it('should skip unsupported actions', async () => {
      mockContext.action = 'find';
      
      const result = { data: [] };
      mockNext.mockResolvedValue(result);

      const middlewareResult = await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockAuditLogService.createAuditEntry).not.toHaveBeenCalled();
      expect(middlewareResult).toBe(result);
    });

    it('should handle create operation', async () => {
      const result = { 
        documentId: 'doc-123', 
        id: 1, 
        title: 'Test Article' 
      };
      mockNext.mockResolvedValue(result);
      mockStrapi.requestContext.get.mockReturnValue({
        state: { user: { id: 1 } },
        request: { 
          header: { 'user-agent': 'test-agent' },
          ip: '127.0.0.1' 
        },
      });

      const middlewareResult = await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(middlewareResult).toBe(result);
      
      // Wait for async audit logging
      await new Promise(resolve => setImmediate(resolve));
      
      expect(mockAuditLogService.createAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'api::article.article',
          recordId: 'doc-123',
          action: 'create',
          userId: 1,
          payload: expect.objectContaining({
            documentId: 'doc-123',
            title: 'Test Article',
          }),
        })
      );
    });

    it('should handle update operation with old data', async () => {
      mockContext.action = 'update';
      
      const oldData = { 
        documentId: 'doc-123', 
        title: 'Old Title' 
      };
      const newData = { 
        documentId: 'doc-123', 
        title: 'New Title' 
      };
      
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(oldData),
      });
      
      mockNext.mockResolvedValue(newData);

      const middlewareResult = await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(middlewareResult).toBe(newData);
      
      // Wait for async audit logging
      await new Promise(resolve => setImmediate(resolve));
      
      expect(mockAuditLogService.createAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'api::article.article',
          recordId: 'doc-123',
          action: 'update',
        })
      );
    });

    it('should handle delete operation', async () => {
      mockContext.action = 'delete';
      
      const oldData = { 
        documentId: 'doc-123', 
        title: 'Article to Delete' 
      };
      
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockResolvedValue(oldData),
      });
      
      mockNext.mockResolvedValue({ success: true });

      const middlewareResult = await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
      
      // Wait for async audit logging
      await new Promise(resolve => setImmediate(resolve));
      
      expect(mockAuditLogService.createAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'api::article.article',
          recordId: 'doc-123',
          action: 'delete',
          payload: expect.objectContaining({
            documentId: 'doc-123',
            title: 'Article to Delete',
          }),
        })
      );
    });

    it('should handle errors gracefully without affecting main operation', async () => {
      const result = { id: 1, title: 'Test Article' };
      mockNext.mockResolvedValue(result);
      mockAuditLogService.createAuditEntry.mockRejectedValue(new Error('Audit error'));

      const middlewareResult = await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(middlewareResult).toBe(result);
      
      // Wait for async audit logging
      await new Promise(resolve => setImmediate(resolve));
      
      expect(mockStrapi.log.error).toHaveBeenCalledWith(
        'Failed to create audit log entry',
        expect.objectContaining({
          contentType: 'api::article.article',
          action: 'create',
          error: 'Audit error',
        })
      );
    });

    it('should warn when record ID cannot be determined', async () => {
      const result = {}; // No ID or documentId
      mockNext.mockResolvedValue(result);

      const middlewareResult = await middleware(mockContext, mockNext);

      expect(middlewareResult).toBe(result);
      
      // Wait for async audit logging
      await new Promise(resolve => setImmediate(resolve));
      
      expect(mockStrapi.log.warn).toHaveBeenCalledWith(
        'Could not determine record ID for audit logging',
        expect.objectContaining({
          contentType: 'api::article.article',
          action: 'create',
        })
      );
    });

    it('should handle missing old data gracefully', async () => {
      mockContext.action = 'update';
      
      mockStrapi.documents.mockReturnValue({
        findOne: jest.fn().mockRejectedValue(new Error('Not found')),
      });
      
      const result = { documentId: 'doc-123', title: 'Updated' };
      mockNext.mockResolvedValue(result);

      const middlewareResult = await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(middlewareResult).toBe(result);
      expect(mockStrapi.log.warn).toHaveBeenCalledWith(
        'Failed to fetch existing data for audit logging',
        expect.objectContaining({
          contentType: 'api::article.article',
          documentId: 'doc-123',
        })
      );
    });
  });
});
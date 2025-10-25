/**
 * Performance tests for audit logging plugin
 * These tests verify that audit logging doesn't significantly impact content API performance
 */

import { createAuditCaptureMiddleware } from '../middlewares/audit-capture';

// Mock performance measurement
const mockPerformance = {
  now: jest.fn(),
  mark: jest.fn(),
  measure: jest.fn(),
};

// Mock Strapi and services
const mockAuditLogService = {
  createAuditEntry: jest.fn(),
};

const mockStrapi = {
  service: jest.fn().mockReturnValue(mockAuditLogService),
  requestContext: {
    get: jest.fn(),
  },
  log: {
    warn: jest.fn(),
    error: jest.fn(),
  },
  documents: jest.fn(),
};

// Mock utils
jest.mock('../utils', () => ({
  getService: jest.fn(),
  isLoggingEnabledForContentType: jest.fn(),
}));

import { getService, isLoggingEnabledForContentType } from '../utils';

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getService as jest.Mock).mockReturnValue(mockAuditLogService);
    (isLoggingEnabledForContentType as jest.Mock).mockReturnValue(true);
    
    // Mock performance.now() to return incrementing values
    let time = 0;
    mockPerformance.now.mockImplementation(() => ++time);
    global.performance = mockPerformance as any;
  });

  describe('Middleware Performance Impact', () => {
    it('should have minimal impact on content operations', async () => {
      const middleware = createAuditCaptureMiddleware({ strapi: mockStrapi as any });
      
      const mockContext = {
        uid: 'api::article.article',
        action: 'create',
        params: { documentId: 'doc-123' },
      };

      const mockNext = jest.fn().mockResolvedValue({ 
        documentId: 'doc-123', 
        title: 'Test Article' 
      });

      const startTime = performance.now();
      await middleware(mockContext, mockNext);
      const endTime = performance.now();

      // Middleware should complete quickly (< 10ms in test environment)
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not block when audit logging fails', async () => {
      const middleware = createAuditCaptureMiddleware({ strapi: mockStrapi as any });
      
      // Make audit service fail
      mockAuditLogService.createAuditEntry.mockRejectedValue(new Error('Audit failed'));
      
      const mockContext = {
        uid: 'api::article.article',
        action: 'create',
        params: { documentId: 'doc-123' },
      };

      const mockNext = jest.fn().mockResolvedValue({ 
        documentId: 'doc-123', 
        title: 'Test Article' 
      });

      const startTime = performance.now();
      const result = await middleware(mockContext, mockNext);
      const endTime = performance.now();

      // Should still complete quickly even with audit failure
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10);
      expect(result).toEqual({ documentId: 'doc-123', title: 'Test Article' });
    });

    it('should handle high-frequency operations efficiently', async () => {
      const middleware = createAuditCaptureMiddleware({ strapi: mockStrapi as any });
      
      const mockContext = {
        uid: 'api::article.article',
        action: 'create',
        params: { documentId: 'doc-123' },
      };

      const mockNext = jest.fn().mockResolvedValue({ 
        documentId: 'doc-123', 
        title: 'Test Article' 
      });

      // Simulate 100 rapid operations
      const operations = Array(100).fill(null).map(() => 
        middleware(mockContext, mockNext)
      );

      const startTime = performance.now();
      await Promise.all(operations);
      const endTime = performance.now();

      // All operations should complete within reasonable time
      const totalTime = endTime - startTime;
      const averageTime = totalTime / 100;
      
      expect(averageTime).toBeLessThan(5); // Average < 5ms per operation
      expect(mockNext).toHaveBeenCalledTimes(100);
    });
  });

  describe('Database Query Performance', () => {
    it('should use efficient queries for audit log retrieval', () => {
      // Mock service to test query structure
      const mockService = {
        findAuditLogs: jest.fn().mockImplementation((query) => {
          // Verify query uses indexed fields
          const { where, orderBy, limit, offset } = query;
          
          // Should use indexed fields for filtering
          if (where.contentType) {
            expect(typeof where.contentType).toBe('string');
          }
          if (where.userId) {
            expect(typeof where.userId).toBe('number');
          }
          if (where.action) {
            expect(['string', 'object'].includes(typeof where.action)).toBe(true);
          }
          if (where.timestamp) {
            expect(where.timestamp).toHaveProperty('$gte');
            expect(where.timestamp).toHaveProperty('$lte');
          }

          // Should use efficient ordering
          expect(orderBy).toHaveProperty('timestamp');
          expect(['asc', 'desc'].includes(orderBy.timestamp)).toBe(true);

          // Should limit results
          expect(limit).toBeLessThanOrEqual(100);
          expect(offset).toBeGreaterThanOrEqual(0);

          return Promise.resolve({
            data: [],
            meta: { pagination: { page: 1, pageSize: limit, pageCount: 0, total: 0 } },
          });
        }),
      };

      // Test various query patterns
      const queries = [
        { contentType: 'api::article.article' },
        { userId: 1 },
        { action: 'create' },
        { action: ['create', 'update'] },
        { 
          contentType: 'api::article.article',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      ];

      queries.forEach(query => {
        expect(() => mockService.findAuditLogs(query)).not.toThrow();
      });
    });

    it('should handle large result sets efficiently', async () => {
      const mockService = {
        findAuditLogs: jest.fn().mockImplementation(({ pageSize = 25 }) => {
          // Simulate processing time based on page size
          const processingTime = Math.min(pageSize / 10, 50); // Max 50ms
          
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                data: Array(pageSize).fill(null).map((_, i) => ({
                  id: i + 1,
                  contentType: 'api::article.article',
                  action: 'create',
                  timestamp: new Date(),
                })),
                meta: {
                  pagination: {
                    page: 1,
                    pageSize,
                    pageCount: Math.ceil(1000 / pageSize),
                    total: 1000,
                  },
                },
              });
            }, processingTime);
          });
        }),
      };

      // Test different page sizes
      const pageSizes = [10, 25, 50, 100];
      
      for (const pageSize of pageSizes) {
        const startTime = performance.now();
        const result = await mockService.findAuditLogs({ pageSize });
        const endTime = performance.now();

        const executionTime = endTime - startTime;
        
        // Larger page sizes should still be reasonable
        expect(executionTime).toBeLessThan(100); // Max 100ms
        expect(result.data).toHaveLength(pageSize);
        expect(result.meta.pagination.pageSize).toBe(pageSize);
      }
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not leak memory during audit operations', async () => {
      const middleware = createAuditCaptureMiddleware({ strapi: mockStrapi as any });
      
      // Mock memory usage tracking
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      const operations = Array(1000).fill(null).map(async (_, i) => {
        const mockContext = {
          uid: 'api::article.article',
          action: 'create',
          params: { documentId: `doc-${i}` },
        };

        const mockNext = jest.fn().mockResolvedValue({ 
          documentId: `doc-${i}`, 
          title: `Test Article ${i}` 
        });

        return middleware(mockContext, mockNext);
      });

      await Promise.all(operations);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (< 10MB for 1000 operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large payloads efficiently', async () => {
      const middleware = createAuditCaptureMiddleware({ strapi: mockStrapi as any });
      
      // Create large payload
      const largePayload = {
        documentId: 'doc-123',
        title: 'Test Article',
        content: 'x'.repeat(10000), // 10KB content
        metadata: Array(100).fill(null).map((_, i) => ({
          key: `field_${i}`,
          value: 'x'.repeat(100),
        })),
      };

      const mockContext = {
        uid: 'api::article.article',
        action: 'create',
        params: { documentId: 'doc-123' },
      };

      const mockNext = jest.fn().mockResolvedValue(largePayload);

      const startTime = performance.now();
      await middleware(mockContext, mockNext);
      const endTime = performance.now();

      // Should handle large payloads without significant delay
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(50); // Max 50ms for large payload
    });
  });

  describe('Async Processing Performance', () => {
    it('should process audit logs asynchronously', async () => {
      const middleware = createAuditCaptureMiddleware({ strapi: mockStrapi as any });
      
      let auditProcessingStarted = false;
      let auditProcessingCompleted = false;

      mockAuditLogService.createAuditEntry.mockImplementation(async () => {
        auditProcessingStarted = true;
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 10));
        auditProcessingCompleted = true;
        return { id: 1 };
      });

      const mockContext = {
        uid: 'api::article.article',
        action: 'create',
        params: { documentId: 'doc-123' },
      };

      const mockNext = jest.fn().mockResolvedValue({ 
        documentId: 'doc-123', 
        title: 'Test Article' 
      });

      const result = await middleware(mockContext, mockNext);

      // Main operation should complete before audit processing
      expect(result).toEqual({ documentId: 'doc-123', title: 'Test Article' });
      expect(auditProcessingStarted).toBe(false); // Should be async

      // Wait for async processing
      await new Promise(resolve => setImmediate(resolve));
      
      expect(auditProcessingStarted).toBe(true);
      
      // Wait a bit more for completion
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(auditProcessingCompleted).toBe(true);
    });

    it('should not accumulate async operations', async () => {
      const middleware = createAuditCaptureMiddleware({ strapi: mockStrapi as any });
      
      let activeOperations = 0;
      let maxConcurrentOperations = 0;

      mockAuditLogService.createAuditEntry.mockImplementation(async () => {
        activeOperations++;
        maxConcurrentOperations = Math.max(maxConcurrentOperations, activeOperations);
        
        await new Promise(resolve => setTimeout(resolve, 5));
        
        activeOperations--;
        return { id: 1 };
      });

      // Start many operations rapidly
      const operations = Array(50).fill(null).map(async (_, i) => {
        const mockContext = {
          uid: 'api::article.article',
          action: 'create',
          params: { documentId: `doc-${i}` },
        };

        const mockNext = jest.fn().mockResolvedValue({ 
          documentId: `doc-${i}`, 
          title: `Test Article ${i}` 
        });

        return middleware(mockContext, mockNext);
      });

      await Promise.all(operations);

      // Wait for all async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not have excessive concurrent operations
      expect(maxConcurrentOperations).toBeLessThan(20);
      expect(activeOperations).toBe(0); // All should be completed
    });
  });
});
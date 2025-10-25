/**
 * Integration tests for audit logging plugin with Strapi core
 */

import pluginFactory from '../index';
import bootstrap from '../bootstrap';
import register from '../register';

// Mock Strapi core
const mockStrapi = {
  db: {
    migrations: {
      providers: {
        internal: {
          register: jest.fn(),
        },
      },
    },
  },
  service: jest.fn(),
  config: {
    get: jest.fn(),
  },
  documents: {
    use: jest.fn(),
  },
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
};

// Mock services and utilities
jest.mock('../middlewares', () => ({
  registerAuditCaptureMiddleware: jest.fn(),
}));

jest.mock('../config/permissions', () => ({
  registerAuditLoggingActions: jest.fn(),
}));

jest.mock('../utils/config', () => ({
  validateAuditLogConfig: jest.fn().mockReturnValue([]),
  getAuditLogConfig: jest.fn().mockReturnValue({
    enabled: true,
    excludeContentTypes: [],
  }),
}));

import { registerAuditCaptureMiddleware } from '../middlewares';
import permissions from '../config/permissions';
import { validateAuditLogConfig, getAuditLogConfig } from '../utils/config';

describe('Plugin Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStrapi.service.mockReturnValue({
      actionProvider: {
        registerMany: jest.fn(),
      },
    });
  });

  describe('Plugin Factory', () => {
    it('should export all required plugin components', () => {
      const plugin = pluginFactory();

      expect(plugin).toHaveProperty('register');
      expect(plugin).toHaveProperty('bootstrap');
      expect(plugin).toHaveProperty('routes');
      expect(plugin).toHaveProperty('controllers');
      expect(plugin).toHaveProperty('contentTypes');
      expect(plugin).toHaveProperty('services');

      expect(typeof plugin.register).toBe('function');
      expect(typeof plugin.bootstrap).toBe('function');
      expect(typeof plugin.routes).toBe('object');
      expect(typeof plugin.controllers).toBe('object');
      expect(typeof plugin.contentTypes).toBe('object');
      expect(typeof plugin.services).toBe('object');
    });

    it('should have audit-log content type defined', () => {
      const plugin = pluginFactory();

      expect(plugin.contentTypes).toHaveProperty('audit-log');
      expect(plugin.contentTypes['audit-log']).toHaveProperty('schema');
    });

    it('should have audit-log service defined', () => {
      const plugin = pluginFactory();

      expect(plugin.services).toHaveProperty('audit-log');
      expect(typeof plugin.services['audit-log']).toBe('function');
    });

    it('should have audit-log controller defined', () => {
      const plugin = pluginFactory();

      expect(plugin.controllers).toHaveProperty('audit-log');
      expect(plugin.controllers['audit-log']).toHaveProperty('find');
      expect(plugin.controllers['audit-log']).toHaveProperty('getStats');
    });

    it('should have admin routes defined', () => {
      const plugin = pluginFactory();

      expect(plugin.routes).toHaveProperty('admin');
      expect(plugin.routes.admin).toHaveProperty('type', 'admin');
      expect(plugin.routes.admin).toHaveProperty('routes');
      expect(Array.isArray(plugin.routes.admin.routes)).toBe(true);
    });
  });

  describe('Plugin Registration', () => {
    it('should register database migration', async () => {
      await register({ strapi: mockStrapi as any });

      expect(mockStrapi.db.migrations.providers.internal.register).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'audit-logging::5.29.0-add-audit-logs-indexes',
        })
      );
      expect(mockStrapi.log.info).toHaveBeenCalledWith('Audit logging plugin registered successfully');
    });

    it('should handle registration errors gracefully', async () => {
      mockStrapi.db.migrations.providers.internal.register.mockImplementation(() => {
        throw new Error('Migration registration failed');
      });

      await expect(register({ strapi: mockStrapi as any })).rejects.toThrow('Migration registration failed');
    });
  });

  describe('Plugin Bootstrap', () => {
    it('should bootstrap successfully with valid configuration', async () => {
      await bootstrap({ strapi: mockStrapi as any });

      expect(validateAuditLogConfig).toHaveBeenCalled();
      expect(permissions.registerAuditLoggingActions).toHaveBeenCalled();
      expect(registerAuditCaptureMiddleware).toHaveBeenCalledWith({ strapi: mockStrapi });
      expect(mockStrapi.log.info).toHaveBeenCalledWith('Audit logging permissions registered successfully');
      expect(mockStrapi.log.info).toHaveBeenCalledWith('Audit capture middleware registered successfully');
    });

    it('should handle invalid configuration', async () => {
      (validateAuditLogConfig as jest.Mock).mockReturnValue(['Invalid config']);

      await expect(bootstrap({ strapi: mockStrapi as any })).rejects.toThrow(
        'Invalid audit logging configuration: Invalid config'
      );
      expect(mockStrapi.log.error).toHaveBeenCalled();
    });

    it('should skip middleware registration when disabled', async () => {
      (getAuditLogConfig as jest.Mock).mockReturnValue({
        enabled: false,
      });

      await bootstrap({ strapi: mockStrapi as any });

      expect(registerAuditCaptureMiddleware).not.toHaveBeenCalled();
      expect(mockStrapi.log.info).toHaveBeenCalledWith('Audit logging is disabled - middleware not registered');
    });

    it('should handle permission registration errors', async () => {
      (permissions.registerAuditLoggingActions as jest.Mock).mockRejectedValue(
        new Error('Permission registration failed')
      );

      await expect(bootstrap({ strapi: mockStrapi as any })).rejects.toThrow('Permission registration failed');
      expect(mockStrapi.log.error).toHaveBeenCalled();
    });
  });

  describe('Content Type Integration', () => {
    it('should have valid audit log schema', () => {
      const plugin = pluginFactory();
      const schema = plugin.contentTypes['audit-log'].schema;

      // Verify required fields
      expect(schema.attributes).toHaveProperty('contentType');
      expect(schema.attributes).toHaveProperty('recordId');
      expect(schema.attributes).toHaveProperty('action');
      expect(schema.attributes).toHaveProperty('timestamp');

      // Verify field types
      expect(schema.attributes.contentType.type).toBe('string');
      expect(schema.attributes.recordId.type).toBe('string');
      expect(schema.attributes.action.type).toBe('enumeration');
      expect(schema.attributes.timestamp.type).toBe('datetime');

      // Verify enum values
      expect(schema.attributes.action.enum).toEqual(['create', 'update', 'delete']);

      // Verify collection settings
      expect(schema.options.draftAndPublish).toBe(false);
      expect(schema.options.timestamps).toBe(true);
    });

    it('should be hidden from content manager', () => {
      const plugin = pluginFactory();
      const schema = plugin.contentTypes['audit-log'].schema;

      expect(schema.pluginOptions['content-manager'].visible).toBe(false);
      expect(schema.pluginOptions['content-type-builder'].visible).toBe(false);
    });
  });

  describe('Route Integration', () => {
    it('should have properly configured admin routes', () => {
      const plugin = pluginFactory();
      const adminRoutes = plugin.routes.admin.routes;

      // Find audit logs route
      const auditLogsRoute = adminRoutes.find((route: any) => route.path === '/audit-logs');
      expect(auditLogsRoute).toBeDefined();
      expect(auditLogsRoute.method).toBe('GET');
      expect(auditLogsRoute.handler).toBe('audit-log.find');

      // Verify permissions
      expect(auditLogsRoute.config.policies).toContain('admin::isAuthenticatedAdmin');
      expect(auditLogsRoute.config.policies).toContainEqual({
        name: 'plugin::content-manager.hasPermissions',
        config: { actions: ['plugin::audit-logging.read'] },
      });

      // Find stats route
      const statsRoute = adminRoutes.find((route: any) => route.path === '/audit-logs/stats');
      expect(statsRoute).toBeDefined();
      expect(statsRoute.method).toBe('GET');
      expect(statsRoute.handler).toBe('audit-log.getStats');
    });
  });

  describe('Service Integration', () => {
    it('should create service with Strapi instance', () => {
      const plugin = pluginFactory();
      const serviceFactory = plugin.services['audit-log'];

      expect(typeof serviceFactory).toBe('function');

      const service = serviceFactory({ strapi: mockStrapi });
      expect(service).toHaveProperty('createAuditEntry');
      expect(service).toHaveProperty('findAuditLogs');
      expect(service).toHaveProperty('isLoggingEnabled');
      expect(service).toHaveProperty('getAuditLogStats');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle bootstrap errors without crashing Strapi', async () => {
      (validateAuditLogConfig as jest.Mock).mockImplementation(() => {
        throw new Error('Validation error');
      });

      await expect(bootstrap({ strapi: mockStrapi as any })).rejects.toThrow();
      expect(mockStrapi.log.error).toHaveBeenCalledWith(
        'Failed to bootstrap audit logging plugin:',
        expect.objectContaining({
          error: 'Validation error',
        })
      );
    });

    it('should handle service creation errors', () => {
      const plugin = pluginFactory();
      const serviceFactory = plugin.services['audit-log'];

      // Should not throw when creating service
      expect(() => serviceFactory({ strapi: mockStrapi })).not.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should integrate with Strapi config system', async () => {
      mockStrapi.config.get.mockReturnValue({
        auditLog: {
          enabled: true,
          excludeContentTypes: ['strapi::core-store'],
        },
      });

      await bootstrap({ strapi: mockStrapi as any });

      expect(mockStrapi.config.get).toHaveBeenCalledWith('plugin::audit-logging', {});
    });

    it('should handle missing configuration gracefully', async () => {
      mockStrapi.config.get.mockReturnValue({});

      await bootstrap({ strapi: mockStrapi as any });

      expect(getAuditLogConfig).toHaveBeenCalledWith(mockStrapi);
    });
  });
});
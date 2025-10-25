import type { Core } from '@strapi/types';
import { registerAuditCaptureMiddleware } from './middlewares';
import permissions from './config/permissions';
import { validateAuditLogConfig, getAuditLogConfig } from './utils/config';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  try {
    // Validate plugin configuration
    const config = getAuditLogConfig(strapi);
    const configErrors = validateAuditLogConfig(config);
    
    if (configErrors.length > 0) {
      strapi.log.error('Invalid audit logging configuration:', {
        errors: configErrors,
      });
      throw new Error(`Invalid audit logging configuration: ${configErrors.join(', ')}`);
    }

    // Register audit logging permissions
    await permissions.registerAuditLoggingActions();
    strapi.log.info('Audit logging permissions registered successfully');

    // Register audit capture middleware if logging is enabled
    if (config.enabled !== false) {
      registerAuditCaptureMiddleware({ strapi });
      strapi.log.info('Audit capture middleware registered successfully');
    } else {
      strapi.log.info('Audit logging is disabled - middleware not registered');
    }

    // Log configuration summary
    strapi.log.info('Audit logging plugin bootstrapped successfully', {
      enabled: config.enabled,
      excludeContentTypes: config.excludeContentTypes?.length || 0,
      captureUserAgent: config.captureUserAgent,
      captureIpAddress: config.captureIpAddress,
    });

  } catch (error) {
    strapi.log.error('Failed to bootstrap audit logging plugin:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};
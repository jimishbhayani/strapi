/**
 * Default configuration for the audit logging plugin
 */
export default {
  default: {
    auditLog: {
      // Enable audit logging globally
      enabled: true,
      
      // Content types to exclude from audit logging
      excludeContentTypes: [
        // System content types
        'strapi::core-store',
        'strapi::webhook',
        
        // Admin content types
        'admin::permission',
        'admin::role',
        'admin::api-token',
        'admin::api-token-permission',
        'admin::transfer-token',
        'admin::transfer-token-permission',
        
        // Plugin content types that shouldn't be audited
        'plugin::upload.file',
        'plugin::upload.folder',
        'plugin::audit-logging.audit-log', // Don't audit the audit logs themselves
        
        // i18n plugin
        'plugin::i18n.locale',
      ],
      
      // Data retention period in days (0 = no automatic cleanup)
      retentionDays: 365,
      
      // Capture user agent information
      captureUserAgent: true,
      
      // Capture IP address information
      captureIpAddress: true,
      
      // Maximum number of audit logs to return per API request
      maxPageSize: 100,
      
      // Default page size for API requests
      defaultPageSize: 25,
    },
  },
  
  validator: (config: any) => {
    // Validate the configuration structure
    if (config.auditLog && typeof config.auditLog !== 'object') {
      throw new Error('auditLog configuration must be an object');
    }
    
    if (config.auditLog?.enabled !== undefined && typeof config.auditLog.enabled !== 'boolean') {
      throw new Error('auditLog.enabled must be a boolean');
    }
    
    if (config.auditLog?.excludeContentTypes !== undefined) {
      if (!Array.isArray(config.auditLog.excludeContentTypes)) {
        throw new Error('auditLog.excludeContentTypes must be an array');
      }
      
      const invalidTypes = config.auditLog.excludeContentTypes.filter(
        (type: any) => typeof type !== 'string'
      );
      
      if (invalidTypes.length > 0) {
        throw new Error('auditLog.excludeContentTypes must contain only strings');
      }
    }
    
    if (config.auditLog?.retentionDays !== undefined) {
      const retentionDays = config.auditLog.retentionDays;
      if (typeof retentionDays !== 'number' || retentionDays < 0) {
        throw new Error('auditLog.retentionDays must be a non-negative number');
      }
    }
    
    if (config.auditLog?.captureUserAgent !== undefined && typeof config.auditLog.captureUserAgent !== 'boolean') {
      throw new Error('auditLog.captureUserAgent must be a boolean');
    }
    
    if (config.auditLog?.captureIpAddress !== undefined && typeof config.auditLog.captureIpAddress !== 'boolean') {
      throw new Error('auditLog.captureIpAddress must be a boolean');
    }
    
    if (config.auditLog?.maxPageSize !== undefined) {
      const maxPageSize = config.auditLog.maxPageSize;
      if (typeof maxPageSize !== 'number' || maxPageSize < 1 || maxPageSize > 1000) {
        throw new Error('auditLog.maxPageSize must be a number between 1 and 1000');
      }
    }
    
    if (config.auditLog?.defaultPageSize !== undefined) {
      const defaultPageSize = config.auditLog.defaultPageSize;
      if (typeof defaultPageSize !== 'number' || defaultPageSize < 1) {
        throw new Error('auditLog.defaultPageSize must be a positive number');
      }
    }
  },
};
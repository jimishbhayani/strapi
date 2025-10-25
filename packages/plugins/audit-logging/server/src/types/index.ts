export interface AuditLogEntry {
  contentType: string;
  recordId: string;
  action: 'create' | 'update' | 'delete';
  userId?: number;
  payload?: any;
  changedFields?: any;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface AuditLogFilters {
  contentType?: string;
  userId?: number;
  action?: string | string[];
  startDate?: string;
  endDate?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface AuditLogQuery extends AuditLogFilters, PaginationParams {}

export interface AuditLogConfig {
  enabled?: boolean;
  excludeContentTypes?: string[];
  retentionDays?: number;
  captureUserAgent?: boolean;
  captureIpAddress?: boolean;
}
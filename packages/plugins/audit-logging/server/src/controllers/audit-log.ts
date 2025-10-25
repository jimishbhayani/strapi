import type { Core } from '@strapi/types';
import { errors } from '@strapi/utils';
import { getService } from '../utils';

const { ValidationError, ForbiddenError } = errors;

interface AuditLogQuery {
  contentType?: string;
  userId?: number;
  action?: string | string[];
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

const controller: Core.Controller = {
  /**
   * GET /audit-logs
   * Retrieve audit logs with filtering and pagination
   */
  async find(ctx) {
    try {
      // Extract query parameters
      const {
        contentType,
        userId,
        action,
        startDate,
        endDate,
        page,
        pageSize,
        sort,
      } = ctx.query as AuditLogQuery;

      // Validate query parameters
      const validatedQuery: AuditLogQuery = {};

      if (contentType) {
        if (typeof contentType !== 'string') {
          throw new ValidationError('contentType must be a string');
        }
        validatedQuery.contentType = contentType;
      }

      if (userId !== undefined) {
        const parsedUserId = parseInt(String(userId), 10);
        if (isNaN(parsedUserId)) {
          throw new ValidationError('userId must be a valid number');
        }
        validatedQuery.userId = parsedUserId;
      }

      if (action) {
        if (typeof action === 'string') {
          // Single action or comma-separated actions
          const actions = action.split(',').map(a => a.trim());
          const validActions = ['create', 'update', 'delete'];
          const invalidActions = actions.filter(a => !validActions.includes(a));
          
          if (invalidActions.length > 0) {
            throw new ValidationError(`Invalid action(s): ${invalidActions.join(', ')}. Valid actions are: ${validActions.join(', ')}`);
          }
          
          validatedQuery.action = actions.length === 1 ? actions[0] : actions;
        } else {
          throw new ValidationError('action must be a string or comma-separated string');
        }
      }

      if (startDate) {
        const date = new Date(String(startDate));
        if (isNaN(date.getTime())) {
          throw new ValidationError('startDate must be a valid ISO date string');
        }
        validatedQuery.startDate = String(startDate);
      }

      if (endDate) {
        const date = new Date(String(endDate));
        if (isNaN(date.getTime())) {
          throw new ValidationError('endDate must be a valid ISO date string');
        }
        validatedQuery.endDate = String(endDate);
      }

      if (page !== undefined) {
        const parsedPage = parseInt(String(page), 10);
        if (isNaN(parsedPage) || parsedPage < 1) {
          throw new ValidationError('page must be a positive number');
        }
        validatedQuery.page = parsedPage;
      }

      if (pageSize !== undefined) {
        const parsedPageSize = parseInt(String(pageSize), 10);
        if (isNaN(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > 100) {
          throw new ValidationError('pageSize must be a number between 1 and 100');
        }
        validatedQuery.pageSize = parsedPageSize;
      }

      if (sort) {
        if (typeof sort !== 'string') {
          throw new ValidationError('sort must be a string');
        }
        
        const [field, direction] = String(sort).split(':');
        const validFields = ['timestamp', 'contentType', 'action', 'userId'];
        const validDirections = ['asc', 'desc'];
        
        if (!validFields.includes(field)) {
          throw new ValidationError(`Invalid sort field: ${field}. Valid fields are: ${validFields.join(', ')}`);
        }
        
        if (direction && !validDirections.includes(direction)) {
          throw new ValidationError(`Invalid sort direction: ${direction}. Valid directions are: ${validDirections.join(', ')}`);
        }
        
        validatedQuery.sort = String(sort);
      }

      // Get audit log service
      const auditLogService = getService('audit-log', { strapi });

      // Fetch audit logs
      const result = await auditLogService.findAuditLogs(validatedQuery);

      // Return response in Strapi format
      ctx.body = result;

    } catch (error) {
      strapi.log.error('Failed to retrieve audit logs', {
        error: error.message,
        query: ctx.query,
        user: ctx.state.user?.id,
      });

      if (error instanceof ValidationError) {
        ctx.badRequest(error.message);
      } else {
        ctx.internalServerError('Failed to retrieve audit logs');
      }
    }
  },

  /**
   * GET /audit-logs/stats
   * Get audit log statistics
   */
  async getStats(ctx) {
    try {
      const auditLogService = getService('audit-log', { strapi });
      const stats = await auditLogService.getAuditLogStats();
      
      ctx.body = {
        data: stats,
      };

    } catch (error) {
      strapi.log.error('Failed to retrieve audit log statistics', {
        error: error.message,
        user: ctx.state.user?.id,
      });

      ctx.internalServerError('Failed to retrieve audit log statistics');
    }
  },
};

export default controller;
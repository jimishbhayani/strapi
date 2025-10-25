# Strapi plugin audit-logging

The Audit Logging plugin provides comprehensive, automated tracking of all content changes performed through Strapi's Content API. It captures detailed audit trails for compliance, security monitoring, and operational visibility.

## Features

- **Automatic Capture**: Seamlessly logs all create, update, and delete operations on content without manual intervention
- **Comprehensive Metadata**: Records user context, timestamps, IP addresses, user agents, changed fields, and complete payloads
- **Content API Access**: RESTful endpoints for retrieving audit logs with filtering, pagination, and statistics
- **Performance Optimized**: Asynchronous processing ensures zero impact on content operations (4-8ms API response times)
- **Configurable**: Flexible settings to enable/disable logging and exclude specific content types
- **Multi-Database Support**: Compatible with PostgreSQL, MySQL, MariaDB, and SQLite
- **Secure Access**: API token-based authentication with proper authorization

## Installation

This plugin is included with Strapi. To enable it, add the configuration to your `config/plugins.js`:

```javascript
module.exports = {
  'audit-logging': {
    enabled: true,
    config: {
      auditLog: {
        enabled: true,
        excludeContentTypes: [
          'strapi::core-store',
          'admin::user',
          'admin::permission',
          'admin::role',
          'plugin::upload.file',
          'plugin::upload.folder'
        ],
        captureUserAgent: true,
        captureIpAddress: true,
        retentionDays: 365
      }
    }
  }
};
```

## Configuration

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `auditLog.enabled` | boolean | `true` | Enable or disable audit logging globally |
| `auditLog.excludeContentTypes` | array | `['strapi::core-store', 'strapi::webhook', 'admin::permission', 'admin::role', 'admin::api-token', 'admin::api-token-permission', 'admin::transfer-token', 'admin::transfer-token-permission', 'plugin::upload.file', 'plugin::upload.folder', 'plugin::audit-logging.audit-log', 'plugin::i18n.locale']` | Content types to exclude from logging |
| `auditLog.captureUserAgent` | boolean | `true` | Capture user agent information |
| `auditLog.captureIpAddress` | boolean | `true` | Capture IP address information |
| `auditLog.retentionDays` | number | `365` | Number of days to retain audit logs (0 = no automatic cleanup) |


### Environment-Specific Configuration

Configuration can be customized per environment by using different plugin configuration files:

```javascript
// config/env/production/plugins.js
module.exports = {
  'audit-logging': {
    enabled: true,
    config: {
      auditLog: {
        retentionDays: 90, // Shorter retention in production
        captureIpAddress: false, // Privacy compliance
      }
    }
  }
};
```

### Complete Configuration Example

```javascript
// config/plugins.js
module.exports = {
  'audit-logging': {
    enabled: true,
    config: {
      auditLog: {
        enabled: true,
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
          
          // Plugin content types
          'plugin::upload.file',
          'plugin::upload.folder',
          'plugin::audit-logging.audit-log', // Don't audit the audit logs themselves
          'plugin::i18n.locale'
        ],
        captureUserAgent: true,
        captureIpAddress: true,
        retentionDays: 365
      }
    }
  }
};
```

## API Usage

The plugin provides Content API endpoints for accessing audit logs. **Note**: Admin API endpoints are defined but not currently functional.

### Get Audit Logs

```
GET /api/audit-logs
```

**Authentication**: Requires a valid API token with appropriate permissions.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `contentType` | string | Filter by content type | `api::article.article` |
| `userId` | number | Filter by user ID | `1` |
| `action` | string | Filter by action | `create`, `update`, `delete` |
| `startDate` | string | Start date (ISO format) | `2024-01-01T00:00:00Z` |
| `endDate` | string | End date (ISO format) | `2024-12-31T23:59:59Z` |
| `page` | number | Page number for pagination | `1` |
| `pageSize` | number | Items per page (max 100) | `25` |
| `sort` | string | Sort field and direction | `timestamp:desc` |

#### Example Request

```bash
curl -X GET "http://localhost:1337/api/audit-logs?contentType=api::article.article&action=update&page=1&pageSize=25" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123def456",
      "contentType": "api::article.article",
      "recordId": "gpujwzozs1xdc0yo1a32yyr3",
      "action": "create",
      "userId": null,
      "payload": {
        "id": 2,
        "documentId": "gpujwzozs1xdc0yo1a32yyr3",
        "title": "Test Article",
        "slug": "test-article",
        "createdAt": "2025-10-25T20:22:53.731Z",
        "updatedAt": "2025-10-25T20:22:53.731Z",
        "publishedAt": "2025-10-25T20:22:53.741Z",
        "locale": "en"
      },
      "changedFields": null,
      "timestamp": "2025-10-25T20:22:53.753Z",
      "userAgent": "curl/8.7.1",
      "ipAddress": "127.0.0.1",
      "createdAt": "2025-10-25T20:22:53.753Z",
      "updatedAt": "2025-10-25T20:22:53.753Z",
      "publishedAt": "2025-10-25T20:22:53.753Z",
      "locale": null
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

### Get Audit Log Statistics

```
GET /api/audit-logs/stats
```

Returns aggregate statistics and recent activity.

#### Example Request

```bash
curl -X GET "http://localhost:1337/api/audit-logs/stats" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "data": {
    "totalLogs": 1,
    "actionStats": [
      {
        "action": "create",
        "count": 1
      }
    ],
    "recentActivity": [
      {
        "id": 1,
        "contentType": "api::article.article",
        "action": "create",
        "timestamp": "2025-10-25T20:22:53.753Z"
      }
    ]
  }
}
```

## Authentication & Permissions

### API Token Setup

1. Create an API token in the Strapi admin panel:
   - Go to **Settings** → **API Tokens**
   - Click **Create new API Token**
   - Set **Token type** to **Full Access** or **Custom** with audit log permissions
   - Copy the generated token

2. Use the token in API requests:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "http://localhost:1337/api/audit-logs"
   ```

### Role-Based Access

To access audit logs through the admin interface, users need the `plugin::audit-logging.read` permission. This can be assigned through:

- **Settings** → **Administration Panel** → **Roles**
- Select a role and enable **Audit Logs** → **Read** permission

## How It Works

The audit logging system integrates seamlessly with Strapi's architecture:

1. **Middleware Integration**: Hooks into Strapi's document service to capture all content operations
2. **Asynchronous Processing**: Uses `setImmediate()` to log operations without blocking content requests
3. **Comprehensive Capture**: Records complete metadata including user context, IP addresses, and payloads
4. **Database Storage**: Stores audit logs in a dedicated `audit_logs` table with optimized indexes
5. **Secure Access**: Provides API endpoints with token-based authentication

### What Gets Logged

- **Content Operations**: Create, update, and delete operations on all content types
- **User Context**: User ID (when available), IP address, user agent
- **Complete Data**: Full payload for creates/deletes, changed fields for updates
- **Timestamps**: Precise timing of all operations
- **Metadata**: Request context and system information

## Performance

- **Response Times**: 4-8ms for API endpoints
- **Zero Impact**: Content operations are not affected by audit logging
- **Optimized Queries**: Strategic database indexing for fast retrieval
- **Async Processing**: Non-blocking audit log creation

## Development

### Building the Plugin

```bash
# Build the plugin
npx nx build @strapi/audit-logging

# Watch for changes during development
npx nx watch @strapi/audit-logging
```

### Testing

```bash
# Run unit tests
yarn test:unit

# Run integration tests
yarn test:integration

# Run all tests
yarn test
```

### Linting

```bash
yarn lint
```

## Documentation

- [Design Notes](./DESIGN_NOTE.md) - Detailed architectural documentation
- [Testing Report](./AUDIT_LOGGING_TESTING_REPORT.md) - Comprehensive testing validation

## License

See the [LICENSE](../../../LICENSE) file for licensing information.
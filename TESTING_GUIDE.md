# Audit Logging Plugin - Testing Guide

This guide provides step-by-step instructions for testing the Audit Logging Plugin functionality.

## Prerequisites

1. **Strapi Application**: You need a running Strapi application
2. **Database**: PostgreSQL, MySQL, or SQLite
3. **Admin User**: Access to Strapi admin panel
4. **API Client**: Postman, curl, or similar for API testing

## Testing Approach

### Phase 1: Plugin Integration Testing

#### 1.1 Enable the Plugin

Add the plugin to your Strapi application's `config/plugins.js`:

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
          'plugin::upload.file'
        ],
        captureUserAgent: true,
        captureIpAddress: true,
        retentionDays: 365
      }
    }
  }
};
```

#### 1.2 Start Strapi Application

```bash
# In your Strapi application directory
yarn develop
# or
npm run develop
```

**Expected Results:**
- ✅ Application starts without errors
- ✅ Console shows: "Audit logging plugin registered successfully"
- ✅ Console shows: "Audit logging permissions registered successfully"
- ✅ Console shows: "Audit capture middleware registered successfully"

#### 1.3 Check Database Migration

The plugin should automatically create the `audit_logs` table with proper indexes.

**SQL to verify (PostgreSQL/MySQL):**
```sql
-- Check if table exists
SELECT * FROM information_schema.tables WHERE table_name = 'audit_logs';

-- Check table structure
DESCRIBE audit_logs;

-- Check indexes
SHOW INDEX FROM audit_logs;
```

**Expected Results:**
- ✅ `audit_logs` table exists
- ✅ Table has all required columns: id, content_type, record_id, action, user_id, payload, changed_fields, timestamp, user_agent, ip_address
- ✅ Indexes exist on: content_type, user_id, action, timestamp

### Phase 2: Content Operation Testing

#### 2.1 Create Content Type

1. Go to Strapi Admin → Content-Type Builder
2. Create a new Collection Type called "Article" with fields:
   - `title` (Text)
   - `content` (Rich Text)
   - `status` (Enumeration: draft, published)

#### 2.2 Test CREATE Operations

1. Go to Content Manager → Articles
2. Create a new article:
   ```json
   {
     "title": "Test Article 1",
     "content": "This is test content",
     "status": "draft"
   }
   ```

**Expected Results:**
- ✅ Article created successfully
- ✅ Audit log entry created in database
- ✅ Check database: `SELECT * FROM audit_logs WHERE action = 'create';`

**Verify Audit Entry:**
```sql
SELECT 
  content_type,
  record_id,
  action,
  user_id,
  payload,
  timestamp
FROM audit_logs 
WHERE content_type = 'api::article.article' 
AND action = 'create'
ORDER BY timestamp DESC 
LIMIT 1;
```

#### 2.3 Test UPDATE Operations

1. Edit the article you just created
2. Change the title to "Updated Test Article 1"
3. Save the changes

**Expected Results:**
- ✅ Article updated successfully
- ✅ Audit log entry created with action = 'update'
- ✅ `changed_fields` contains only the modified fields

**Verify Audit Entry:**
```sql
SELECT 
  content_type,
  record_id,
  action,
  changed_fields,
  timestamp
FROM audit_logs 
WHERE content_type = 'api::article.article' 
AND action = 'update'
ORDER BY timestamp DESC 
LIMIT 1;
```

#### 2.4 Test DELETE Operations

1. Delete the article
2. Confirm deletion

**Expected Results:**
- ✅ Article deleted successfully
- ✅ Audit log entry created with action = 'delete'
- ✅ `payload` contains the full article data before deletion

### Phase 3: API Testing

#### 3.1 Set Up API Access

1. Go to Settings → Administration Panel → Roles
2. Edit a role (e.g., "Editor")
3. Find "Audit Logging" section
4. Enable "Read audit logs" permission
5. Save the role

#### 3.2 Get API Token

1. Go to Settings → API Tokens
2. Create a new token with appropriate permissions
3. Copy the token for API testing

#### 3.3 Test Audit Logs API

**Basic Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1337/api/audit-logs"
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": 1,
      "contentType": "api::article.article",
      "recordId": "1",
      "action": "create",
      "userId": 1,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "payload": {
        "title": "Test Article 1",
        "content": "This is test content",
        "status": "draft"
      },
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "127.0.0.1"
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

#### 3.4 Test Filtering

**Filter by Content Type:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1337/api/audit-logs?contentType=api::article.article"
```

**Filter by Action:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1337/api/audit-logs?action=create,update"
```

**Filter by Date Range:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1337/api/audit-logs?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z"
```

**Filter by User:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1337/api/audit-logs?userId=1"
```

#### 3.5 Test Pagination

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1337/api/audit-logs?page=1&pageSize=10&sort=timestamp:desc"
```

#### 3.6 Test Statistics API

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1337/api/audit-logs/stats"
```

**Expected Response:**
```json
{
  "data": {
    "totalLogs": 10,
    "actionStats": [
      { "action": "create", "count": 4 },
      { "action": "update", "count": 3 },
      { "action": "delete", "count": 3 }
    ],
    "recentActivity": [
      {
        "id": 10,
        "action": "delete",
        "timestamp": "2024-01-15T12:00:00.000Z"
      }
    ]
  }
}
```

### Phase 4: Configuration Testing

#### 4.1 Test Content Type Exclusions

1. Update `config/plugins.js` to exclude articles:
```javascript
excludeContentTypes: ['api::article.article']
```

2. Restart Strapi
3. Create/update/delete an article
4. Check that NO audit logs are created for articles

#### 4.2 Test Global Disable

1. Update `config/plugins.js`:
```javascript
auditLog: {
  enabled: false
}
```

2. Restart Strapi
3. Perform content operations
4. Check that NO audit logs are created

#### 4.3 Test Environment Variables

Set environment variables:
```bash
export STRAPI_AUDIT_LOG_ENABLED=true
export STRAPI_AUDIT_LOG_CAPTURE_USER_AGENT=false
export STRAPI_AUDIT_LOG_CAPTURE_IP_ADDRESS=false
```

Restart Strapi and verify configuration is applied.

### Phase 5: Performance Testing

#### 5.1 High-Volume Testing

Create a script to perform many operations quickly:

```javascript
// test-performance.js
const axios = require('axios');

const API_URL = 'http://localhost:1337/api';
const TOKEN = 'YOUR_API_TOKEN';

async function createManyArticles(count) {
  const promises = [];
  
  for (let i = 0; i < count; i++) {
    promises.push(
      axios.post(`${API_URL}/articles`, {
        data: {
          title: `Performance Test Article ${i}`,
          content: `Content for article ${i}`,
          status: 'draft'
        }
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      })
    );
  }
  
  const start = Date.now();
  await Promise.all(promises);
  const end = Date.now();
  
  console.log(`Created ${count} articles in ${end - start}ms`);
  console.log(`Average: ${(end - start) / count}ms per article`);
}

createManyArticles(100);
```

**Expected Results:**
- ✅ All articles created successfully
- ✅ Average time per article < 100ms
- ✅ All audit logs created
- ✅ No errors in Strapi logs

#### 5.2 Database Performance

Check query performance:
```sql
-- Check audit logs count
SELECT COUNT(*) FROM audit_logs;

-- Test index performance
EXPLAIN SELECT * FROM audit_logs 
WHERE content_type = 'api::article.article' 
ORDER BY timestamp DESC 
LIMIT 25;

-- Should show index usage, not full table scan
```

### Phase 6: Error Handling Testing

#### 6.1 Test Permission Errors

1. Remove audit logging permissions from user role
2. Try to access audit logs API
3. Should receive 403 Forbidden error

#### 6.2 Test Invalid Parameters

```bash
# Invalid action
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1337/api/audit-logs?action=invalid"

# Invalid date
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1337/api/audit-logs?startDate=invalid-date"

# Invalid page size
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1337/api/audit-logs?pageSize=1000"
```

**Expected Results:**
- ✅ Proper error messages returned
- ✅ HTTP 400 Bad Request status
- ✅ Detailed validation error descriptions

### Phase 7: Multi-Database Testing

If you have access to different databases, test with:

#### 7.1 PostgreSQL
- Verify all functionality works
- Check JSON field handling
- Verify index creation

#### 7.2 MySQL
- Verify all functionality works
- Check JSON field compatibility
- Verify index creation

#### 7.3 SQLite
- Verify all functionality works
- Check JSON field handling
- Verify index creation

## Troubleshooting

### Common Issues

1. **Plugin not loading:**
   - Check `config/plugins.js` syntax
   - Verify plugin is in correct directory
   - Check Strapi logs for errors

2. **No audit logs created:**
   - Check if content type is excluded
   - Verify `auditLog.enabled` is true
   - Check Strapi logs for middleware errors

3. **API returns 403:**
   - Verify user has `plugin::audit-logging.read` permission
   - Check API token permissions

4. **Database errors:**
   - Verify database connection
   - Check if migration ran successfully
   - Verify table and indexes exist

### Debug Mode

Enable debug logging in `config/logger.js`:
```javascript
module.exports = {
  level: 'debug',
  transports: [
    {
      type: 'console',
      options: {
        level: 'debug'
      }
    }
  ]
};
```

This will show detailed audit logging debug messages.

## Success Criteria

✅ **All tests pass if:**
- Plugin loads without errors
- Database migration creates table and indexes
- Content operations create audit logs
- API returns audit logs with proper filtering
- Permissions work correctly
- Configuration options work as expected
- Performance is acceptable (< 100ms overhead)
- Error handling works properly
- Multi-database compatibility confirmed

## Next Steps

After successful testing:
1. Deploy to staging environment
2. Run extended performance tests
3. Set up monitoring and alerting
4. Configure data retention policies
5. Train users on audit log access
6. Document operational procedures

The audit logging plugin is now ready for production use! 🎉
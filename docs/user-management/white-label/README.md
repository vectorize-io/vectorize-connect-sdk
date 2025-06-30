# User Management - White-Label Approach

Manage users in White-Label connectors using your own OAuth credentials.

## Complete User Lifecycle Management

With White-Label connectors, you have full control over the user lifecycle and must explicitly manage all user operations:

### Add Users
Users must be explicitly added after completing OAuth authentication:

```typescript
import { manageUser, manageNotionUser } from '@vectorize-io/vectorize-connect';

// For Google Drive and Dropbox
await manageUser(
  config,
  connectorId,
  userId,
  'add',
  { selectedFiles: userFileSelection, accessToken: oauthToken }
);

// For Notion (uses specialized function)
await manageNotionUser(
  config,
  connectorId,
  selectedPages,
  accessToken,
  userId,
  'add'
);
```

### Edit Users
Update user file/page selections:

```typescript
// Update file selection for Google Drive/Dropbox
await manageUser(
  config,
  connectorId,
  userId,
  'edit',
  { selectedFiles: newFileSelection, accessToken: refreshedToken }
);

// Update page selection for Notion
await manageNotionUser(
  config,
  connectorId,
  newSelectedPages,
  refreshedAccessToken,
  userId,
  'edit'
);
```

### Remove Users
Remove users from connectors:

```typescript
// Remove user (works for all platforms)
await manageUser(config, connectorId, userId, 'remove');

// For Notion, you can also use the specialized function
await manageNotionUser(config, connectorId, null, '', userId, 'remove');
```

## Platform-Specific Examples

For detailed platform-specific user management examples:

- [Google Drive User Management](./google-drive.md)
- [Dropbox User Management](./dropbox.md)
- [Notion User Management](./notion.md)

## Next Steps

- [Frontend Implementation](../../frontend-implementation/white-label/)
- [Testing](../../testing/white-label/)

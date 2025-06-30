# User Management

This section covers how to manage users in connectors using different approaches.

## Approaches

- **[Vectorize](./vectorize/)** - User management with Vectorize's managed flow
- **[White-Label](./white-label/)** - User management with custom OAuth flows

## Overview

User management involves adding, editing, and removing users from connectors. The approach differs based on whether you're using Vectorize's managed OAuth or your own OAuth applications.

### Vectorize Approach
- Users are automatically added through Vectorize's authentication flow
- Use `manageUser` function for editing and removing users
- Simplified user management with consistent API

### White-Label Approach
- Manual user management through API calls
- Platform-specific user management functions available
- Full control over user lifecycle

## Quick Reference

### Generic User Management
```typescript
import { manageUser } from '@vectorize-io/vectorize-connect';

// Add/edit user
await manageUser(config, connectorId, userId, 'add', payload);

// Remove user
await manageUser(config, connectorId, userId, 'remove');
```

### Platform-Specific User Management
```typescript
import { managePlatformUser } from '@vectorize-io/vectorize-connect';

await managePlatformUser(
  config,
  connectorId,
  selectedFiles,
  refreshToken,
  userId,
  action
);
```

## Common Operations

### Adding Users
Users are typically added during the authentication flow, but can also be added programmatically.

### Editing User File Selection
Allow users to modify their file selection without re-authenticating.

### Removing Users
Remove users from connectors when they no longer need access.

## Error Handling

```typescript
try {
  await manageUser(config, connectorId, userId, action, payload);
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Connector or user not found');
  } else if (error.response?.status === 403) {
    console.error('Insufficient permissions');
  } else {
    console.error('User management failed:', error.message);
  }
}
```

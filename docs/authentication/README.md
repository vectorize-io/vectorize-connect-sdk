# Authentication

This section covers authentication flows for different connector approaches.

## Approaches

- **[Vectorize](./vectorize/)** - Authentication using Vectorize's managed OAuth flow
- **[White-Label](./white-label/)** - Authentication using your own OAuth applications

## Overview

Authentication is the process of connecting users to their cloud storage accounts and obtaining the necessary permissions to access their files.

### Vectorize Approach
- Users are redirected to Vectorize's platform for authentication
- Vectorize handles the OAuth flow and token management
- Simplified implementation with consistent user experience

### White-Label Approach
- Users authenticate directly with your OAuth application
- Full control over the authentication experience
- Requires implementing OAuth callback handling

## Platform-Specific Guides

### Vectorize Approach
- [Google Drive Authentication](./vectorize/google-drive.md)
- [Dropbox Authentication](./vectorize/dropbox.md)
- [Notion Authentication](./vectorize/notion.md)

### White-Label Approach
- [Google Drive Authentication](./white-label/google-drive.md)
- [Dropbox Authentication](./white-label/dropbox.md)
- [Notion Authentication](./white-label/notion.md)

## Quick Reference

### Vectorize Authentication Flow
```typescript
import { getOneTimeConnectorToken, GoogleDriveOAuth } from '@vectorize-io/vectorize-connect';

// 1. Generate one-time token
const tokenResponse = await getOneTimeConnectorToken(config, userId, connectorId);

// 2. Redirect to Vectorize authentication (example with Google Drive)
await GoogleDriveOAuth.redirectToVectorizeConnect(
  tokenResponse.token,
  organizationId
);
```

### White-Label Authentication Flow
```typescript
import { GoogleDriveOAuth } from '@vectorize-io/vectorize-connect';

// Start OAuth flow in popup (example with Google Drive)
GoogleDriveOAuth.startOAuth({
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  redirectUri: `${window.location.origin}/api/oauth/callback`,
  onSuccess: (response) => {
    // Handle successful authentication
  },
  onError: (error) => {
    // Handle authentication error
  }
});
```

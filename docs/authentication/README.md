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

## Quick Reference

### Vectorize Authentication Flow
```typescript
import { getOneTimeConnectorToken, PlatformOAuth } from '@vectorize-io/vectorize-connect';

// 1. Generate one-time token
const tokenResponse = await getOneTimeConnectorToken(config, userId, connectorId);

// 2. Redirect to Vectorize authentication
await PlatformOAuth.redirectToVectorizeConnect(
  tokenResponse.token,
  organizationId
);
```

### White-Label Authentication Flow
```typescript
import { PlatformOAuth } from '@vectorize-io/vectorize-connect';

// Start OAuth flow in popup
PlatformOAuth.startOAuth({
  clientId: process.env.PLATFORM_CLIENT_ID!,
  redirectUri: `${window.location.origin}/api/oauth/callback`,
  onSuccess: (response) => {
    // Handle successful authentication
  },
  onError: (error) => {
    // Handle authentication error
  }
});
```

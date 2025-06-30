# Authentication - White-Label Approach

Authentication strategies for white-label connectors with custom OAuth flows.

## Overview

White-label authentication allows you to use your own OAuth applications and branding while integrating with cloud storage platforms. This approach gives you complete control over the user experience and OAuth credentials.

## Prerequisites

Before implementing white-label authentication, you need to set up OAuth applications for each platform:

### Google Drive OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Configure authorized redirect URIs

### Dropbox OAuth Setup
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app
3. Choose "Scoped access" and "Full Dropbox"
4. Configure redirect URIs
5. Note your App key and App secret

### Notion OAuth Setup
1. Go to [Notion Developers](https://developers.notion.com/)
2. Create a new integration
3. Configure OAuth settings
4. Note your Client ID and Client Secret

## Environment Variables

```bash
# Required for all white-label connectors
VECTORIZE_API_KEY=your_vectorize_api_token
VECTORIZE_ORGANIZATION_ID=your_organization_id

# Google Drive OAuth credentials
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
GOOGLE_API_KEY=your_google_api_key

# Dropbox OAuth credentials
DROPBOX_APP_KEY=your_dropbox_app_key
DROPBOX_APP_SECRET=your_dropbox_app_secret

# Notion OAuth credentials
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
```

## Basic Authentication Flow

### 1. Create White-Label Connector

```typescript
import { createWhiteLabelGDriveConnector } from '@vectorize-io/vectorize-connect';

const vectorizeConfig = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
};

// Create Google Drive connector with your OAuth credentials
const connectorId = await createWhiteLabelGDriveConnector(
  vectorizeConfig,
  "My Custom Google Drive Connector",
  process.env.GOOGLE_OAUTH_CLIENT_ID!,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET!
);
```

### 2. Start OAuth Flow

```typescript
import { GoogleDriveOAuth } from '@vectorize-io/vectorize-connect';

const oauthConfig = {
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  apiKey: process.env.GOOGLE_API_KEY!,
  redirectUri: 'http://localhost:3000/api/oauth/callback',
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  onSuccess: (response) => {
    console.log('OAuth successful:', response);
    // Handle successful authentication
  },
  onError: (error) => {
    console.error('OAuth failed:', error);
    // Handle authentication error
  },
};

// Start OAuth flow
GoogleDriveOAuth.startOAuth(oauthConfig);
```

### 3. Handle OAuth Callback

```typescript
// pages/api/oauth/callback.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code, error } = req.query;

  if (error) {
    return res.status(500).json({ error: 'OAuth authentication failed' });
  }

  if (code) {
    try {
      // Exchange code for tokens
      // Add user to connector
      // Redirect to success page
      res.redirect('/success');
    } catch (error) {
      res.status(500).json({ error: 'Failed to complete authentication' });
    }
  }
}
```

## Advanced Authentication Patterns

### Multi-Platform Component

```typescript
import React, { useState } from 'react';
import { 
  GoogleDriveOAuth, 
  DropboxOAuth, 
  NotionOAuth 
} from '@vectorize-io/vectorize-connect';

interface AuthenticationManagerProps {
  onSuccess: (platform: string, response: any) => void;
  onError: (platform: string, error: Error) => void;
}

export function AuthenticationManager({ onSuccess, onError }: AuthenticationManagerProps) {
  const [isAuthenticating, setIsAuthenticating] = useState<string | null>(null);

  const startGoogleDriveAuth = () => {
    setIsAuthenticating('google-drive');
    GoogleDriveOAuth.startOAuth({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
      redirectUri: `${window.location.origin}/api/oauth/callback`,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      onSuccess: (response) => {
        setIsAuthenticating(null);
        onSuccess('google-drive', response);
      },
      onError: (error) => {
        setIsAuthenticating(null);
        onError('google-drive', error);
      },
    });
  };

  const startDropboxAuth = () => {
    setIsAuthenticating('dropbox');
    DropboxOAuth.startOAuth({
      appKey: process.env.NEXT_PUBLIC_DROPBOX_APP_KEY!,
      appSecret: process.env.DROPBOX_APP_SECRET!,
      redirectUri: `${window.location.origin}/api/dropbox-callback`,
      scopes: ['files.metadata.read', 'files.content.read'],
      onSuccess: (response) => {
        setIsAuthenticating(null);
        onSuccess('dropbox', response);
      },
      onError: (error) => {
        setIsAuthenticating(null);
        onError('dropbox', error);
      },
    });
  };

  const startNotionAuth = () => {
    setIsAuthenticating('notion');
    NotionOAuth.startOAuth({
      clientId: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID!,
      clientSecret: process.env.NOTION_CLIENT_SECRET!,
      redirectUri: `${window.location.origin}/api/notion-callback`,
      scopes: ['read'],
      onSuccess: (response) => {
        setIsAuthenticating(null);
        onSuccess('notion', response);
      },
      onError: (error) => {
        setIsAuthenticating(null);
        onError('notion', error);
      },
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Connect Your Accounts</h3>
      
      <button
        onClick={startGoogleDriveAuth}
        disabled={isAuthenticating === 'google-drive'}
        className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isAuthenticating === 'google-drive' ? 'Connecting...' : 'Connect Google Drive'}
      </button>

      <button
        onClick={startDropboxAuth}
        disabled={isAuthenticating === 'dropbox'}
        className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {isAuthenticating === 'dropbox' ? 'Connecting...' : 'Connect Dropbox'}
      </button>

      <button
        onClick={startNotionAuth}
        disabled={isAuthenticating === 'notion'}
        className="w-full p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
      >
        {isAuthenticating === 'notion' ? 'Connecting...' : 'Connect Notion'}
      </button>
    </div>
  );
}
```

### Token Management

```typescript
import { manageUser } from '@vectorize-io/vectorize-connect';

class WhiteLabelTokenManager {
  private config = {
    authorization: process.env.VECTORIZE_API_KEY!,
    organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
  };

  async addUserWithTokens(
    connectorId: string,
    userId: string,
    platform: 'google-drive' | 'dropbox' | 'notion',
    tokens: any,
    selectedFiles?: string[]
  ) {
    try {
      const result = await manageUser(
        this.config,
        connectorId,
        userId,
        'add',
        {
          tokens,
          selectedFiles,
          platform,
        }
      );

      return result;
    } catch (error) {
      console.error(`Failed to add user to ${platform} connector:`, error);
      throw error;
    }
  }

  async refreshUserTokens(
    connectorId: string,
    userId: string,
    refreshToken: string
  ) {
    // Platform-specific token refresh logic
    // This would vary by platform
  }
}
```

## Error Handling

```typescript
try {
  const connectorId = await createWhiteLabelGDriveConnector(
    vectorizeConfig,
    "My Connector",
    clientId,
    clientSecret
  );
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid Vectorize API token');
  } else if (error.response?.status === 400) {
    console.error('Invalid OAuth credentials provided');
  } else if (error.message.includes('OAuth')) {
    console.error('OAuth configuration error:', error.message);
  } else {
    console.error('Connector creation failed:', error.message);
  }
}
```

## Security Best Practices

### Environment Variable Management

```typescript
// Validate required environment variables
const requiredEnvVars = [
  'VECTORIZE_API_KEY',
  'VECTORIZE_ORGANIZATION_ID',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

### Secure Token Storage

```typescript
// Never expose client secrets in frontend code
// Use server-side API routes for sensitive operations

// pages/api/auth/google-drive.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Server-side OAuth handling with client secret
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET; // Safe on server
  
  // Process OAuth flow server-side
}
```

## Platform-Specific Examples

For detailed platform-specific authentication examples:

- [Google Drive Authentication](./google-drive.md)
- [Dropbox Authentication](./dropbox.md)
- [Notion Authentication](./notion.md)

## Next Steps

- [User Management](../../user-management/white-label/)
- [Frontend Implementation](../../frontend-implementation/white-label/)

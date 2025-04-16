# Vectorize Connect SDK

TypeScript/JavaScript SDK for connecting different platforms such as Google Drive and Dropbox to the Vectorize platform.

This is a lightweight client that provides functionality for OAuth authentication and Vectorize API integration. The SDK helps you create connectors to various platforms, let users select files, and manage those connections through the Vectorize platform.

## SDK Installation

### NPM
```bash
npm install @vectorize-io/vectorize-connect
```

### Yarn
```bash
yarn add @vectorize-io/vectorize-connect
```

### pnpm
```bash
npm add @vectorize-io/vectorize-connect
```

## Documentation

For detailed documentation, please refer to:

- [General Guide](./docs/general-guide.md) - Overview and common concepts
- [Google Drive Guide](./docs/google-drive-guide.md) - Google Drive specific integration
- [Dropbox Guide](./docs/dropbox-guide.md) - Dropbox specific integration
- [API Reference](./docs/API.md) - Complete API documentation
- [White Label Guide](./docs/white-label-guide.md) - White label integration
- [Non-White Label Guide](./docs/non-white-label-guide.md) - Non-white label integration
- [Setup Guide](./docs/setup.md) - Setup instructions

## SDK Example Usage

### Google Drive OAuth with White Label

```typescript
import { startGDriveOAuth } from '@vectorize-io/vectorize-connect';

const handleOAuth = () => {
  startGDriveOAuth({
    clientId: 'YOUR_GOOGLE_OAUTH_CLIENT_ID',
    clientSecret: 'YOUR_GOOGLE_OAUTH_CLIENT_SECRET',
    apiKey: "YOUR_GOOGLE_API_KEY",
    redirectUri: 'https://your-app.com/oauth/callback',
    scopes: [
      'https://www.googleapis.com/auth/drive.file'
    ],
    onSuccess: (response) => {
      console.log('Selected files:', response.fileIds);
      console.log('Refresh token:', response.refreshToken);
    },
    onError: (error) => {
      console.error('Authentication failed:', error);
    }
  });
};
```

## Server-Side OAuth Callback Handler for White Label  (Next.js)

```typescript
// pages/api/oauth/callback.js or app/api/oauth/callback/route.js
import { createGDrivePickerCallbackResponse } from '@vectorize-io/vectorize-connect';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  
  const config = {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri: `${process.env.BASE_URL}/api/oauth/callback`,
    apiKey: process.env.GOOGLE_API_KEY
  };
  
  const response = await createGDrivePickerCallbackResponse(
    code,
    config,
    error
  );
  
  // Return the response directly
  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'text/html' }
  });
}
```

### Using Vectorize's Hosted OAuth

```typescript
import { redirectToVectorizeGoogleDriveConnect, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

const connectToGoogleDrive = async () => {
  try {
    // Get one-time token from API endpoint
    const tokenResponse = await fetch(`/api/get-one-time-connector-token?userId=user123&connectorId=connector-id`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate token. Status: ${response.status}`);
        }
        return response.json();
      });
    
    // Connect to Google Drive using Vectorize platform
    await redirectToVectorizeGoogleDriveConnect(
      tokenResponse.token,
      'your-org-id',
      'https://platform.vectorize.io' // Optional platform URL
    );
    
    console.log('Connection process completed');
  } catch (error) {
    console.error('Connection process failed:', error);
  }
};
```

### File Selection with Existing Refresh Token

```typescript
import { startGDriveFileSelection } from '@vectorize-io/vectorize-connect';

const selectFiles = async (refreshToken) => {
  await startGDriveFileSelection({
    clientId: 'YOUR_GOOGLE_OAUTH_CLIENT_ID',
    clientSecret: 'YOUR_GOOGLE_OAUTH_CLIENT_SECRET',
    apiKey: 'YOUR_GOOGLE_API_KEY',
    onSuccess: (response) => {
      console.log('Selected files:', response.fileIds);
    },
    onError: (error) => {
      console.error('File selection failed:', error);
    }
  }, refreshToken);
};
```

### Creating a Google Drive Connector

```typescript
import { createGDriveSourceConnector } from '@vectorize-io/vectorize-connect';

const createConnector = async () => {
  try {
    // Standard connector using Vectorize's OAuth
    const connectorId = await createGDriveSourceConnector(
      {
        organizationId: 'YOUR_VECTORIZE_ORG_ID',
        authorization: 'YOUR_VECTORIZE_TOKEN'
      },
      false, // Use Vectorize's OAuth
      'My Google Drive Connector' // Name of the new connector
    );
    
    console.log('Created connector ID:', connectorId);
    return connectorId;
  } catch (error) {
    console.error('Failed to create connector:', error);
  }
};

const createWhiteLabelConnector = async () => {
  try {
    // White label connector using your own OAuth credentials
    const connectorId = await createGDriveSourceConnector(
      {
        organizationId: 'YOUR_VECTORIZE_ORG_ID',
        authorization: 'YOUR_VECTORIZE_TOKEN'
      },
      true, // White label with your own OAuth
      'My White Label Connector', // Name of the new connector
      'https://api.vectorize.io/v1', // Default API URL
      'YOUR_GOOGLE_OAUTH_CLIENT_ID',
      'YOUR_GOOGLE_OAUTH_CLIENT_SECRET'
    );
    
    console.log('Created white label connector ID:', connectorId);
    return connectorId;
  } catch (error) {
    console.error('Failed to create white label connector:', error);
  }
};
```

### Managing Google Drive Users

Functions to manage Users in the vectorize connector:

```typescript
import { manageGDriveUser } from '@vectorize-io/vectorize-connect';

// Add a user's Google Drive files to a connector
const addUser = async (connectorId, fileIds, refreshToken, userId) => {
  try {
    await manageGDriveUser(
      {
        organizationId: 'YOUR_VECTORIZE_ORG_ID',
        authorization: 'YOUR_VECTORIZE_TOKEN'
      },
      connectorId,
      fileIds,
      refreshToken,
      userId,
      'add' // Add a new user
    );
    
    console.log('User added successfully');
  } catch (error) {
    console.error('Failed to add user:', error);
  }
};

// Update a user's file selection
const updateUser = async (connectorId, fileIds, refreshToken, userId) => {
  try {
    await manageGDriveUser(
      {
        organizationId: 'YOUR_VECTORIZE_ORG_ID',
        authorization: 'YOUR_VECTORIZE_TOKEN'
      },
      connectorId,
      fileIds,
      refreshToken,
      userId,
      'edit' // Update existing user
    );
    
    console.log('User updated successfully');
  } catch (error) {
    console.error('Failed to update user:', error);
  }
};

// Remove a user's access
const removeUser = async (connectorId, fileIds, refreshToken, userId) => {
  try {
    await manageGDriveUser(
      {
        organizationId: 'YOUR_VECTORIZE_ORG_ID',
        authorization: 'YOUR_VECTORIZE_TOKEN'
      },
      connectorId,
      fileIds,
      refreshToken,
      userId,
      'remove' // Remove user
    );
    
    console.log('User removed successfully');
  } catch (error) {
    console.error('Failed to remove user:', error);
  }
};
```

### Dropbox OAuth with White Label

```typescript
import { startDropboxOAuth } from '@vectorize-io/vectorize-connect';

const handleOAuth = () => {
  startDropboxOAuth({
    appKey: 'YOUR_DROPBOX_APP_KEY',
    appSecret: 'YOUR_DROPBOX_APP_SECRET',
    redirectUri: 'https://your-app.com/oauth/callback',
    scopes: [
      'files.metadata.read',
      'files.content.read'
    ],
    onSuccess: (response) => {
      console.log('Selected files:', response.selectedFiles);
      console.log('Refresh token:', response.refreshToken);
    },
    onError: (error) => {
      console.error('Authentication failed:', error);
    }
  });
};
```

### Server-Side Dropbox OAuth Callback Handler (Next.js)

```typescript
// pages/api/oauth/dropbox-callback.js or app/api/oauth/dropbox-callback/route.js
import { createDropboxPickerCallbackResponse } from '@vectorize-io/vectorize-connect';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  
  const config = {
    appKey: process.env.DROPBOX_APP_KEY,
    appSecret: process.env.DROPBOX_APP_SECRET,
    redirectUri: `${process.env.BASE_URL}/api/oauth/dropbox-callback`
  };
  
  const response = await createDropboxPickerCallbackResponse(
    code,
    config,
    error
  );
  
  // Return the response directly
  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'text/html' }
  });
}
```

### Using Vectorize's Hosted Dropbox OAuth

```typescript
import { redirectToVectorizeDropboxConnect, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

const connectToDropbox = async () => {
  try {
    // Get one-time token from API endpoint
    const tokenResponse = await fetch(`/api/get-one-time-connector-token?userId=user123&connectorId=connector-id`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate token. Status: ${response.status}`);
        }
        return response.json();
      });
    
    // Connect to Dropbox using Vectorize platform
    await redirectToVectorizeDropboxConnect(
      tokenResponse.token,
      'your-org-id',
      'https://platform.vectorize.io' // Optional platform URL
    );
    
    console.log('Connection process completed');
  } catch (error) {
    console.error('Connection process failed:', error);
  }
};
```

### Creating Dropbox Connectors

```typescript
import { createVectorizeDropboxConnector, createWhiteLabelDropboxConnector } from '@vectorize-io/vectorize-connect';

const createVectorizeConnector = async () => {
  try {
    // Standard connector using Vectorize's OAuth
    const connectorId = await createVectorizeDropboxConnector(
      {
        organizationId: 'YOUR_VECTORIZE_ORG_ID',
        authorization: 'YOUR_VECTORIZE_TOKEN'
      },
      'My Dropbox Connector' // Name of the new connector
    );
    
    console.log('Created connector ID:', connectorId);
    return connectorId;
  } catch (error) {
    console.error('Failed to create connector:', error);
  }
};

const createCustomConnector = async () => {
  try {
    // White label connector using your own OAuth credentials
    const connectorId = await createWhiteLabelDropboxConnector(
      {
        organizationId: 'YOUR_VECTORIZE_ORG_ID',
        authorization: 'YOUR_VECTORIZE_TOKEN'
      },
      'My White Label Connector', // Name of the new connector
      'YOUR_DROPBOX_APP_KEY',
      'YOUR_DROPBOX_APP_SECRET'
    );
    
    console.log('Created white label connector ID:', connectorId);
    return connectorId;
  } catch (error) {
    console.error('Failed to create white label connector:', error);
  }
};
```

### Managing Dropbox Users

```typescript
import { manageDropboxUser } from '@vectorize-io/vectorize-connect';

// Add a user's Dropbox files to a connector
const addUser = async (connectorId, selectedFiles, refreshToken, userId) => {
  try {
    await manageDropboxUser(
      {
        organizationId: 'YOUR_VECTORIZE_ORG_ID',
        authorization: 'YOUR_VECTORIZE_TOKEN'
      },
      connectorId,
      selectedFiles, // Object with file metadata including paths
      refreshToken,
      userId,
      'add' // Add a new user
    );
    
    console.log('User added successfully');
  } catch (error) {
    console.error('Failed to add user:', error);
  }
};

// Example of selected files format
const selectedFiles = {
  'file-id-1': { 
    name: 'Document.pdf', 
    mimeType: 'application/pdf',
    path: '/Documents/Document.pdf'
  },
  'file-id-2': { 
    name: 'Spreadsheet.xlsx', 
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    path: '/Spreadsheets/Spreadsheet.xlsx'
  }
};
```


## Change the Base URL

If you need to connect to a different Vectorize API endpoint:

```typescript
import { createGDriveSourceConnector } from '@vectorize-io/vectorize-connect';

const createConnector = async () => {
  try {
    const connectorId = await createGDriveSourceConnector(
      {
        organizationId: 'YOUR_VECTORIZE_ORG_ID'
      },
      false,
      'My Connector',
      'https://custom-api.vectorize.io/v1' // Custom API URL
    );
    
    return connectorId;
  } catch (error) {
    console.error('Failed to create connector:', error);
  }
};
```

## API Reference

### OAuth Functions

#### `startGDriveOAuth(config: OAuthConfig): Window | null`

Initiates the Google Drive OAuth flow in a popup window with file selection.

#### `startGDriveFileSelection(config: OAuthConfig, refreshToken: string, targetWindow?: Window): Promise<Window | null>`

Opens a file picker using an existing refresh token, without repeating the OAuth flow.

#### `createGDrivePickerCallbackResponse(code: string, config: OAuthConfig, error?: string | OAuthError): Promise<Response>`

Creates a response for the OAuth callback page to handle token exchange and file picking.

#### `redirectToVectorizeGoogleDriveConnect(oneTimeToken: string, organizationId: string, platformUrl?: string): Promise<void>`

Redirects to Vectorize's hosted Google Drive connection page in an iframe, which handles OAuth and file selection using a secure one-time token. Automatically adds the user to the specified connector ID without requiring a separate API route.

#### `getOneTimeConnectorToken(config: VectorizeAPIConfig, userId: string, connectorId: string, platformUrl?: string): Promise<{ token: string; expires_at: number; ttl: number }>`

Gets a one-time authentication token for connector operations. This token is used for secure authentication when redirecting users to the Vectorize platform.

### Vectorize API Functions

#### `createGDriveSourceConnector(config: VectorizeAPIConfig, whiteLabel: boolean, connectorName: string, platformUrl?: string, clientId?: string, clientSecret?: string): Promise<string>`

Creates a Google Drive connector in Vectorize, returning the connector ID.

#### `manageGDriveUser(config: VectorizeAPIConfig, connectorId: string, fileIds: string[], refreshToken: string, userId: string, action: "add" | "edit" | "remove", platformUrl?: string): Promise<Response>`

Adds, updates, or removes a user's Google Drive files from a Vectorize connector.

## Configuration Types

### `OAuthConfig`

| Property | Type | Description |
|----------|------|-------------|
| `clientId` | `string` | Your Google OAuth client ID |
| `clientSecret` | `string` | Your Google OAuth client secret (server-side only) |
| `redirectUri` | `string` | URI where Google will redirect after authentication |
| `apiKey` | `string` | Google API key for using the Picker API |
| `scopes` | `string[]` | Google OAuth scopes to request |
| `onSuccess` | `(response: OAuthResponse) => void` | Success callback function |
| `onError` | `(error: OAuthError) => void` | Error callback function |

### `VectorizeAPIConfig`

| Property | Type | Description |
|----------|------|-------------|
| `organizationId` | `string` | Your Vectorize organization ID |
| `authorization` | `string` | Your Vectorize API key (optional) |

## Requirements

- This SDK is compatible with Node.js environments and modern browsers
- TypeScript 4.7+ for type definitions
- Next.js 14.0.0+ for server components (optional)

## Summary

The Vectorize Connect SDK provides:

- OAuth authentication for Google Drive and Dropbox
- File selection functionality
- Token management for platform APIs
- Vectorize API integration for connectors
- User management capabilities

## Detailed Documentation

For more detailed documentation, please refer to the following guides:

- [API Reference](./docs/API.md)
- [White-label Integration Guide](./docs/white-label-guide.md)
- [Non-white-label Integration Guide](./docs/non-white-label-guide.md)
- [TypeScript Definitions](./docs/types.md)
- [Setup Guide](./docs/setup.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Vectorize Connect SDK

TypeScript/JavaScript SDK for connecting different platforms such as Google Drive to the Vectorize platform.

This is a lightweight client that provides functionality for Google Drive OAuth authentication and Vectorize API integration. The SDK helps you create connectors to Google Drive, let users select files, and manage those connections through the Vectorize platform.

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
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
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
import { redirectToVectorizeGoogleDriveConnect } from '@vectorize-io/vectorize-connect';

const connectToGoogleDrive = async () => {
  try {
    // Connect to Google Drive using Vectorize platform
    await redirectToVectorizeGoogleDriveConnect(
      { authorization: 'Bearer your-token', organizationId: 'your-org-id' },
      'user123', // User identifier
      'connector-id', // Google Drive connector ID
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

#### `redirectToVectorizeGoogleDriveConnect(config: VectorizeAPIConfig, userId: string, connectorId: string): Promise<void>`

Redirects to Vectorize's hosted Google Drive connection page in an iframe, which handles OAuth and file selection. Automatically adds the user to the specified connector ID without requiring a separate API route.

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

- Google Drive OAuth authentication
- File selection functionality
- Token management for Google Drive API
- Vectorize API integration for Google Drive connectors
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

# API Reference

This document provides detailed information about the functions and components exported by the `@vectorize-io/vectorize-connect` package.

## Table of Contents

- [OAuth Functions](#oauth-functions)
  - [startGDriveOAuth](#startgdriveoauth)
  - [createGDrivePickerCallbackResponse](#creategdrivepickercallbackresponse)
  - [redirectToVectorizeGoogleDriveConnect](#redirecttovectorizegoogledriveconnect)
  - [startDropboxOAuth](#startdropboxoauth)
  - [createDropboxPickerCallbackResponse](#createdropboxpickercallbackresponse)
  - [redirectToVectorizeDropboxConnect](#redirecttovectorizedropboxconnect)
- [Selection Functions](#selection-functions)
  - [startGDriveFileSelection](#startgdrivefileselection)
  - [startDropboxFileSelection](#startdropboxfileselection)
- [API Functions](#api-functions)
  - [createGDriveSourceConnector](#creategdrivesourceconnector)
  - [manageGDriveUser](#managegdriveuser)
  - [createVectorizeDropboxConnector](#createvectorizedropboxconnector)
  - [createWhiteLabelDropboxConnector](#createwhitelabeldropboxconnector)
  - [manageDropboxUser](#managedropboxuser)
  - [getOneTimeConnectorToken](#getonetimeconnectortoken)
- [Token Utilities](#token-utilities)
  - [refreshGDriveAccessToken](#refreshgdriveaccesstoken)
  - [exchangeGDriveCodeForTokens](#exchangegdrivecodefortokens)
  - [refreshDropboxToken](#refreshdropboxtoken)
  - [exchangeDropboxCodeForTokens](#exchangedropboxcodefortokens)
- [UI Components](#ui-components)
  - [GoogleDrivePicker](#googledrivepicker)
  - [DropboxPicker](#dropboxpicker)

## OAuth Functions

### startGDriveOAuth

Creates an OAuth popup window for Google authentication.

```typescript
function startGDriveOAuth(config: OAuthConfig): Window | null
```

**Parameters:**

- `config`: An `OAuthConfig` object containing:
  - `clientId`: Your Google OAuth client ID
  - `clientSecret`: Your Google OAuth client secret
  - `apiKey`: Your Google API key
  - `redirectUri`: The URI to redirect to after authentication
  - `scopes` (optional): Array of OAuth scopes (defaults to drive.file)
  - `onSuccess`: Callback function when authentication succeeds
  - `onError`: Callback function when authentication fails

**Returns:**

- A `Window` object representing the popup window, or `null` if the popup couldn't be created

**Example:**

```typescript
const popup = startGDriveOAuth({
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  apiKey: process.env.GOOGLE_API_KEY!,
  redirectUri: `${window.location.origin}/api/google-callback`,
  onSuccess: (selection) => {
    console.log('Selected files:', selection.fileIds);
    console.log('Refresh token:', selection.refreshToken);
  },
  onError: (error) => {
    console.error('OAuth error:', error.message);
  }
});
```

### createGDrivePickerCallbackResponse

Creates a response for the OAuth callback page. This function is typically used in a Next.js API route to handle the OAuth redirect.

```typescript
async function createGDrivePickerCallbackResponse(
  code: string,
  config: OAuthConfig,
  error?: string | OAuthError
): Promise<Response>
```

**Parameters:**

- `code`: Authorization code from the OAuth redirect
- `config`: An `OAuthConfig` object
- `error` (optional): Error from the OAuth process

**Returns:**

- A `Response` object with the callback page HTML

**Example:**

```typescript
// In a Next.js API route
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const config = {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    apiKey: process.env.GOOGLE_API_KEY!,
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/google-callback`
  };

  return createGDrivePickerCallbackResponse(
    code || '',
    config,
    error || undefined
  );
}
```

### redirectToVectorizeGoogleDriveConnect

Redirects to the Vectorize platform's Google Drive connection page using a one-time token for security. This is used for non-white-label integration.

```typescript
function redirectToVectorizeGoogleDriveConnect(
  oneTimeToken: string,
  organizationId: string,
  platformUrl: string = 'https://platform.vectorize.io'
): Promise<void>
```

**Parameters:**

- `oneTimeToken`: A one-time security token generated using `getOneTimeConnectorToken`
- `organizationId`: Your Vectorize organization ID
- `platformUrl` (optional): URL of the Vectorize platform (defaults to 'https://platform.vectorize.io')

**Returns:**

- A `Promise` that resolves when the iframe is closed

**Example:**

```typescript
const handleConnectGoogleDrive = async () => {
  try {
    // Get one-time token from API endpoint
    const tokenResponse = await fetch(`/api/get-one-time-connector-token?userId=user123&connectorId=connector-id`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate token. Status: ${response.status}`);
        }
        return response.json();
      });
    
    // Then use the token to redirect to the Google Drive connect page
    await redirectToVectorizeGoogleDriveConnect(
      tokenResponse.token,
      'your-org-id',
      'https://platform.vectorize.io' // Optional
    );
    
    console.log('Google Drive connection completed');
  } catch (err) {
    console.error('Google Drive connection error:', err);
  }
};
```

### startDropboxOAuth

Creates an OAuth popup window for Dropbox authentication.

```typescript
function startDropboxOAuth(config: DropboxOAuthConfig): Window | null
```

**Parameters:**

- `config`: A `DropboxOAuthConfig` object containing:
  - `appKey`: Your Dropbox App key
  - `appSecret`: Your Dropbox App secret
  - `redirectUri`: The URI to redirect to after authentication
  - `scopes` (optional): Array of OAuth scopes (defaults to ["files.metadata.read", "files.content.read"])
  - `onSuccess`: Callback function when authentication succeeds
  - `onError`: Callback function when authentication fails

**Returns:**

- A `Window` object representing the popup window, or `null` if the popup couldn't be created

**Example:**

```typescript
const popup = startDropboxOAuth({
  appKey: process.env.DROPBOX_APP_KEY!,
  appSecret: process.env.DROPBOX_APP_SECRET!,
  redirectUri: `${window.location.origin}/api/dropbox-callback`,
  onSuccess: (selection) => {
    console.log('Selected files:', selection.selectedFiles);
    console.log('Refresh token:', selection.refreshToken);
  },
  onError: (error) => {
    console.error('OAuth error:', error.message);
  }
});
```

### createDropboxPickerCallbackResponse

Creates a response for the OAuth callback page. This function is typically used in a Next.js API route to handle the OAuth redirect.

```typescript
async function createDropboxPickerCallbackResponse(
  code: string,
  config: DropboxOAuthConfig,
  error?: string | OAuthError
): Promise<Response>
```

**Parameters:**

- `code`: Authorization code from the OAuth redirect
- `config`: A `DropboxOAuthConfig` object
- `error` (optional): Error from the OAuth process

**Returns:**

- A `Response` object with the callback page HTML

**Example:**

```typescript
// In a Next.js API route
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const config = {
    appKey: process.env.DROPBOX_APP_KEY!,
    appSecret: process.env.DROPBOX_APP_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/dropbox-callback`
  };

  return createDropboxPickerCallbackResponse(
    code || '',
    config,
    error || undefined
  );
}
```

### redirectToVectorizeDropboxConnect

Redirects to the Vectorize platform's Dropbox connection page using a one-time token for security. This is used for non-white-label integration.

```typescript
function redirectToVectorizeDropboxConnect(
  oneTimeToken: string,
  organizationId: string,
  platformUrl: string = 'https://platform.vectorize.io'
): Promise<void>
```

**Parameters:**

- `oneTimeToken`: A one-time security token generated using `getOneTimeConnectorToken`
- `organizationId`: Your Vectorize organization ID
- `platformUrl` (optional): URL of the Vectorize platform (defaults to 'https://platform.vectorize.io')

**Returns:**

- A `Promise` that resolves when the iframe is closed

**Example:**

```typescript
const handleConnectDropbox = async () => {
  try {
    // Get one-time token from API endpoint
    const tokenResponse = await fetch(`/api/get-one-time-connector-token?userId=user123&connectorId=connector-id`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate token. Status: ${response.status}`);
        }
        return response.json();
      });
    
    // Then use the token to redirect to the Dropbox connect page
    await redirectToVectorizeDropboxConnect(
      tokenResponse.token,
      'your-org-id',
      'https://platform.vectorize.io' // Optional
    );
    
    console.log('Dropbox connection completed');
  } catch (err) {
    console.error('Dropbox connection error:', err);
  }
};
```

## Selection Functions

### startGDriveFileSelection

Creates a popup for file selection using an existing refresh token. This is typically used after a user has already authenticated.

```typescript
async function startGDriveFileSelection(
  config: OAuthConfig,
  refreshToken: string,
  targetWindow?: Window
): Promise<Window | null>
```

**Parameters:**

- `config`: An `OAuthConfig` object
- `refreshToken`: An existing refresh token to use
- `targetWindow` (optional): Window to use instead of creating a new popup

**Returns:**

- A `Promise` that resolves to a `Window` object representing the popup window, or `null` if the popup couldn't be created

**Example:**

```typescript
const handleSelectMoreFiles = async () => {
  const config = {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    apiKey: process.env.GOOGLE_API_KEY!,
    redirectUri: `${window.location.origin}/api/google-callback`,
    onSuccess: (selection) => {
      console.log('Additional files selected:', selection.fileIds);
    },
    onError: (error) => {
      console.error('Selection error:', error.message);
    }
  };
  
  const popup = await startGDriveFileSelection(config, existingRefreshToken);
};
```

### startDropboxFileSelection

Creates a popup for file selection using an existing refresh token. This is typically used after a user has already authenticated.

```typescript
async function startDropboxFileSelection(
  config: DropboxOAuthConfig,
  refreshToken: string,
  selectedFiles?: Record<string, { name: string; mimeType: string; path?: string }>,
  targetWindow?: Window
): Promise<Window | null>
```

**Parameters:**

- `config`: A `DropboxOAuthConfig` object
- `refreshToken`: An existing refresh token to use
- `selectedFiles` (optional): Previously selected files to pre-populate the selection
- `targetWindow` (optional): Window to use instead of creating a new popup

**Returns:**

- A `Promise` that resolves to a `Window` object representing the popup window, or `null` if the popup couldn't be created

**Example:**

```typescript
const handleSelectMoreFiles = async () => {
  const config = {
    appKey: process.env.DROPBOX_APP_KEY!,
    appSecret: process.env.DROPBOX_APP_SECRET!,
    redirectUri: `${window.location.origin}/api/dropbox-callback`,
    onSuccess: (selection) => {
      console.log('Additional files selected:', selection.selectedFiles);
    },
    onError: (error) => {
      console.error('Selection error:', error.message);
    }
  };
  
  const popup = await startDropboxFileSelection(
    config, 
    existingRefreshToken,
    existingSelectedFiles // Optional
  );
};
```

## API Functions

### createGDriveSourceConnector

Creates a Google Drive OAuth Connector Source via the Vectorize API.

```typescript
async function createGDriveSourceConnector(
  config: VectorizeAPIConfig,
  whiteLabel: boolean,
  connectorName: string,
  platformUrl: string = "https://api.vectorize.io/v1",
  clientId?: string,
  clientSecret?: string
): Promise<Response>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object containing:
  - `organizationId`: Your Vectorize organization ID
  - `authorization`: Your Vectorize API key
- `whiteLabel`: Whether to create a white-label connector
- `connectorName`: Name for the connector
- `platformUrl` (optional): URL of the Vectorize API (defaults to 'https://api.vectorize.io/v1')
- `clientId` (optional): Required for white-label connectors
- `clientSecret` (optional): Required for white-label connectors

**Returns:**

- A `Promise` that resolves with the connector ID

**Example:**

```typescript
// Create a non-white-label connector
const connectorId = await createGDriveSourceConnector(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  false, // non-white-label
  "My Google Drive Connector",
  "https://api.vectorize.io/v1"
);

// Create a white-label connector
const whitelabelConnectorId = await createGDriveSourceConnector(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  true, // white-label
  "My White-Label Google Drive Connector",
  "https://api.vectorize.io/v1",
  process.env.GOOGLE_OAUTH_CLIENT_ID!,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET!
);
```

### createVectorizeDropboxConnector

Creates a Dropbox OAuth Connector Source via the Vectorize API.

```typescript
async function createVectorizeDropboxConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  platformUrl: string = "https://api.vectorize.io/v1"
): Promise<string>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object containing:
  - `organizationId`: Your Vectorize organization ID
  - `authorization`: Your Vectorize API key
- `connectorName`: Name for the connector
- `platformUrl` (optional): URL of the Vectorize API (defaults to 'https://api.vectorize.io/v1')

**Returns:**

- A `Promise` that resolves with the connector ID

**Example:**

```typescript
// Create a Vectorize-managed connector
const connectorId = await createVectorizeDropboxConnector(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  "My Dropbox Connector",
  "https://api.vectorize.io/v1"
);
```

### createWhiteLabelDropboxConnector

Creates a White Label Dropbox OAuth Connector Source via the Vectorize API.

```typescript
async function createWhiteLabelDropboxConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  appKey: string,
  appSecret: string,
  platformUrl: string = "https://api.vectorize.io/v1"
): Promise<string>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object containing:
  - `organizationId`: Your Vectorize organization ID
  - `authorization`: Your Vectorize API key
- `connectorName`: Name for the connector
- `appKey`: Your Dropbox App key
- `appSecret`: Your Dropbox App secret
- `platformUrl` (optional): URL of the Vectorize API (defaults to 'https://api.vectorize.io/v1')

**Returns:**

- A `Promise` that resolves with the connector ID

**Example:**

```typescript
// Create a white-label connector
const connectorId = await createWhiteLabelDropboxConnector(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  "My White-Label Dropbox Connector",
  process.env.DROPBOX_APP_KEY!,
  process.env.DROPBOX_APP_SECRET!
);
```

### manageGDriveUser

Manages a Google Drive user for a connector, allowing you to add, edit, or remove users.

```typescript
async function manageGDriveUser(
  config: VectorizeAPIConfig,
  connectorId: string,
  selectedFiles: Record<string, { name: string; mimeType: string }> | null,
  refreshToken: string,
  userId: string,
  action: "add" | "edit" | "remove",
  platformUrl: string = "https://api.vectorize.io/v1"
): Promise<Response>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object
- `connectorId`: ID of the connector
- `selectedFiles`: Record of selected files with their metadata (name and mimeType)
- `refreshToken`: Google OAuth refresh token
- `userId`: User ID to manage
- `action`: Action to perform ("add", "edit", or "remove")
- `platformUrl` (optional): URL of the Vectorize API (primarily used for testing)

**Returns:**

- A `Promise` that resolves with the API response

**Example:**

```typescript
// Add a user to a connector
const response = await manageGDriveUser(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  connectorId,
  {
    'file-id-1': { name: 'Document 1', mimeType: 'application/pdf' },
    'file-id-2': { name: 'Spreadsheet 1', mimeType: 'application/vnd.google-apps.spreadsheet' }
  },
  refreshToken,
  "user123",
  "add",
  "https://api.vectorize.io/v1"
);

// Edit a user's selected files
const updateResponse = await manageGDriveUser(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  connectorId,
  {
    'file-id-3': { name: 'Document 2', mimeType: 'application/pdf' },
    'file-id-4': { name: 'Presentation 1', mimeType: 'application/vnd.google-apps.presentation' }
  },
  refreshToken,
  "user123",
  "edit",
  "https://api.vectorize.io/v1"
);

// Remove a user
const removeResponse = await manageGDriveUser(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  connectorId,
  null, // No files needed for removal
  refreshToken,
  "user123",
  "remove",
  "https://api.vectorize.io/v1"
);
```

### manageDropboxUser

Manages a Dropbox user for a connector, allowing you to add, edit, or remove users.

```typescript
async function manageDropboxUser(
  config: VectorizeAPIConfig,
  connectorId: string,
  selectedFiles: Record<string, { name: string; mimeType: string; path?: string }> | null,
  refreshToken: string,
  userId: string,
  action: "add" | "edit" | "remove",
  platformUrl: string = "https://api.vectorize.io/v1"
): Promise<Response>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object
- `connectorId`: ID of the connector
- `selectedFiles`: Record of selected files with their metadata (name, mimeType, and path)
- `refreshToken`: Dropbox OAuth refresh token
- `userId`: User ID to manage
- `action`: Action to perform ("add", "edit", or "remove")
- `platformUrl` (optional): URL of the Vectorize API (primarily used for testing)

**Returns:**

- A `Promise` that resolves with the API response

**Example:**

```typescript
// Add a user to a connector
const response = await manageDropboxUser(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  connectorId,
  {
    'file-id-1': { name: 'Document 1', mimeType: 'application/pdf', path: '/path/to/doc.pdf' },
    'file-id-2': { name: 'Spreadsheet 1', mimeType: 'text/csv', path: '/path/to/data.csv' }
  },
  refreshToken,
  "user123",
  "add"
);

// Edit a user's selected files
const updateResponse = await manageDropboxUser(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  connectorId,
  {
    'file-id-3': { name: 'Document 2', mimeType: 'application/pdf', path: '/path/to/doc2.pdf' },
    'file-id-4': { name: 'Presentation 1', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', path: '/path/to/presentation.pptx' }
  },
  refreshToken,
  "user123",
  "edit"
);

// Remove a user
const removeResponse = await manageDropboxUser(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  connectorId,
  null, // No files needed for removal
  refreshToken,
  "user123",
  "remove"
);
```

### getOneTimeConnectorToken

Gets a one-time authentication token for connector operations. This token is used for secure authentication when redirecting users to the Vectorize platform.

```typescript
// This function is used server-side in your API endpoint
async function getOneTimeConnectorToken(
  config: VectorizeAPIConfig,
  userId: string,
  connectorId: string,
  platformUrl: string = "https://api.vectorize.io/v1"
): Promise<{ token: string; expires_at: number; ttl: number }>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object containing:
  - `authorization`: Your Vectorize authorization token
  - `organizationId`: Your Vectorize organization ID
- `userId`: User ID to include in the token
- `connectorId`: Connector ID to include in the token
- `platformUrl` (optional): URL of the Vectorize API (defaults to 'https://api.vectorize.io/v1')

**Returns:**

- A `Promise` that resolves with an object containing:
  - `token`: The one-time token string
  - `expires_at`: Timestamp when the token expires
  - `ttl`: Time-to-live in seconds

**Example:**

```typescript
// Server-side API endpoint implementation (Next.js)
// File: app/api/get-one-time-connector-token/route.ts
import { getOneTimeConnectorToken, VectorizeAPIConfig } from "@vectorize-io/vectorize-connect";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get authentication details from environment variables
    const apiKey = process.env.VECTORIZE_TOKEN;
    const organizationId = process.env.VECTORIZE_ORG;
    
    if (!apiKey || !organizationId) {
      return NextResponse.json({ 
        error: 'Missing Vectorize API configuration' 
      }, { status: 500 });
    }
    
    // Configure the Vectorize API client
    const config: VectorizeAPIConfig = {
      authorization: apiKey,
      organizationId: organizationId
    };
    
    // Get userId and connectorId from request url
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const connectorId = searchParams.get('connectorId');
    
    // Validate userId and connectorId
    if (!userId || !connectorId) {
      return NextResponse.json({ 
        error: 'Missing userId or connectorId' 
      }, { status: 400 });
    }
    
    // Call Vectorize API to get the token
    // This is where we use the SDK function server-side
    const tokenResponse = await getOneTimeConnectorToken(
      config,
      userId,
      connectorId
    );
    
    // Return the token to the client
    return NextResponse.json(tokenResponse, { status: 200 });
    
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ 
      error: 'Failed to generate token', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Client-side usage
// In your component or page:
const getConnectorToken = async (userId, connectorId) => {
  try {
    const response = await fetch(`/api/get-one-time-connector-token?userId=${userId}&connectorId=${connectorId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to generate token. Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting connector token:', error);
    throw error;
  }
};

// Example usage
const tokenResponse = await getConnectorToken('user123', 'connector-id');
console.log('One-time token:', tokenResponse.token);
console.log('Token expires at:', new Date(tokenResponse.expires_at).toISOString());
```

## Token Utilities

### refreshGDriveAccessToken

Refreshes an OAuth access token using a refresh token.

```typescript
async function refreshGDriveAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<OAuthResponse>
```

**Parameters:**

- `clientId`: The OAuth client ID
- `clientSecret`: The OAuth client secret
- `refreshToken`: The refresh token

**Returns:**

- A `Promise` resolving to an `OAuthResponse` with a new access token

**Example:**

```typescript
const tokens = await refreshGDriveAccessToken(
  process.env.GOOGLE_OAUTH_CLIENT_ID!,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  storedRefreshToken
);

console.log('New access token:', tokens.access_token);
```

### exchangeGDriveCodeForTokens

Exchanges an authorization code for OAuth tokens.

```typescript
async function exchangeGDriveCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<OAuthResponse>
```

**Parameters:**

- `code`: The authorization code from OAuth redirect
- `clientId`: The OAuth client ID
- `clientSecret`: The OAuth client secret
- `redirectUri`: The redirect URI used in the authorization

**Returns:**

- A `Promise` resolving to an `OAuthResponse` containing access and refresh tokens

**Example:**

```typescript
const tokens = await exchangeGDriveCodeForTokens(
  authCode,
  process.env.GOOGLE_OAUTH_CLIENT_ID!,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/google-callback`
);

console.log('Access token:', tokens.access_token);
console.log('Refresh token:', tokens.refresh_token);
```

### refreshDropboxToken

Refreshes an OAuth access token using a refresh token.

```typescript
async function refreshDropboxToken(
  refreshToken: string,
  appKey: string,
  appSecret: string
): Promise<{
  access_token: string;
  expires_in: number;
  token_type: string;
}>
```

**Parameters:**

- `refreshToken`: The refresh token
- `appKey`: The Dropbox App key
- `appSecret`: The Dropbox App secret

**Returns:**

- A `Promise` resolving to an object with a new access token

**Example:**

```typescript
const tokens = await refreshDropboxToken(
  storedRefreshToken,
  process.env.DROPBOX_APP_KEY!,
  process.env.DROPBOX_APP_SECRET!
);

console.log('New access token:', tokens.access_token);
```

### exchangeDropboxCodeForTokens

Exchanges an authorization code for OAuth tokens.

```typescript
async function exchangeDropboxCodeForTokens(
  code: string,
  appKey: string,
  appSecret: string,
  redirectUri: string
): Promise<OAuthResponse>
```

**Parameters:**

- `code`: The authorization code from OAuth redirect
- `appKey`: The Dropbox App key
- `appSecret`: The Dropbox App secret
- `redirectUri`: The redirect URI used in the authorization

**Returns:**

- A `Promise` resolving to an `OAuthResponse` containing access and refresh tokens

**Example:**

```typescript
const tokens = await exchangeDropboxCodeForTokens(
  authCode,
  process.env.DROPBOX_APP_KEY!,
  process.env.DROPBOX_APP_SECRET!,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/dropbox-callback`
);

console.log('Access token:', tokens.access_token);
console.log('Refresh token:', tokens.refresh_token);
```

## UI Components

### GoogleDrivePicker

A module for Google Drive picker functionality.

```typescript
const GoogleDrivePicker = {
  createPickerHTML(tokens: OAuthResponse, config: any, refreshToken: string): string
}
```

**Methods:**

- `createPickerHTML`: Creates an HTML template for the picker page
  - `tokens`: OAuth tokens for API access
  - `config`: Configuration with API key and client ID
  - `refreshToken`: Refresh token to include in selection data
  - Returns: HTML string for the picker interface

**Example:**

```typescript
// This is typically used internally by the SDK
const htmlContent = GoogleDrivePicker.createPickerHTML(
  tokens,
  {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    apiKey: process.env.GOOGLE_API_KEY!
  },
  refreshToken
);
```

Note: The `GoogleDrivePicker` component is primarily used internally by the SDK and you typically won't need to use it directly.

### DropboxPicker

A module for Dropbox picker functionality.

```typescript
const DropboxPicker = {
  createPickerHTML(tokens: OAuthResponse, config: any, refreshToken: string, preSelectedFiles?: Record<string, { name: string; mimeType: string; path?: string }>): string
}
```

**Methods:**

- `createPickerHTML`: Creates an HTML template for the picker page
  - `tokens`: OAuth tokens for API access
  - `config`: Configuration with App key and App secret
  - `refreshToken`: Refresh token to include in selection data
  - `preSelectedFiles`: Optional map of files to initialize as selected
  - Returns: HTML string for the picker interface

**Example:**

```typescript
// This is typically used internally by the SDK
const htmlContent = DropboxPicker.createPickerHTML(
  tokens,
  {
    appKey: process.env.DROPBOX_APP_KEY!,
    appSecret: process.env.DROPBOX_APP_SECRET!
  },
  refreshToken,
  preSelectedFiles
);
```

Note: The `DropboxPicker` component is primarily used internally by the SDK and you typically won't need to use it directly.

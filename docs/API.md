# API Reference

This document provides detailed information about the functions and components exported by the `@vectorize-io/vectorize-connect` package.

## Table of Contents

- [OAuth Functions](#oauth-functions)
  - [startGDriveOAuth](#startgdriveoauth)
  - [createGDrivePickerCallbackResponse](#creategdrivepickercallbackresponse)
  - [redirectToVectorizeGoogleDriveConnect](#redirecttovectorizegoogledriveconnect)
- [Selection Functions](#selection-functions)
  - [startGDriveFileSelection](#startgdrivefileselection)
- [API Functions](#api-functions)
  - [createGDriveSourceConnector](#creategdrivesourceconnector)
  - [manageGDriveUser](#managegdriveuser)
- [Token Utilities](#token-utilities)
  - [refreshGDriveAccessToken](#refreshgdriveaccesstoken)
  - [exchangeGDriveCodeForTokens](#exchangegdrivecodefortokens)
- [UI Components](#ui-components)
  - [GoogleDrivePicker](#googledrivepicker)

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
  - `scopes` (optional): Array of OAuth scopes (defaults to drive.readonly and drive.metadata.readonly)
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

Redirects to the Vectorize platform's Google Drive connection page with configuration. This is used for non-white-label integration.

```typescript
function redirectToVectorizeGoogleDriveConnect(
  config: VectorizeAPIConfig,
  callbackUri: string,
  platformUrl: string = 'https://platform.vectorize.io'
): Promise<void>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object containing:
  - `authorization`: Your Vectorize authorization token
  - `organizationId`: Your Vectorize organization ID
- `callbackUri`: URI that will receive the POST with selection data
- `platformUrl` (optional): URL of the Vectorize platform (defaults to 'https://platform.vectorize.io')

**Returns:**

- A `Promise` that resolves when the iframe is closed

**Example:**

```typescript
const handleConnectGoogleDrive = async () => {
  try {
    const callbackUrl = `${window.location.origin}/api/add-google-drive-user/${connectorId}`;
    
    await redirectToVectorizeGoogleDriveConnect(
      callbackUrl, 
      'https://platform.vectorize.io'
    );
    
    console.log('Google Drive connection completed');
  } catch (err) {
    console.error('Google Drive connection error:', err);
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
    authorization: process.env.VECTORIZE_API_KEY!
  },
  false, // non-white-label
  "My Google Drive Connector",
  "https://api.vectorize.io/v1"
);

// Create a white-label connector
const whitelabelConnectorId = await createGDriveSourceConnector(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_API_KEY!
  },
  true, // white-label
  "My White-Label Google Drive Connector",
  "https://api.vectorize.io/v1",
  process.env.GOOGLE_OAUTH_CLIENT_ID!,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET!
);
```

### manageGDriveUser

Manages a Google Drive user for a connector, allowing you to add, edit, or remove users.

```typescript
async function manageGDriveUser(
  config: VectorizeAPIConfig,
  connectorId: string,
  fileIds: string[],
  refreshToken: string,
  userId: string,
  action: "add" | "edit" | "remove",
  platformUrl: string = "https://api.vectorize.io/v1"
): Promise<Response>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object
- `connectorId`: ID of the connector
- `fileIds`: Array of Google Drive file IDs
- `refreshToken`: Google OAuth refresh token
- `userId`: User ID to manage
- `action`: Action to perform ("add", "edit", or "remove")
- `platformUrl` (optional): URL of the Vectorize API (defaults to 'https://api.vectorize.io/v1')

**Returns:**

- A `Promise` that resolves with the API response

**Example:**

```typescript
// Add a user to a connector
const response = await manageGDriveUser(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_API_KEY!
  },
  connectorId,
  selectedFileIds,
  refreshToken,
  "user123",
  "add",
  "https://api.vectorize.io/v1"
);

// Edit a user's selected files
const updateResponse = await manageGDriveUser(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_API_KEY!
  },
  connectorId,
  newSelectedFileIds,
  refreshToken,
  "user123",
  "edit",
  "https://api.vectorize.io/v1"
);

// Remove a user
const removeResponse = await manageGDriveUser(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_API_KEY!
  },
  connectorId,
  [],
  "",
  "user123",
  "remove",
  "https://api.vectorize.io/v1"
);
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

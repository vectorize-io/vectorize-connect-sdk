# API Reference

This document provides a comprehensive reference for all functions and classes available in the Vectorize Connect SDK.

## Table of Contents

- [OAuth Classes](#oauth-classes)
  - [GoogleDriveOAuth](#googledriveoauth)
  - [DropboxOAuth](#dropboxoauth)
- [Selection Classes](#selection-classes)
  - [GoogleDriveSelection](#googledriveselection)
  - [DropboxSelection](#dropboxselection)
- [Connector Functions](#connector-functions)
  - [createVectorizeGDriveConnector](#createvectorizegdriveconnector)
  - [createWhiteLabelGDriveConnector](#createwhitelabelgdriveconnector)
  - [createVectorizeDropboxConnector](#createvectorizedropboxconnector)
  - [createWhiteLabelDropboxConnector](#createwhitelabeldropboxconnector)
  - [createVectorizeNotionConnector](#createvectorizenotionconnector)
  - [createWhiteLabelNotionConnector](#createwhitelabelnotionconnector)
- [Base API Functions](#base-api-functions)
  - [createSourceConnector](#createsourceconnector)
  - [manageUser](#manageuser)
  - [getOneTimeConnectorToken](#getonetimeconnectortoken)
- [Token Utilities](#token-utilities)
  - [exchangeGDriveCodeForTokens](#exchangegdrivecodefortokens)
  - [refreshGDriveToken](#refreshgdrivetoken)
  - [exchangeDropboxCodeForTokens](#exchangedropboxcodefortokens)
  - [refreshDropboxToken](#refreshdropboxtoken)
  - [exchangeNotionCodeForTokens](#exchangenotioncodefortokens)
  - [refreshNotionToken](#refreshnotiontoken)

## OAuth Classes

### GoogleDriveOAuth

The main class for handling Google Drive OAuth authentication flows.

#### GoogleDriveOAuth.startOAuth

Creates an OAuth popup window for Google Drive authentication.

```typescript
static startOAuth(config: GoogleDriveOAuthConfig): Window | null
```

**Parameters:**

- `config`: A `GoogleDriveOAuthConfig` object containing:
  - `clientId`: Your Google OAuth client ID
  - `clientSecret`: Your Google OAuth client secret
  - `apiKey`: Your Google API key for the Picker API
  - `redirectUri`: The URI to redirect to after authentication
  - `scopes` (optional): Array of OAuth scopes (defaults to `['https://www.googleapis.com/auth/drive.file']`)
  - `onSuccess`: Callback function for successful authentication
  - `onError`: Callback function for authentication errors

**Returns:**

- `Window | null`: The popup window instance or null if creation failed

**Example:**

```typescript
import { GoogleDriveOAuth } from '@vectorize-io/vectorize-connect';

const popup = GoogleDriveOAuth.startOAuth({
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  apiKey: process.env.GOOGLE_API_KEY!,
  redirectUri: `${window.location.origin}/api/gdrive-callback`,
  onSuccess: (response) => {
    console.log('Authentication successful:', response);
  },
  onError: (error) => {
    console.error('Authentication failed:', error);
  }
});
```

#### GoogleDriveOAuth.createCallbackResponse

Creates a response for the OAuth callback page with Google Drive file picker.

```typescript
static async createCallbackResponse(
  code: string,
  config: GoogleDriveOAuthConfig,
  error?: string | OAuthError
): Promise<Response>
```

**Parameters:**

- `code`: Authorization code from the OAuth redirect
- `config`: A `GoogleDriveOAuthConfig` object
- `error` (optional): Error from the OAuth process

**Returns:**

- `Promise<Response>`: A Response object with the callback page HTML

#### GoogleDriveOAuth.redirectToVectorizeConnect

Redirects the user to the Vectorize Google Drive connector authentication flow.

```typescript
static async redirectToVectorizeConnect(
  oneTimeToken: string,
  organizationId: string,
  platformUrl?: string
): Promise<void>
```

**Parameters:**

- `oneTimeToken`: The security token for authentication
- `organizationId`: Organization ID for the connection
- `platformUrl` (optional): URL of the Vectorize platform (defaults to 'https://platform.vectorize.io')

#### GoogleDriveOAuth.redirectToVectorizeEdit

Redirects the user to the Vectorize Google Drive connector edit flow.

```typescript
static async redirectToVectorizeEdit(
  oneTimeToken: string,
  organizationId: string,
  platformUrl?: string
): Promise<void>
```

**Parameters:**

- `oneTimeToken`: The security token for authentication
- `organizationId`: Organization ID for the connection
- `platformUrl` (optional): URL of the Vectorize platform (defaults to 'https://platform.vectorize.io')

### DropboxOAuth

The main class for handling Dropbox OAuth authentication flows.

#### DropboxOAuth.startOAuth

Creates an OAuth popup window for Dropbox authentication.

```typescript
static startOAuth(config: DropboxOAuthConfig): Window | null
```

**Parameters:**

- `config`: A `DropboxOAuthConfig` object containing:
  - `appKey`: Your Dropbox App key
  - `appSecret`: Your Dropbox App secret
  - `redirectUri`: The URI to redirect to after authentication
  - `scopes` (optional): Array of OAuth scopes (defaults to `["files.metadata.read", "files.content.read"]`)
  - `onSuccess`: Callback function for successful authentication
  - `onError`: Callback function for authentication errors

**Returns:**

- `Window | null`: The popup window instance or null if creation failed

**Example:**

```typescript
import { DropboxOAuth } from '@vectorize-io/vectorize-connect';

const popup = DropboxOAuth.startOAuth({
  appKey: process.env.DROPBOX_APP_KEY!,
  appSecret: process.env.DROPBOX_APP_SECRET!,
  redirectUri: `${window.location.origin}/api/dropbox-callback`,
  onSuccess: (response) => {
    console.log('Authentication successful:', response);
  },
  onError: (error) => {
    console.error('Authentication failed:', error);
  }
});
```

#### DropboxOAuth.createCallbackResponse

Creates a response for the OAuth callback page with Dropbox file picker.

```typescript
static async createCallbackResponse(
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

- `Promise<Response>`: A Response object with the callback page HTML

#### DropboxOAuth.redirectToVectorizeConnect

Redirects the user to the Vectorize Dropbox connector authentication flow.

```typescript
static async redirectToVectorizeConnect(
  oneTimeToken: string,
  organizationId: string,
  platformUrl?: string
): Promise<void>
```

**Parameters:**

- `oneTimeToken`: The security token for authentication
- `organizationId`: Organization ID for the connection
- `platformUrl` (optional): URL of the Vectorize platform (defaults to 'https://platform.vectorize.io')

#### DropboxOAuth.redirectToVectorizeEdit

Redirects the user to the Vectorize Dropbox connector edit flow.

```typescript
static async redirectToVectorizeEdit(
  oneTimeToken: string,
  organizationId: string,
  platformUrl?: string
): Promise<void>
```

**Parameters:**

- `oneTimeToken`: The security token for authentication
- `organizationId`: Organization ID for the connection
- `platformUrl` (optional): URL of the Vectorize platform (defaults to 'https://platform.vectorize.io')

## Selection Classes

### GoogleDriveSelection

The main class for handling Google Drive file selection functionality.

#### GoogleDriveSelection.startFileSelection

Starts Google Drive file selection in a popup window.

```typescript
static async startFileSelection(
  config: GoogleDriveOAuthConfig,
  refreshToken: string,
  selectedFiles?: Record<string, { name: string; mimeType: string }>,
  targetWindow?: Window
): Promise<Window | null>
```

**Parameters:**

- `config`: A `GoogleDriveOAuthConfig` object
- `refreshToken`: An existing refresh token to use for authentication
- `selectedFiles` (optional): Previously selected files to pre-populate the selection
- `targetWindow` (optional): Window to use instead of creating a new popup

**Returns:**

- `Promise<Window | null>`: The popup window instance or null if creation failed

**Example:**

```typescript
import { GoogleDriveSelection } from '@vectorize-io/vectorize-connect';

const popup = await GoogleDriveSelection.startFileSelection(
  {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    apiKey: process.env.GOOGLE_API_KEY!,
    redirectUri: `${window.location.origin}/api/gdrive-callback`,
    onSuccess: (selection) => {
      console.log('Files selected:', selection);
    },
    onError: (error) => {
      console.error('Selection failed:', error);
    }
  },
  storedRefreshToken
);
```

### DropboxSelection

The main class for handling Dropbox file selection functionality.

#### DropboxSelection.startFileSelection

Starts Dropbox file selection in a popup window.

```typescript
static async startFileSelection(
  config: DropboxOAuthConfig,
  refreshToken: string,
  selectedFiles?: Record<string, { name: string; mimeType: string; path?: string }>,
  targetWindow?: Window
): Promise<Window | null>
```

**Parameters:**

- `config`: A `DropboxOAuthConfig` object
- `refreshToken`: An existing refresh token to use for authentication
- `selectedFiles` (optional): Previously selected files to pre-populate the selection
- `targetWindow` (optional): Window to use instead of creating a new popup

**Returns:**

- `Promise<Window | null>`: The popup window instance or null if creation failed

**Example:**

```typescript
import { DropboxSelection } from '@vectorize-io/vectorize-connect';

const popup = await DropboxSelection.startFileSelection(
  {
    appKey: process.env.DROPBOX_APP_KEY!,
    appSecret: process.env.DROPBOX_APP_SECRET!,
    redirectUri: `${window.location.origin}/api/dropbox-callback`,
    onSuccess: (selection) => {
      console.log('Files selected:', selection);
    },
    onError: (error) => {
      console.error('Selection failed:', error);
    }
  },
  storedRefreshToken
);
```

## Connector Functions

### createVectorizeGDriveConnector

Creates a Google Drive connector using Vectorize's managed OAuth credentials.

```typescript
async function createVectorizeGDriveConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  platformUrl?: string
): Promise<string>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object containing:
  - `authorization`: Bearer token for authentication (use VECTORIZE_API_KEY env var)
  - `organizationId`: Your Vectorize organization ID (use VECTORIZE_ORGANIZATION_ID env var)
- `connectorName`: Name for the connector
- `platformUrl` (optional): URL of the Vectorize API (defaults to "https://api.vectorize.io/v1")

**Returns:**

- `Promise<string>`: The ID of the created connector

**Example:**

```typescript
const config = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
};

const connectorId = await createVectorizeGDriveConnector(
  config,
  "My Google Drive Connector"
);
```

### createWhiteLabelGDriveConnector

Creates a Google Drive connector using your own OAuth credentials.

```typescript
async function createWhiteLabelGDriveConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  clientId: string,
  clientSecret: string,
  platformUrl?: string
): Promise<string>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object
- `connectorName`: Name for the connector
- `clientId`: Your Google OAuth client ID
- `clientSecret`: Your Google OAuth client secret
- `platformUrl` (optional): URL of the Vectorize API (defaults to "https://api.vectorize.io/v1")

**Returns:**

- `Promise<string>`: The ID of the created connector

**Example:**

```typescript
const config = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
};

const connectorId = await createWhiteLabelGDriveConnector(
  config,
  "My Custom Google Drive Connector",
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!
);
```

### createVectorizeDropboxConnector

Creates a Dropbox connector using Vectorize's managed OAuth credentials.

```typescript
async function createVectorizeDropboxConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  platformUrl?: string
): Promise<string>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object
- `connectorName`: Name for the connector
- `platformUrl` (optional): URL of the Vectorize API (defaults to "https://api.vectorize.io/v1")

**Returns:**

- `Promise<string>`: The ID of the created connector

**Example:**

```typescript
const config = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
};

const connectorId = await createVectorizeDropboxConnector(
  config,
  "My Dropbox Connector"
);
```

### createWhiteLabelDropboxConnector

Creates a Dropbox connector using your own OAuth credentials.

```typescript
async function createWhiteLabelDropboxConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  appKey: string,
  appSecret: string,
  platformUrl?: string
): Promise<string>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object
- `connectorName`: Name for the connector
- `appKey`: Your Dropbox App key
- `appSecret`: Your Dropbox App secret
- `platformUrl` (optional): URL of the Vectorize API (defaults to "https://api.vectorize.io/v1")

**Returns:**

- `Promise<string>`: The ID of the created connector

**Example:**

```typescript
const config = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
};

const connectorId = await createWhiteLabelDropboxConnector(
  config,
  "My Custom Dropbox Connector",
  process.env.DROPBOX_APP_KEY!,
  process.env.DROPBOX_APP_SECRET!
);
```

### createVectorizeNotionConnector

Creates a Notion connector using Vectorize's managed OAuth credentials.

```typescript
async function createVectorizeNotionConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  platformUrl?: string
): Promise<string>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object
- `connectorName`: Name for the connector
- `platformUrl` (optional): URL of the Vectorize API (defaults to "https://api.vectorize.io/v1")

**Returns:**

- `Promise<string>`: The ID of the created connector

**Example:**

```typescript
const config = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
};

const connectorId = await createVectorizeNotionConnector(
  config,
  "My Notion Connector"
);
```

### createWhiteLabelNotionConnector

Creates a Notion connector using your own OAuth credentials.

```typescript
async function createWhiteLabelNotionConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  clientId: string,
  clientSecret: string,
  platformUrl?: string
): Promise<string>
```

**Parameters:**

- `config`: A `VectorizeAPIConfig` object
- `connectorName`: Name for the connector
- `clientId`: Your Notion OAuth client ID
- `clientSecret`: Your Notion OAuth client secret
- `platformUrl` (optional): URL of the Vectorize API (defaults to "https://api.vectorize.io/v1")

**Returns:**

- `Promise<string>`: The ID of the created connector

**Example:**

```typescript
const config = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
};

const connectorId = await createWhiteLabelNotionConnector(
  config,
  "My Custom Notion Connector",
  process.env.NOTION_CLIENT_ID!,
  process.env.NOTION_CLIENT_SECRET!
);
```

## Base API Functions

### createSourceConnector

Creates a connector source via the Vectorize API.

```typescript
async function createSourceConnector(
  config: VectorizeAPIConfig,
  connector: ConnectorConfig,
  platformUrl?: string
): Promise<string>
```

**Parameters:**

- `config`: An object containing your organization ID and authorization token
- `connector`: Connector configuration including name, type, and optional config
- `platformUrl` (optional): URL of the Vectorize API (defaults to "https://api.vectorize.io/v1")

**Returns:**

- `Promise<string>`: The connector ID that is created

### manageUser

Manages a user for a connector, allowing you to add, edit, or remove users.

```typescript
async function manageUser(
  config: VectorizeAPIConfig,
  connectorId: string,
  userId: string,
  action: UserAction,
  payload?: Record<string, any>,
  platformUrl?: string
): Promise<Response>
```

**Parameters:**

- `config`: VectorizeAPIConfig containing authorization and organizationId
- `connectorId`: ID of the connector
- `userId`: User ID to manage
- `action`: Action to perform ("add", "edit", or "remove")
- `payload` (optional): Additional payload for the request
- `platformUrl` (optional): URL of the Vectorize API (defaults to "https://api.vectorize.io/v1")

**Returns:**

- `Promise<Response>`: The API response

### getOneTimeConnectorToken

Gets a one-time authentication token for connector operations.

```typescript
async function getOneTimeConnectorToken(
  config: VectorizeAPIConfig,
  userId: string,
  connectorId: string,
  platformUrl?: string
): Promise<{ token: string; expires_at: number; ttl: number }>
```

**Parameters:**

- `config`: VectorizeAPIConfig containing authorization and organizationId
- `userId`: User ID to include in the token
- `connectorId`: Connector ID to include in the token
- `platformUrl` (optional): URL of the Vectorize API (defaults to "https://api.vectorize.io/v1")

**Returns:**

- `Promise<{ token: string; expires_at: number; ttl: number }>`: The token response

## Token Utilities

### exchangeGDriveCodeForTokens

Exchanges an authorization code for access and refresh tokens.

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
- `clientId`: Your Google OAuth client ID
- `clientSecret`: Your Google OAuth client secret
- `redirectUri`: The OAuth redirect URI

**Returns:**

- `Promise<OAuthResponse>`: An object containing the tokens

**Example:**

```typescript
import { exchangeGDriveCodeForTokens } from '@vectorize-io/vectorize-connect';

const tokens = await exchangeGDriveCodeForTokens(
  authCode,
  process.env.GOOGLE_OAUTH_CLIENT_ID!,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  redirectUri
);

console.log('Access token:', tokens.access_token);
console.log('Refresh token:', tokens.refresh_token);
```

### refreshGDriveToken

Refreshes an OAuth access token using a refresh token.

```typescript
async function refreshGDriveToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{
  access_token: string;
  expires_in: number;
  token_type: string;
}>
```

**Parameters:**

- `refreshToken`: The refresh token to use
- `clientId`: Your Google OAuth client ID
- `clientSecret`: Your Google OAuth client secret

**Returns:**

- `Promise<{ access_token: string; expires_in: number; token_type: string }>`: An object containing the new access token and metadata

**Example:**

```typescript
import { refreshGDriveToken } from '@vectorize-io/vectorize-connect';

const tokens = await refreshGDriveToken(
  storedRefreshToken,
  process.env.GOOGLE_OAUTH_CLIENT_ID!,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET!
);

console.log('New access token:', tokens.access_token);
console.log('Expires in:', tokens.expires_in, 'seconds');
```

### exchangeDropboxCodeForTokens

Exchanges an authorization code for access and refresh tokens.

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
- `appKey`: Your Dropbox App key
- `appSecret`: Your Dropbox App secret
- `redirectUri`: The OAuth redirect URI

**Returns:**

- `Promise<OAuthResponse>`: An object containing the tokens

**Example:**

```typescript
import { exchangeDropboxCodeForTokens } from '@vectorize-io/vectorize-connect';

const tokens = await exchangeDropboxCodeForTokens(
  authCode,
  process.env.DROPBOX_APP_KEY!,
  process.env.DROPBOX_APP_SECRET!,
  redirectUri
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

- `refreshToken`: The refresh token to use
- `appKey`: Your Dropbox App key
- `appSecret`: Your Dropbox App secret

**Returns:**

- `Promise<{ access_token: string; expires_in: number; token_type: string }>`: An object containing the new access token and metadata

**Example:**

```typescript
import { refreshDropboxToken } from '@vectorize-io/vectorize-connect';

const tokens = await refreshDropboxToken(
  storedRefreshToken,
  process.env.DROPBOX_APP_KEY!,
  process.env.DROPBOX_APP_SECRET!
);

console.log('New access token:', tokens.access_token);
console.log('Expires in:', tokens.expires_in, 'seconds');
```

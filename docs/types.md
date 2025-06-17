# TypeScript Definitions

This document provides detailed information about the TypeScript types and interfaces exported by the `@vectorize-io/vectorize-connect` package.

## Table of Contents

- [Error Classes](#error-classes)
  - [OAuthError](#oautherror)
  - [ConfigurationError](#configurationerror)
  - [TokenError](#tokenerror)
  - [PickerError](#pickererror)
- [Interfaces](#interfaces)
  - [OAuthConfig](#oauthconfig)
  - [DropboxOAuthConfig](#dropboxoauthconfig)
  - [OAuthResponse](#oauthresponse)
  - [DriveFile](#drivefile)
  - [DriveSelection](#driveselection)
  - [DropboxFile](#dropboxfile)
  - [DropboxSelection](#dropboxselection)
  - [VectorizeAPIConfig](#vectorizeapiconfig)

## Error Classes

### OAuthError

Base error class for OAuth related errors.

```typescript
class OAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}
```

**Properties:**

- `message`: Error message
- `code`: Error code
- `details`: Optional additional error details

**Example:**

```typescript
try {
  // OAuth operation
} catch (error) {
  if (error instanceof OAuthError) {
    console.error(`OAuth Error (${error.code}): ${error.message}`);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}
```

### ConfigurationError

Error thrown when there's a problem with configuration.

```typescript
class ConfigurationError extends OAuthError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}
```

**Example:**

```typescript
try {
  // Configuration operation
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error(`Configuration Error: ${error.message}`);
  }
}
```

### TokenError

Error thrown during token exchange or refresh.

```typescript
class TokenError extends OAuthError {
  constructor(message: string, details?: any) {
    super(message, 'TOKEN_ERROR', details);
    this.name = 'TokenError';
  }
}
```

**Example:**

```typescript
try {
  const tokens = await refreshGDriveAccessToken(clientId, clientSecret, refreshToken);
} catch (error) {
  if (error instanceof TokenError) {
    console.error(`Token Error: ${error.message}`);
  }
}
```

### PickerError

Error thrown from the Google Drive picker.

```typescript
class PickerError extends OAuthError {
  constructor(message: string, details?: any) {
    super(message, 'PICKER_ERROR', details);
    this.name = 'PickerError';
  }
}
```

**Example:**

```typescript
try {
  // Picker operation
} catch (error) {
  if (error instanceof PickerError) {
    console.error(`Picker Error: ${error.message}`);
  }
}
```

## Interfaces

### OAuthConfig

Configuration options for Google Drive OAuth authentication.

```typescript
interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  redirectUri: string;
  scopes?: string[];
  onSuccess?: (selectedFields?: any) => void;
  onError?: (error: OAuthError) => void;
}
```

**Properties:**

- `clientId`: Your Google OAuth client ID
- `clientSecret`: Your Google OAuth client secret
- `apiKey`: Your Google API key
- `redirectUri`: The URI to redirect to after authentication
- `scopes` (optional): Array of OAuth scopes (defaults to drive.file)
- `onSuccess` (optional): Callback function when authentication succeeds
- `onError` (optional): Callback function when authentication fails

**Example:**

```typescript
const config: OAuthConfig = {
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  apiKey: process.env.GOOGLE_API_KEY!,
  redirectUri: `${window.location.origin}/api/google-callback`,
  scopes: [
    'https://www.googleapis.com/auth/drive.file'
  ],
  onSuccess: (selection) => {
    console.log('Selected files:', selection.selectedFiles);
  },
  onError: (error) => {
    console.error('OAuth error:', error.message);
  }
};
```

### DropboxOAuthConfig

Configuration options for Dropbox OAuth authentication.

```typescript
interface DropboxOAuthConfig {
  appKey: string;
  appSecret: string;
  redirectUri: string;
  scopes?: string[];
  onSuccess?: (selectedFields?: any) => void;
  onError?: (error: OAuthError) => void;
}
```

**Properties:**

- `appKey`: Your Dropbox App key
- `appSecret`: Your Dropbox App secret
- `redirectUri`: The URI to redirect to after authentication
- `scopes` (optional): Array of OAuth scopes (defaults to ["files.metadata.read", "files.content.read"])
- `onSuccess` (optional): Callback function when authentication succeeds
- `onError` (optional): Callback function when authentication fails

**Example:**

```typescript
const config: DropboxOAuthConfig = {
  appKey: process.env.DROPBOX_APP_KEY!,
  appSecret: process.env.DROPBOX_APP_SECRET!,
  redirectUri: `${window.location.origin}/api/dropbox-callback`,
  scopes: [
    'files.metadata.read',
    'files.content.read'
  ],
  onSuccess: (selection) => {
    console.log('Selected files:', selection.selectedFiles);
    console.log('Refresh token:', selection.refreshToken);
  },
  onError: (error) => {
    console.error('OAuth error:', error.message);
  }
};
```

### OAuthResponse

Response from OAuth token exchange.

```typescript
interface OAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}
```

**Properties:**

- `access_token`: The OAuth access token
- `refresh_token`: The OAuth refresh token
- `expires_in`: The number of seconds until the access token expires
- `token_type`: The type of token (usually "Bearer")

**Example:**

```typescript
const handleTokenResponse = (tokens: OAuthResponse) => {
  console.log('Access token:', tokens.access_token);
  console.log('Refresh token:', tokens.refresh_token);
  console.log('Expires in:', tokens.expires_in, 'seconds');
  console.log('Token type:', tokens.token_type);
  
  // Store the refresh token for later use
  localStorage.setItem('refreshToken', tokens.refresh_token);
};
```

### DriveFile

Represents a file in Google Drive.

```typescript
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}
```

**Properties:**

- `id`: The unique ID of the file in Google Drive
- `name`: The name of the file
- `mimeType`: The MIME type of the file

**Example:**

```typescript
const displayFile = (file: DriveFile) => {
  console.log(`File: ${file.name} (${file.mimeType})`);
  console.log(`ID: ${file.id}`);
};
```

### DriveSelection

Selection result from the Google Drive picker.

```typescript
interface DriveSelection {
  files: DriveFile[];
}
```

**Properties:**

- `files`: Array of selected files

**Example:**

```typescript
const handleSelection = (selection: DriveSelection) => {
  console.log(`Selected ${selection.files.length} files:`);
  selection.files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name} (${file.mimeType})`);
  });
};
```

### DropboxFile

Represents a file in Dropbox.

```typescript
interface DropboxFile {
  id: string;
  name: string;
  mimeType: string;
  path: string;
}
```

**Properties:**

- `id`: The unique ID of the file in Dropbox
- `name`: The name of the file
- `mimeType`: The MIME type of the file
- `path`: The path to the file in Dropbox

**Example:**

```typescript
const displayFile = (file: DropboxFile) => {
  console.log(`File: ${file.name} (${file.mimeType})`);
  console.log(`Path: ${file.path}`);
  console.log(`ID: ${file.id}`);
};
```

### DropboxSelection

Selection result from the Dropbox picker.

```typescript
interface DropboxSelection {
  selectedFiles: Record<string, { name: string; mimeType: string; path: string }>;
  refreshToken: string;
}
```

**Properties:**

- `selectedFiles`: Record of selected files with their metadata
- `refreshToken`: The OAuth refresh token for accessing the files

**Example:**

```typescript
const handleSelection = (selection: DropboxSelection) => {
  console.log('Refresh token:', selection.refreshToken);
  console.log('Selected files:');
  
  Object.entries(selection.selectedFiles).forEach(([id, file], index) => {
    console.log(`${index + 1}. ${file.name} (${file.mimeType})`);
    console.log(`   Path: ${file.path}`);
  });
};
```

### VectorizeAPIConfig

Configuration for Vectorize API requests.

```typescript
type VectorizeAPIConfig = {
  /** Bearer token (authorization) - use VECTORIZE_TOKEN environment variable */
  authorization: string;
  
  /** Organization ID - use VECTORIZE_ORG environment variable */
  organizationId: string;
};
```

**Properties:**

- `authorization`: Bearer token for authorization
- `organizationId`: Vectorize organization ID

**Example:**

```typescript
const config: VectorizeAPIConfig = {
  authorization: process.env.VECTORIZE_TOKEN!,
  organizationId: process.env.VECTORIZE_ORG!
};

// Use the config with API functions
const connectorId = await createVectorizeGDriveConnector(
  config,
  "My Google Drive Connector"
);
```

## Type Usage in Functions

Here are examples of how these types are used in the package's functions:

### OAuth Functions

```typescript
// Start Google Drive OAuth flow
const popup = startGDriveOAuth(config: OAuthConfig): Window | null;

// Create Google Drive callback response
const response = await createGDrivePickerCallbackResponse(
  code: string,
  config: OAuthConfig,
  error?: string | OAuthError
): Promise<Response>;

// Start Dropbox OAuth flow
const popup = startDropboxOAuth(config: DropboxOAuthConfig): Window | null;

// Create Dropbox callback response
const response = await createDropboxPickerCallbackResponse(
  code: string,
  config: DropboxOAuthConfig,
  error?: string | OAuthError
): Promise<Response>;
```

### Token Functions

```typescript
// Exchange code for Google Drive tokens
const tokens: OAuthResponse = await exchangeGDriveCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
);

// Refresh Google Drive access token
const tokens: OAuthResponse = await refreshGDriveAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
);

// Exchange code for Dropbox tokens
const tokens: OAuthResponse = await exchangeDropboxCodeForTokens(
  code: string,
  appKey: string,
  appSecret: string,
  redirectUri: string
);

// Refresh Dropbox access token
const tokens = await refreshDropboxToken(
  refreshToken: string,
  appKey: string,
  appSecret: string
);
```

### API Functions

```typescript
// Create Google Drive connector (Vectorize-managed)
const connectorId = await createVectorizeGDriveConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  platformUrl?: string,
  clientId?: string,
  clientSecret?: string
);

// Manage Google Drive user
const response = await manageGDriveUser(
  config: VectorizeAPIConfig,
  connectorId: string,
  selectedFiles: Record<string, { name: string; mimeType: string }> | null,
  refreshToken: string,
  userId: string,
  action: "add" | "edit" | "remove",
  platformUrl?: string // Primarily used for testing
);

// Create Dropbox connector
const connectorId = await createVectorizeDropboxConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  platformUrl?: string
);

// Create white-label Dropbox connector
const connectorId = await createWhiteLabelDropboxConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  appKey: string,
  appSecret: string,
  platformUrl?: string
);

// Manage Dropbox user
const response = await manageDropboxUser(
  config: VectorizeAPIConfig,
  connectorId: string,
  selectedFiles: Record<string, { name: string; mimeType: string; path: string }> | null,
  refreshToken: string,
  userId: string,
  action: "add" | "edit" | "remove",
  platformUrl?: string // Primarily used for testing
);
```

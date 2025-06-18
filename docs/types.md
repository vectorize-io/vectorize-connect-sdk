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
  - [GoogleDriveOAuthConfig](#googledriveoauthconfig)
  - [DropboxOAuthConfig](#dropboxoauthconfig)
  - [OAuthResponse](#oauthresponse)
  - [GenericFile](#genericfile)
  - [GenericSelection](#genericselection)
  - [DriveFile](#drivefile)
  - [DriveSelection](#driveselection)
  - [DropboxFile](#dropboxfile)
  - [DropboxFileSelection](#dropboxfileselection)
  - [VectorizeAPIConfig](#vectorizeapiconfig)
  - [ConnectorConfig](#connectorconfig)
- [Enums](#enums)
  - [GoogleDriveConnectorType](#googledriveconnectortype)
  - [DropboxConnectorType](#dropboxconnectortype)

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

## Interfaces

### OAuthConfig

Base configuration interface for OAuth authentication.

```typescript
interface OAuthConfig {
  redirectUri: string;
  scopes?: string[];
  onSuccess?: (response: OAuthResponse) => void;
  onError?: (error: OAuthError) => void;
}
```

**Properties:**

- `redirectUri`: The URI to redirect to after authentication
- `scopes` (optional): Array of OAuth scopes to request
- `onSuccess` (optional): Callback function called when authentication succeeds
- `onError` (optional): Callback function called when authentication fails

### GoogleDriveOAuthConfig

Configuration options for Google Drive OAuth authentication.

```typescript
interface GoogleDriveOAuthConfig extends OAuthConfig {
  clientId: string;      // Google OAuth client ID
  clientSecret: string;  // Google OAuth client secret
  apiKey: string;        // Google API key for the Picker API
}
```

**Properties:**

- `clientId`: Your Google OAuth client ID
- `clientSecret`: Your Google OAuth client secret
- `apiKey`: Your Google API key for the Picker API
- Inherits all properties from `OAuthConfig`

**Example:**

```typescript
const config: GoogleDriveOAuthConfig = {
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  apiKey: process.env.GOOGLE_API_KEY!,
  redirectUri: `${window.location.origin}/api/gdrive-callback`,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  onSuccess: (response) => {
    console.log('Google Drive authentication successful:', response);
  },
  onError: (error) => {
    console.error('Google Drive authentication failed:', error);
  }
};
```

### DropboxOAuthConfig

Configuration options for Dropbox OAuth authentication.

```typescript
interface DropboxOAuthConfig extends OAuthConfig {
  appKey: string;      // Dropbox API app key
  appSecret: string;   // Dropbox API app secret
}
```

**Properties:**

- `appKey`: Your Dropbox App key
- `appSecret`: Your Dropbox App secret
- Inherits all properties from `OAuthConfig`

**Example:**

```typescript
const config: DropboxOAuthConfig = {
  appKey: process.env.DROPBOX_APP_KEY!,
  appSecret: process.env.DROPBOX_APP_SECRET!,
  redirectUri: `${window.location.origin}/api/dropbox-callback`,
  onSuccess: (response) => {
    console.log('Dropbox authentication successful:', response);
  },
  onError: (error) => {
    console.error('Dropbox authentication failed:', error);
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

### GenericFile

Base interface for file representations.

```typescript
interface GenericFile {
  id: string;
  name: string;
  mimeType: string;
}
```

### GenericSelection

Base interface for file selection results.

```typescript
interface GenericSelection {
  files: GenericFile[];
}
```

### DriveFile

Represents a file in Google Drive.

```typescript
interface DriveFile extends GenericFile {
  // Add Google Drive specific properties if needed
}
```

### DriveSelection

Selection result from the Google Drive picker.

```typescript
interface DriveSelection extends GenericSelection {
  files: DriveFile[];
}
```

**Properties:**

- `files`: Array of selected Google Drive files
- Inherits all properties from `GenericSelection`

**Example:**

```typescript
const handleSelection = (selection: DriveSelection) => {
  console.log('Selected files:');
  
  selection.files.forEach((file) => {
    console.log(`- ${file.name} (${file.mimeType})`);
  });
};
```

### DropboxFile

Represents a file in Dropbox.

```typescript
interface DropboxFile extends GenericFile {
  // Add Dropbox specific properties if needed
  path?: string;
}
```

**Properties:**

- `path` (optional): Full path to the file in Dropbox
- Inherits all properties from `GenericFile`

### DropboxFileSelection

Selection result from the Dropbox picker.

```typescript
interface DropboxFileSelection extends GenericSelection {
  files: DropboxFile[];
}
```

**Properties:**

- `files`: Array of selected Dropbox files
- Inherits all properties from `GenericSelection`

**Example:**

```typescript
const handleSelection = (selection: DropboxFileSelection) => {
  console.log('Selected files:');
  
  selection.files.forEach((file) => {
    console.log(`- ${file.name} at ${file.path || 'unknown path'} (${file.mimeType})`);
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

### ConnectorConfig

Configuration for creating connectors.

```typescript
interface ConnectorConfig {
  name: string;
  type: string;
  config?: Record<string, any>;
}
```

## Enums

### GoogleDriveConnectorType

Enum for Google Drive connector types.

```typescript
enum GoogleDriveConnectorType {
  VECTORIZE = "GOOGLE_DRIVE_OAUTH_MULTI",
  WHITE_LABEL = "GOOGLE_DRIVE_OAUTH_MULTI_CUSTOM"
}
```

### DropboxConnectorType

Enum for Dropbox connector types.

```typescript
enum DropboxConnectorType {
  VECTORIZE = "DROPBOX_OAUTH_MULTI",
  WHITE_LABEL = "DROPBOX_OAUTH_MULTI_CUSTOM"
}
```

## API Functions

### Connector Functions

```typescript
// Create Google Drive connector (Vectorize-managed)
const connectorId = await createVectorizeGDriveConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  platformUrl?: string
): Promise<string>;

// Create Google Drive connector (White-Label)
const connectorId = await createWhiteLabelGDriveConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  clientId: string,
  clientSecret: string,
  platformUrl?: string
): Promise<string>;

// Create Dropbox connector (Vectorize-managed)
const connectorId = await createVectorizeDropboxConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  platformUrl?: string
): Promise<string>;

// Create Dropbox connector (White-Label)
const connectorId = await createWhiteLabelDropboxConnector(
  config: VectorizeAPIConfig,
  connectorName: string,
  appKey: string,
  appSecret: string,
  platformUrl?: string
): Promise<string>;
```

### OAuth Classes

```typescript
// Google Drive OAuth class
GoogleDriveOAuth.startOAuth(config: GoogleDriveOAuthConfig): Window | null;
GoogleDriveOAuth.createCallbackResponse(code: string, config: GoogleDriveOAuthConfig, error?: string | OAuthError): Promise<Response>;
GoogleDriveOAuth.redirectToVectorizeConnect(oneTimeToken: string, organizationId: string, platformUrl?: string): Promise<void>;
GoogleDriveOAuth.redirectToVectorizeEdit(oneTimeToken: string, organizationId: string, platformUrl?: string): Promise<void>;

// Dropbox OAuth class
DropboxOAuth.startOAuth(config: DropboxOAuthConfig): Window | null;
DropboxOAuth.createCallbackResponse(code: string, config: DropboxOAuthConfig, error?: string | OAuthError): Promise<Response>;
DropboxOAuth.redirectToVectorizeConnect(oneTimeToken: string, organizationId: string, platformUrl?: string): Promise<void>;
DropboxOAuth.redirectToVectorizeEdit(oneTimeToken: string, organizationId: string, platformUrl?: string): Promise<void>;
```

### Selection Classes

```typescript
// Google Drive file selection
GoogleDriveSelection.startFileSelection(
  config: GoogleDriveOAuthConfig,
  refreshToken: string,
  selectedFiles?: Record<string, { name: string; mimeType: string }>,
  targetWindow?: Window
): Promise<Window | null>;

// Dropbox file selection
DropboxSelection.startFileSelection(
  config: DropboxOAuthConfig,
  refreshToken: string,
  selectedFiles?: Record<string, { name: string; mimeType: string; path?: string }>,
  targetWindow?: Window
): Promise<Window | null>;
```

### Token Functions

```typescript
// Exchange Google Drive authorization code for tokens
const tokens = await exchangeGDriveCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<OAuthResponse>;

// Refresh Google Drive access token
const tokens = await refreshGDriveToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number; token_type: string }>;

// Exchange Dropbox authorization code for tokens
const tokens = await exchangeDropboxCodeForTokens(
  code: string,
  appKey: string,
  appSecret: string,
  redirectUri: string
): Promise<OAuthResponse>;

// Refresh Dropbox access token
const tokens = await refreshDropboxToken(
  refreshToken: string,
  appKey: string,
  appSecret: string
): Promise<{ access_token: string; expires_in: number; token_type: string }>;
```

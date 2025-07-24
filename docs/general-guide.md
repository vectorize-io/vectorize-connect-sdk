# Vectorize Connect SDK - General Guide

## Overview

The Vectorize Connect SDK enables you to build multi-user connectors that integrate cloud storage platforms with the Vectorize platform. This SDK allows multiple users to connect their accounts and select files to be processed by Vectorize's RAG pipelines.

## Installation

```bash
npm install @vectorize-io/vectorize-connect
```

## Authentication

All interactions with the Vectorize API require authentication using your API credentials:

```typescript
const config: VectorizeAPIConfig = {
  authorization: process.env.VECTORIZE_API_KEY, // Your API key (without "Bearer" prefix)
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID // Your organization ID
};
```

**Important**: The SDK handles adding the "Bearer" prefix internally, so provide only your API key.

## Connector Types

The SDK supports two approaches for implementing multi-user connectors:

### 1. Vectorize-Managed OAuth (Recommended for Getting Started)
- Uses Vectorize's pre-configured OAuth applications
- No need to set up your own OAuth credentials
- Quickest way to get started
- Available on Starter plan and above

### 2. White-Label OAuth (For Production Apps)
- Use your own OAuth applications
- Full control over branding and authentication flow
- Required for production applications with custom branding
- Available on Pro plan and above

## Common Configuration

### VectorizeAPIConfig

All SDK functions require a `VectorizeAPIConfig` object:

```typescript
interface VectorizeAPIConfig {
  authorization: string;  // Your Vectorize API key
  organizationId: string; // Your Vectorize organization ID
}
```

Get these values from your Vectorize dashboard under Settings > Access Tokens.

## Error Handling

All SDK functions return Promises that may reject with errors. Always implement proper error handling:

```typescript
try {
  // SDK function call
} catch (error) {
  console.error('Operation failed:', error);
  // Handle the error appropriately
}
```

## Basic Usage Flow

### For Vectorize-Managed OAuth (Simple Approach)

With Vectorize-managed OAuth, the authentication flow is handled through the Vectorize platform:

```typescript
import { 
  // Import the create function for your platform
  // e.g., createVectorizeGDriveConnector, createVectorizeDropboxConnector, etc.
  createVectorize[Platform]Connector,
  getOneTimeConnectorToken
} from '@vectorize-io/vectorize-connect';

// 1. Create a connector
const connectorId = await createVectorize[Platform]Connector(
  config,
  'Team Knowledge Base'
);

// 2. Generate a one-time token for secure authentication
const tokenData = await getOneTimeConnectorToken(
  config,
  'user123',
  connectorId
);

// 3. Redirect user to Vectorize's OAuth flow
// The user will be redirected to the appropriate platform authentication page

// 4. After user completes OAuth and file selection on Vectorize platform,
// they return to your application
```

### For White-Label OAuth (Advanced)

For white-label implementations, you handle the OAuth flow yourself:

```typescript
import { 
  // Import the create function and OAuth classes for your platform
  createWhiteLabel[Platform]Connector,
  [Platform]OAuth,
  [Platform]Selection
} from '@vectorize-io/vectorize-connect';

// 1. Create a white-label connector with your own OAuth credentials
const connectorId = await createWhiteLabel[Platform]Connector(
  config,
  'My Custom Connector',
  process.env.PLATFORM_CLIENT_ID!,
  process.env.PLATFORM_CLIENT_SECRET!
);

// 2. Use OAuth classes to handle authentication
// See the OAuth Classes section in the API documentation for platform-specific details
```

## Next Steps

For specific platform integrations, refer to the step-based documentation structure:

### Step-by-Step Implementation Guides

#### Vectorize Approach (Managed OAuth)
- [Environment Setup](./environment-setup/vectorize/README.md)
- [Creating Connectors](./creating-connectors/vectorize/README.md)
- [Authentication](./authentication/vectorize/README.md)
- [User Management](./user-management/vectorize/README.md)
- [Frontend Implementation](./frontend-implementation/vectorize/README.md)
- [Testing](./testing/vectorize/README.md)

#### White-Label Approach (Custom OAuth)
- [Environment Setup](./environment-setup/white-label/README.md)
- [Creating Connectors](./creating-connectors/white-label/README.md)
- [Authentication](./authentication/white-label/README.md)
- [User Management](./user-management/white-label/README.md)
- [Frontend Implementation](./frontend-implementation/white-label/README.md)
- [Testing](./testing/white-label/README.md)


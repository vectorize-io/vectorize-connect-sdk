# Dropbox Integration Guide

This guide details how to integrate Dropbox with your application using the Vectorize Connect SDK. The integration provides authenticated access to Dropbox files for your users.

## Overview

The Vectorize Connect SDK offers two types of Dropbox integrations:

1. **White-Label Integration**: You create and manage your own Dropbox App and credentials
2. **Non-White-Label Integration**: Vectorize manages the Dropbox App for you

## Prerequisites

Before you begin, you'll need:

- A Vectorize account with API access
- For White-Label integration: A Dropbox App with API credentials (App Key and App Secret)

## Installation

Install the SDK using your preferred package manager:

```bash
# npm
npm install @vectorize-io/vectorize-connect

# yarn
yarn add @vectorize-io/vectorize-connect

# pnpm
pnpm add @vectorize-io/vectorize-connect
```

## White-Label Integration

A white-label integration uses your own Dropbox App credentials for authentication.

### 1. Create a Dropbox Connector

First, create a Dropbox connector using the Vectorize API:

```typescript
import { createWhiteLabelDropboxConnector } from '@vectorize-io/vectorize-connect';

// Create a Dropbox connector
const connectorId = await createWhiteLabelDropboxConnector(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  "My White-Label Dropbox Connector",
  process.env.DROPBOX_APP_KEY!,
  process.env.DROPBOX_APP_SECRET!
);

console.log(`Created connector with ID: ${connectorId}`);
```

### 2. Implement OAuth Authentication

Next, implement OAuth authentication to allow users to connect their Dropbox accounts:

```typescript
import { DropboxOAuth, DropboxOAuthConfig } from '@vectorize-io/vectorize-connect';

// Configure Dropbox OAuth
const config: DropboxOAuthConfig = {
  appKey: process.env.DROPBOX_APP_KEY!,
  appSecret: process.env.DROPBOX_APP_SECRET!,
  redirectUri: `${window.location.origin}/api/dropbox-callback`,
  scopes: ['files.metadata.read', 'files.content.read'],
  onSuccess: (selection) => {
    console.log('Selected files:', selection.selectedFiles);
    console.log('Refresh token:', selection.refreshToken);
    // Store the selection data for managing the user
  },
  onError: (error) => {
    console.error('OAuth error:', error.message);
  }
};

// Start the OAuth flow in a popup
const popup = DropboxOAuth.startOAuth(config);
```

### 3. Implement OAuth Callback

Create a callback page to handle the OAuth redirect:

```typescript
// In a Next.js API route (app/api/dropbox-callback/route.ts)
import { DropboxOAuth } from '@vectorize-io/vectorize-connect';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const config = {
    appKey: process.env.DROPBOX_APP_KEY!,
    appSecret: process.env.DROPBOX_APP_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/dropbox-callback`
  };

  return DropboxOAuth.createCallbackResponse(
    code || '',
    config,
    error || undefined
  );
}
```

### 4. Manage Users

Once a user has authenticated, you can add them to your connector:

```typescript
import { manageDropboxUser } from '@vectorize-io/vectorize-connect';

// Add a user with selected files
const addResponse = await manageDropboxUser(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  connectorId,
  {
    'file-id-1': { name: 'Document 1', mimeType: 'application/pdf', path: '/path/to/document.pdf' },
    'file-id-2': { name: 'Spreadsheet 1', mimeType: 'text/csv', path: '/path/to/data.csv' }
  },
  refreshToken,
  "user123",
  "add"
);

console.log('User added successfully');
```

You can also edit or remove users:

```typescript
// Edit a user's selected files
const editResponse = await manageDropboxUser(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  connectorId,
  {
    'file-id-3': { name: 'Document 2', mimeType: 'application/pdf', path: '/path/to/document2.pdf' }
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
  null,
  refreshToken,
  "user123",
  "remove"
);
```

## Non-White-Label Integration

A non-white-label integration uses Vectorize's Dropbox App for authentication.

### 1. Create a Dropbox Connector

First, create a Dropbox connector using the Vectorize API:

```typescript
import { createVectorizeDropboxConnector } from '@vectorize-io/vectorize-connect';

// Create a Dropbox connector
const connectorId = await createVectorizeDropboxConnector(
  {
    organizationId: process.env.VECTORIZE_ORG!,
    authorization: process.env.VECTORIZE_TOKEN!
  },
  "My Vectorize Dropbox Connector"
);

console.log(`Created connector with ID: ${connectorId}`);
```

### 2. Redirect Users to Connect

When a user needs to connect their Dropbox account, generate a one-time token and redirect them to the Vectorize platform:

```typescript
import { DropboxOAuth, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

// Get Vectorize configuration
const config = {
  organizationId: process.env.VECTORIZE_ORG!,
  authorization: process.env.VECTORIZE_TOKEN!
};

// Generate random user ID or use your own user identification system
const userId = "user123";

// Get one-time token from API
const tokenResponse = await getOneTimeConnectorToken(
  config,
  userId,
  connectorId
);

// Redirect to Vectorize for Dropbox authentication
await DropboxOAuth.redirectToVectorizeConnect(
  tokenResponse.token,
  config.organizationId
);

console.log('Dropbox connection completed');
```

### 3. Edit User's Files

To allow users to edit their file selections:

```typescript
import { DropboxOAuth, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

// Get one-time token for edit operation
const tokenResponse = await getOneTimeConnectorToken(
  config,
  userId,
  connectorId
);

// Redirect to Vectorize for editing Dropbox files
await DropboxOAuth.redirectToVectorizeEdit(
  tokenResponse.token,
  config.organizationId
);

console.log('Dropbox file selections updated');
```

## Error Handling

The SDK provides error types and details to help you handle issues:

```typescript
try {
  // Dropbox OAuth or API operations
} catch (error) {
  if (error.code === 'POPUP_BLOCKED') {
    // Handle popup blocked error
    console.error('Please enable popups for this site');
  } else if (error.code === 'CONFIGURATION_ERROR') {
    // Handle configuration error
    console.error('Check your Dropbox App credentials');
  } else {
    // Handle other errors
    console.error('Error:', error.message);
  }
}
```

## Additional Resources

- [General Integration Guide](./general-guide.md)
- [API Reference](./API.md)
- [Dropbox Developer Documentation](https://www.dropbox.com/developers/documentation)

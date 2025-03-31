# Google Drive Integration Guide

## Overview

This guide explains how to integrate Google Drive with your application using the Vectorize Connect SDK. The SDK provides two integration approaches:

1. **White-Label Integration**: Your application handles the OAuth flow and user interface
2. **Non-White-Label Integration**: Vectorize handles the OAuth flow and user interface

## Prerequisites

- A Vectorize account with API access
- A Google Cloud project with the Google Drive API enabled
- OAuth 2.0 credentials configured for your Google Cloud project

## Installation

```bash
npm install @vectorize-io/vectorize-connect
```

## Non-White-Label Integration

In this approach, Vectorize handles the OAuth flow and file selection UI. Your application redirects users to Vectorize's hosted interface.

### Step 1: Create a Google Drive Connector

```typescript
import { createGDriveSourceConnector } from '@vectorize-io/vectorize-connect';

const config = {
  authorization: 'Bearer your-token',
  organizationId: 'your-org-id'
};

const connectorId = await createGDriveSourceConnector(
  config,
  false, // non-white-label
  'My Google Drive Connector'
);
```

### Step 2: Redirect Users to Connect Google Drive

```typescript
import { redirectToVectorizeGoogleDriveConnect, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

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
    
    // Optionally, you can create an API route to handle additional user management if needed
    
    console.log('Google Drive connection completed');
  } catch (error) {
    console.error('Connection process failed:', error);
  }
};
```

The `redirectToVectorizeGoogleDriveConnect` function:
- Opens an iframe with Vectorize's Google Drive connection interface
- Uses a one-time token for secure authentication
- Handles the OAuth flow and file selection
- Automatically adds the user to the specified connector ID
- Returns a Promise that resolves when the process is complete

## White-Label Integration

In this approach, your application handles the OAuth flow and file selection UI, while Vectorize provides the backend services.

### Step 1: Create a White-Label Google Drive Connector

```typescript
import { createGDriveSourceConnector } from '@vectorize-io/vectorize-connect';

const config = {
  authorization: 'Bearer your-token',
  organizationId: 'your-org-id'
};

const connectorId = await createGDriveSourceConnector(
  config,
  true, // white-label
  'My White-Label Google Drive Connector',
  undefined, // platformUrl (optional)
  'your-google-client-id',
  'your-google-client-secret'
);
```

### Step 2: Implement OAuth Flow

```typescript
import { startGDriveOAuth } from '@vectorize-io/vectorize-connect';

const handleOAuthStart = async () => {
  try {
    const authUrl = await startGDriveOAuth({
      clientId: 'your-google-client-id',
      redirectUri: 'https://your-app.com/oauth-callback',
      scopes: [
        'https://www.googleapis.com/auth/drive.file'
      ]
    });
    
    // Redirect user to authUrl
    window.location.href = authUrl;
  } catch (error) {
    console.error('OAuth initialization failed:', error);
  }
};
```

### Step 3: Handle OAuth Callback

```typescript
import { createGDrivePickerCallbackResponse } from '@vectorize-io/vectorize-connect';

// In your callback route handler
export async function handleOAuthCallback(req, res) {
  const { code, error } = req.query;
  
  const response = await createGDrivePickerCallbackResponse(
    code,
    {
      clientId: 'your-google-client-id',
      clientSecret: 'your-google-client-secret',
      redirectUri: 'https://your-app.com/oauth-callback'
    },
    error
  );
  
  return response;
}
```

### Step 4: Implement File Selection

```typescript
import { startGDriveFileSelection } from '@vectorize-io/vectorize-connect';

const handleFileSelection = async (refreshToken) => {
  try {
    const result = await startGDriveFileSelection({
      clientId: 'your-google-client-id',
      refreshToken: refreshToken,
      scopes: [
       'https://www.googleapis.com/auth/drive.file'
      ],
      onSuccess: (selection) => {
        console.log('Selected files:', selection.selectedFiles);
        // Process selected files
      },
      onError: (error) => {
        console.error('File selection failed:', error);
      }
    });
  } catch (error) {
    console.error('File selection initialization failed:', error);
  }
};
```

### Step 5: Add User to Connector

```typescript
import { manageGDriveUser } from '@vectorize-io/vectorize-connect';

const addUserToConnector = async (refreshToken, selectedFiles) => {
  try {
    await manageGDriveUser(
      { authorization: 'Bearer your-token', organizationId: 'your-org-id' },
      'connector-id',
      {
        'file-id-1': { name: 'Document 1', mimeType: 'application/pdf' },
        'file-id-2': { name: 'Spreadsheet 1', mimeType: 'application/vnd.google-apps.spreadsheet' }
      },
      refreshToken,
      'user123',
      'add' // Action parameter is required
    );
    
    console.log('User added to connector successfully');
  } catch (error) {
    console.error('Failed to add user to connector:', error);
  }
};
```

## Error Handling

Always implement proper error handling for all SDK functions:

```typescript
try {
  // SDK function call
} catch (error) {
  console.error('Operation failed:', error);
  // Handle the error appropriately
  // Display user-friendly error message
}
```

## Next Steps

- For more details on white-label integration, see the [White-Label Guide](./white-label-guide.md)
- For more details on non-white-label integration, see the [Non-White-Label Guide](./non-white-label-guide.md)
- For API reference, see the [API Documentation](./API.md)

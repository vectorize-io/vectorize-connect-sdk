# White-Label Google Drive Integration Guide

This guide explains how to integrate Google Drive authorization and file selection into your application using your own Google OAuth credentials (White-Label approach).

## Overview

The White-Label integration allows you to:

1. Use your own Google OAuth credentials
2. Customize the user experience
3. Maintain your brand identity
4. Have full control over the OAuth flow

## Prerequisites

Before you begin, you'll need:

1. A Next.js application
2. A Vectorize account with API access
3. Google OAuth credentials:
   - Client ID
   - Client Secret
   - API Key
   - Configured redirect URI

## Step 1: Set Up Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Configure the OAuth consent screen
5. Create OAuth 2.0 credentials (Web application type)
6. Add your redirect URI (e.g., `https://your-app.com/api/oauth/callback`)
7. Create an API key for the Google Picker API

## Step 2: Configure Environment Variables

Add the following environment variables to your Next.js application:

```env
# Vectorize credentials
VECTORIZE_ORG=your-organization-id
VECTORIZE_TOKEN=your-api-key

# Google OAuth credentials
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_API_KEY=your-api-key
```

## Step 3: Create a Connector API Route

Create a file at `app/api/createGDriveConnector/route.ts`:

```typescript
// app/api/createGDriveConnector/route.ts
import { NextResponse } from "next/server";
import { createWhiteLabelGDriveConnector } from "@vectorize-io/vectorize-connect";

// Provide the structure for your config object
interface VectorizeAPIConfig {
  organizationId: string;
  authorization: string;
}

export async function POST(request: Request) {
  try {
    // Parse the incoming request
    const { connectorName, platformUrl } = await request.json();

    // Gather environment variables for your Vectorize config
    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORG ?? "",
      authorization: process.env.VECTORIZE_TOKEN ?? "",
    };

    // Validate environment variables
    if (!config.organizationId || !config.authorization) {
      return NextResponse.json(
        { error: "Missing Vectorize credentials in environment" },
        { status: 500 }
      );
    }

    // Validate Google OAuth credentials
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Missing Google OAuth credentials in environment" },
        { status: 500 }
      );
    }

    // Create the connector (White-Label)
    const connectorId = await createWhiteLabelGDriveConnector(
      config,
      connectorName,
      clientId,
      clientSecret,
      platformUrl // Optional, primarily for testing
    );

    return NextResponse.json(connectorId, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
```

## Step 4: Create an OAuth Callback API Route

Create a file at `app/api/oauth/callback/route.ts`:

```typescript
// app/api/oauth/callback/route.ts
import { NextRequest } from "next/server";
import { createGDrivePickerCallbackResponse } from "@vectorize-io/vectorize-connect";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Configure Google OAuth
    const config = {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/callback`,
      apiKey: process.env.GOOGLE_API_KEY!
    };

    // Create the callback response
    return createGDrivePickerCallbackResponse(
      code || '',
      config,
      error || undefined
    );
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return new Response(`OAuth Error: ${error.message}`, { status: 500 });
  }
}
```

## Step 5 (Optional): Create a User Management API Route

If you need to manage users programmatically, create a file at `app/api/manage-gdrive-user/route.ts`:

```typescript
// app/api/manage-gdrive-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { manageGDriveUser } from "@vectorize-io/vectorize-connect";

interface VectorizeAPIConfig {
  organizationId: string;
  authorization: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { connectorId, fileIds, refreshToken, userId, action } = body;

    // Validate required parameters
    if (!connectorId || !refreshToken || !userId || !action) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Configure Vectorize API
    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORG ?? "",
      authorization: process.env.VECTORIZE_TOKEN ?? "",
    };

    // Manage the user
    const response = await manageGDriveUser(
      config,
      connectorId,
      fileIds,
      refreshToken,
      userId,
      action
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error managing Google Drive user:', error);
    return NextResponse.json(
      { error: error.message || "Failed to manage user" },
      { status: 500 }
    );
  }
}
```

## Step 6: Implement the Frontend

Create a component to handle the Google Drive OAuth flow:

```tsx
'use client';

import { useState } from 'react';
import { GoogleDriveOAuth, GoogleDriveSelection } from '@vectorize-io/vectorize-connect';

export default function GoogleDriveConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[] | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Create a connector
  const handleCreateConnector = async () => {
    try {
      const response = await fetch("/api/createGDriveConnector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectorName: "My White-Label Google Drive Connector",
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create connector');
      }
      
      const connectorId = await response.json();
      setConnectorId(connectorId);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Start Google Drive OAuth
  const handleConnectGoogleDrive = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Configure Google OAuth
      const config = {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID!,
        clientSecret: '', // Client-side should not have the secret
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
        redirectUri: `${window.location.origin}/api/oauth/callback`,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        onSuccess: (response) => {
          console.log('Selected files:', response.fileIds);
          console.log('Refresh token:', response.refreshToken);
          
          setSelectedFiles(response.fileIds);
          setRefreshToken(response.refreshToken);
          
          // Optionally add the user to the connector
          if (connectorId) {
            addUserToConnector(connectorId, response.fileIds, response.refreshToken);
          }
        },
        onError: (error) => {
          console.error('OAuth error:', error);
          setError(error.message);
          setIsLoading(false);
        }
      };
      
      // Start the OAuth flow in a popup
      GoogleDriveOAuth.startOAuth(config);
      
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Google Drive';
      setError(errorMessage);
      setIsLoading(false);
    }
  };
  
  // Add user to connector
  const addUserToConnector = async (connectorId: string, fileIds: string[], refreshToken: string) => {
    try {
      const response = await fetch("/api/manage-gdrive-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectorId,
          fileIds,
          refreshToken,
          userId: "user123", // Replace with your user ID
          action: "add"
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add user to connector');
      }
      
      setIsLoading(false);
      console.log('User added to connector successfully');
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Select more files (if user already has a refresh token)
  const handleSelectMoreFiles = async () => {
    if (!refreshToken) {
      setError('No refresh token available. Please connect to Google Drive first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Configure Google OAuth for file selection
      const config = {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID!,
        clientSecret: '', // Client-side should not have the secret
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
        onSuccess: (response) => {
          console.log('Additional files selected:', response.fileIds);
          
          setSelectedFiles(response.fileIds);
          
          // Optionally update the user in the connector
          if (connectorId) {
            addUserToConnector(connectorId, response.fileIds, refreshToken);
          }
        },
        onError: (error) => {
          console.error('File selection error:', error);
          setError(error.message);
          setIsLoading(false);
        }
      };
      
      // Start file selection with existing refresh token
      await startGDriveFileSelection(config, refreshToken);
      
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select files';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Google Drive White-Label Connection</h2>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={handleCreateConnector}
        disabled={!!connectorId}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Create Connector
      </button>
      
      <button
        onClick={handleConnectGoogleDrive}
        disabled={!connectorId || isLoading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        {isLoading ? "Connecting..." : "Connect with Google Drive"}
      </button>
      
      {refreshToken && (
        <button
          onClick={handleSelectMoreFiles}
          disabled={isLoading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg"
        >
          Select More Files
        </button>
      )}

      {selectedFiles && (
        <div>
          <h3 className="text-sm font-medium">Selected Files:</h3>
          <pre className="mt-1 text-sm font-mono bg-gray-100 p-2 rounded">
            {JSON.stringify(selectedFiles, null, 2)}
          </pre>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium">Connector ID:</h3>
        <p className="mt-1 text-sm font-mono">
          {connectorId || "undefined"}
        </p>
      </div>
    </div>
  );
}
```

## Step 7: Test the Integration

1. Start your Next.js application
2. Create a connector by clicking the "Create Connector" button
3. Connect to Google Drive by clicking the "Connect with Google Drive" button
4. A popup will open for Google authentication
5. After authentication, the Google Picker will open for file selection
6. The selected files and refresh token will be returned to your application
7. The user will be added to the connector

## Complete Flow

1. User clicks "Connect with Google Drive"
2. A popup opens with your Google OAuth flow
3. User authenticates with Google
4. User selects files in the Google Picker
5. The popup closes and returns the selected files and refresh token
6. Your application adds the user to the connector
7. Files are processed by Vectorize

## Advantages of White-Label Integration

1. **Brand Consistency**: Users stay within your application's branding
2. **Customization**: Full control over the OAuth flow and user experience
3. **Direct Integration**: No redirection to the Vectorize platform
4. **Flexibility**: Ability to customize the file selection experience

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure that the redirect URI in your Google OAuth settings matches the one in your code
2. **Missing Scopes**: Make sure you request the necessary scopes for file access
3. **CORS Issues**: Ensure your API routes handle CORS correctly
4. **Popup Blocked**: Check if the browser is blocking popups

### Error Handling

The SDK provides detailed error classes to help diagnose issues:

- `OAuthError`: Base error class for OAuth related errors
- `ConfigurationError`: Error thrown when there's a problem with configuration
- `TokenError`: Error thrown during token exchange or refresh
- `PickerError`: Error thrown during file selection

## Next Steps

- Implement user management to allow users to update or remove their file selections
- Add error handling and retry logic
- Implement monitoring and logging
- Consider adding support for other Vectorize connectors

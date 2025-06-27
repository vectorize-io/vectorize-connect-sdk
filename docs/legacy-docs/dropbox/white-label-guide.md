# White-Label Dropbox Integration Guide

This guide explains how to integrate Dropbox authorization and file selection into your application using your own Dropbox App credentials (White-Label approach).

## Overview

The White-Label integration allows you to:

1. Use your own Dropbox App credentials
2. Customize the user experience
3. Maintain your brand identity
4. Have full control over the OAuth flow

## Prerequisites

Before you begin, you'll need:

1. A Next.js application
2. A Vectorize account with API access
3. A Dropbox App with API credentials:
   - App Key
   - App Secret
   - Configured redirect URI

## Step 1: Create a Dropbox App

1. Go to the [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
3. Choose "Scoped access" for API
4. Choose "Full Dropbox" or "App folder" access depending on your needs
5. Name your app
6. Under "OAuth 2", add your redirect URI (e.g., `https://your-app.com/api/dropbox-callback`)
7. Note your App Key and App Secret

## Step 2: Configure Environment Variables

Add the following environment variables to your Next.js application:

```env
# Vectorize credentials
VECTORIZE_ORGANIZATION_ID=your-organization-id
VECTORIZE_API_KEY=your-api-key

# Dropbox credentials
DROPBOX_APP_KEY=your-dropbox-app-key
DROPBOX_APP_SECRET=your-dropbox-app-secret
```

## Step 3: Create a Connector API Route

Create a file at `app/api/createDropboxConnector/route.ts`:

```typescript
// app/api/createDropboxConnector/route.ts
import { NextResponse } from "next/server";
import { createWhiteLabelDropboxConnector } from "@vectorize-io/vectorize-connect";

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
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID ?? "",
      authorization: process.env.VECTORIZE_API_KEY ?? "",
    };

    // Validate environment variables
    if (!config.organizationId || !config.authorization) {
      return NextResponse.json(
        { error: "Missing Vectorize credentials in environment" },
        { status: 500 }
      );
    }

    // Validate Dropbox credentials
    const appKey = process.env.DROPBOX_APP_KEY;
    const appSecret = process.env.DROPBOX_APP_SECRET;

    if (!appKey || !appSecret) {
      return NextResponse.json(
        { error: "Missing Dropbox credentials in environment" },
        { status: 500 }
      );
    }

    // Create the connector (White-Label)
    const connectorId = await createWhiteLabelDropboxConnector(
      config,
      connectorName,
      appKey,
      appSecret,
      platformUrl // Optional, primarily for testing
    );

    return NextResponse.json(connectorId, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
```

## Step 4: Create an OAuth Callback API Route

Create a file at `app/api/dropbox-callback/route.ts`:

```typescript
// app/api/dropbox-callback/route.ts
import { NextRequest } from "next/server";
import { DropboxOAuth } from "@vectorize-io/vectorize-connect";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Configure Dropbox OAuth
    const config = {
      appKey: process.env.DROPBOX_APP_KEY!,
      appSecret: process.env.DROPBOX_APP_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/dropbox-callback`
    };

    // Create the callback response
    return DropboxOAuth.createCallbackResponse(
      code || '',
      config,
      error || undefined
    );
  } catch (error: any) {
    console.error('Dropbox OAuth callback error:', error);
    return new Response(`OAuth Error: ${error.message}`, { status: 500 });
  }
}
```

## Step 5 (Optional): Create a User Management API Route

If you need to manage users programmatically, create a file at `app/api/manage-dropbox-user/route.ts`:

```typescript
// app/api/manage-dropbox-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { manageDropboxUser } from "@vectorize-io/vectorize-connect";

interface VectorizeAPIConfig {
  organizationId: string;
  authorization: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { connectorId, selectedFiles, refreshToken, userId, action } = body;

    // Validate required parameters
    if (!connectorId || !refreshToken || !userId || !action) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Configure Vectorize API
    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID ?? "",
      authorization: process.env.VECTORIZE_API_KEY ?? "",
    };

    // Manage the user
    const response = await manageDropboxUser(
      config,
      connectorId,
      selectedFiles,
      refreshToken,
      userId,
      action
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error managing Dropbox user:', error);
    return NextResponse.json(
      { error: error.message || "Failed to manage user" },
      { status: 500 }
    );
  }
}
```

## Step 6: Implement the Frontend

Create a component to handle the Dropbox OAuth flow:

```tsx
'use client';

import { useState } from 'react';
import { DropboxOAuth } from '@vectorize-io/vectorize-connect';

export default function DropboxConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, any> | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Create a connector
  const handleCreateConnector = async () => {
    try {
      const response = await fetch("/api/createDropboxConnector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectorName: "My White-Label Dropbox Connector",
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

  // Start Dropbox OAuth
  const handleConnectDropbox = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Configure Dropbox OAuth
      const config = {
        appKey: process.env.NEXT_PUBLIC_DROPBOX_APP_KEY!,
        appSecret: '', // Client-side should not have the secret
        redirectUri: `${window.location.origin}/api/dropbox-callback`,
        scopes: ['files.metadata.read', 'files.content.read'],
        onSuccess: (selection) => {
          console.log('Selected files:', selection.selectedFiles);
          console.log('Refresh token:', selection.refreshToken);
          
          setSelectedFiles(selection.selectedFiles);
          setRefreshToken(selection.refreshToken);
          
          // Optionally add the user to the connector
          if (connectorId) {
            addUserToConnector(connectorId, selection.selectedFiles, selection.refreshToken);
          }
        },
        onError: (error) => {
          console.error('OAuth error:', error);
          setError(error.message);
          setIsLoading(false);
        }
      };
      
      // Start the OAuth flow in a popup
      DropboxOAuth.startOAuth(config);
      
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Dropbox';
      setError(errorMessage);
      setIsLoading(false);
    }
  };
  
  // Add user to connector
  const addUserToConnector = async (connectorId: string, selectedFiles: Record<string, any>, refreshToken: string) => {
    try {
      const response = await fetch("/api/manage-dropbox-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectorId,
          selectedFiles,
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dropbox White-Label Connection</h2>
      
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
        onClick={handleConnectDropbox}
        disabled={!connectorId || isLoading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        {isLoading ? "Connecting..." : "Connect with Dropbox"}
      </button>

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
3. Connect to Dropbox by clicking the "Connect with Dropbox" button
4. A popup will open for Dropbox authentication
5. After authentication, the user will be able to select files
6. The selected files and refresh token will be returned to your application
7. The user will be added to the connector

## Complete Flow

1. User clicks "Connect with Dropbox"
2. A popup opens with your Dropbox OAuth flow
3. User authenticates with Dropbox
4. User selects files in the Dropbox picker
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

1. **Redirect URI Mismatch**: Ensure that the redirect URI in your Dropbox App settings matches the one in your code
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

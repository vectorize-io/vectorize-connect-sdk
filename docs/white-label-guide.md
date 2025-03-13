# White-label Integration Guide

This guide explains how to integrate Google Drive authorization and file selection into your application using your own Google OAuth credentials (white-label approach).

## Overview

The white-label integration allows you to:

1. Use your own Google OAuth credentials
2. Customize the user experience
3. Maintain your brand identity throughout the process
4. Directly receive the user's file selections and refresh token

## Prerequisites

Before you begin, you'll need:

1. A Google Cloud Platform project with OAuth 2.0 credentials
2. The following API keys and credentials:
   - Google OAuth Client ID
   - Google OAuth Client Secret
   - Google API Key
3. A Next.js application
4. A Vectorize account with API access

## Step 1: Set Up Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Create an OAuth 2.0 Client ID (Web application type)
5. Add authorized JavaScript origins (e.g., `http://localhost:3000`)
6. Add authorized redirect URIs (e.g., `http://localhost:3000/api/google-callback`)
7. Create an API Key
8. Enable the Google Drive API and Google Picker API

## Step 2: Configure Environment Variables

Add the following environment variables to your Next.js application:

```env
# Google OAuth credentials
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_API_KEY=your-api-key

# Vectorize credentials
VECTORIZE_ORG=your-organization-id
VECTORIZE_API_KEY=your-api-key
```

## Step 3: Create the OAuth Callback API Route

Create a file at `app/api/google-callback/route.ts`:

```typescript
// app/api/google-callback/route.ts
import { createGDrivePickerCallbackResponse } from '@vectorize-io/vectorize-connect';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Create config object with all required fields
  const config = {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    apiKey: process.env.GOOGLE_API_KEY!,
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/google-callback`
  };

  try {
    // Create callback response
    return createGDrivePickerCallbackResponse(
      code || '',
      config,
      error || undefined
    );
  } catch (err) {
    // Handle errors
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    return createGDrivePickerCallbackResponse(
      '',
      config,
      errorMessage
    );
  }
}
```

## Step 4: Create a Connector API Route

Create a file at `app/api/createGDriveConnector/route.ts`:

```typescript
// app/api/createGDriveConnector/route.ts
import { NextResponse } from "next/server";
import { createGDriveSourceConnector } from "@vectorize-io/vectorize-connect";

// Provide the structure for your config object
interface VectorizeAPIConfig {
  organizationId: string;
  authorization: string;
}

export async function POST(request: Request) {
  try {
    // Parse the incoming request
    const { whiteLabel, connectorName, platformUrl, clientId, clientSecret } = await request.json();

    // Gather environment variables for your Vectorize config
    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORG ?? "",
      authorization: process.env.VECTORIZE_API_KEY ?? "",
    };

    // Validate environment variables
    if (!config.organizationId || !config.authorization) {
      return NextResponse.json(
        { error: "Missing Vectorize credentials in environment" },
        { status: 500 }
      );
    }

    // Create the connector
    const connectorId = await createGDriveSourceConnector(
      config,
      true, // white-label
      connectorName,
      platformUrl,
      clientId,
      clientSecret
    );

    return NextResponse.json(connectorId, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
```

## Step 5: Create a User Management API Route

Create a file at `app/api/add-google-drive-user/[connectorId]/route.ts`:

```typescript
// app/api/add-google-drive-user/[connectorId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { manageGDriveUser } from '@vectorize-io/vectorize-connect';

interface VectorizeAPIConfig {
  organizationId: string;
  authorization: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get connector ID from URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const connectorId = segments[segments.length - 1];

    // Get Vectorize config
    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORG ?? "",
      authorization: process.env.VECTORIZE_API_KEY ?? "",
    };

    // Get request body
    const body = await request.json();
    if (!body) {
      throw new Error('Request body is required');
    }

    let selectionData = null;
    if (body.status === 'success') {
      selectionData = body.selection;
    }

    // Add the user to the connector
    const response = await manageGDriveUser(
      config,
      connectorId,
      selectionData.fileIds,
      selectionData.refreshToken,
      "user123", // Replace with actual user ID
      "add",
      process.env.VECTORIZE_API_URL || "https://api.vectorize.io/v1"
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error adding Google Drive user:', error);
    return NextResponse.json({ error: error.message || 'Failed to add user' }, { status: 500 });
  }
}
```

## Step 6: Implement the Frontend

Create a component to handle the OAuth flow:

```tsx
'use client';

import { useState } from 'react';
import { startGDriveOAuth } from '@vectorize-io/vectorize-connect';

export default function GoogleDriveConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a connector
  const handleCreateConnector = async () => {
    try {
      const response = await fetch("/api/createGDriveConnector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whiteLabel: true,
          connectorName: "My White Label GDrive Connector",
          platformUrl: `${window.location.origin}/api`,
          clientId: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
          clientSecret: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET,
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

  // Connect to Google Drive
  const handleConnectGoogleDrive = () => {
    setIsLoading(true);
    setError(null);
    
    const config = {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET!,
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
      redirectUri: `${window.location.origin}/api/google-callback`,
      onSuccess: async (selection) => {
        console.log('Google Drive connection successful:', selection);

        const { fileIds, refreshToken } = selection;

        // Send selection to backend
        const url = `/api/add-google-drive-user/${connectorId}`;
        const body = JSON.stringify({ status: 'success', selection: { fileIds, refreshToken } });

        const response = await fetch(url, {
          method: 'POST',
          body
        });

        if (!response.ok) {
          setError('Failed to add Google Drive user');
          return;
        }

        console.log('Google Drive user added successfully');
        setIsLoading(false);
      },
      onError: (error) => {
        setError(error.message);
        setIsLoading(false);
      }
    };

    const popup = startGDriveOAuth(config);
    
    if (!popup) {
      setError('Failed to open Google Drive connection popup');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">White Label Google Drive Connection</h2>
      
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
4. Select files in the Google Drive picker
5. Verify that the files are successfully added to the connector

## Complete Flow

1. User clicks "Connect with Google Drive"
2. OAuth popup opens for authentication
3. User grants permissions
4. User selects files in the Google Drive picker
5. Selection data (file IDs and refresh token) is sent to your backend
6. Your backend adds the user to the connector
7. Files are ingested into your Vectorize data pipeline

## Troubleshooting

### Common Issues

1. **Popup Blocked**: Ensure that popups are allowed for your domain
2. **Invalid Credentials**: Verify that your Google OAuth credentials are correct
3. **Redirect URI Mismatch**: Ensure that the redirect URI in your Google Cloud Console matches the one in your code
4. **API Not Enabled**: Make sure the Google Drive API and Google Picker API are enabled

### Error Handling

The SDK provides detailed error classes to help diagnose issues:

- `OAuthError`: Base error class for OAuth related errors
- `ConfigurationError`: Error thrown when there's a problem with configuration
- `TokenError`: Error thrown during token exchange or refresh
- `PickerError`: Error thrown from the Google Drive picker

## Next Steps

- Implement user management to allow users to update or remove their file selections
- Add error handling and retry logic
- Customize the picker UI to match your brand
- Implement monitoring and logging

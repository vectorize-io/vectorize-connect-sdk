# Non-white-label Integration Guide

This guide explains how to integrate Google Drive and Dropbox authorization and file selection into your application using Vectorize's platform (non-white-label approach).

## Overview

The non-white-label integration allows you to:

1. Use Vectorize's OAuth credentials (Google Drive or Dropbox)
2. Simplify the integration process
3. Leverage Vectorize's platform for user management
4. Reduce the need for custom implementation

## Prerequisites

Before you begin, you'll need:

1. A Next.js application
2. A Vectorize account with API access
3. Access to the Vectorize platform

## Step 1: Configure Environment Variables

Add the following environment variables to your Next.js application:

```env
# Vectorize credentials
VECTORIZE_ORG=your-organization-id
VECTORIZE_TOKEN=your-api-key
```

## Step 2 (Optional): Create Connector API Routes

This step is optional as users can create connectors and get their IDs directly through the Vectorize app. Only implement this if you need programmatic connector creation.

### Google Drive Connector

If needed, create a file at `app/api/createGDriveConnector/route.ts`:

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

    // Create the connector (non-white-label)
    // Note: platformUrl is primarily used for testing. The SDK sets appropriate defaults.
    const connectorId = await createGDriveSourceConnector(
      config,
      false, // non-white-label
      connectorName,
      platformUrl // Optional, primarily for testing
    );

    return NextResponse.json(connectorId, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
```

### Dropbox Connector

If needed, create a file at `app/api/createDropboxConnector/route.ts`:

```typescript
// app/api/createDropboxConnector/route.ts
import { NextResponse } from "next/server";
import { createVectorizeDropboxConnector } from "@vectorize-io/vectorize-connect";

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

    // Create the connector (non-white-label)
    // Note: platformUrl is primarily used for testing. The SDK sets appropriate defaults.
    const connectorId = await createVectorizeDropboxConnector(
      config,
      connectorName,
      platformUrl // Optional, primarily for testing
    );

    return NextResponse.json(connectorId, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
```

## Step 3: Create an API Endpoint for One-Time Connector Token

Create a file at `app/api/get-one-time-connector-token/route.ts` to handle generating the one-time token securely on the server:

```typescript
// app/api/get-one-time-connector-token/route.ts
import { getOneTimeConnectorToken, VectorizeAPIConfig } from "@vectorize-io/vectorize-connect";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get authentication details from environment variables
    const apiKey = process.env.VECTORIZE_TOKEN;
    const organizationId = process.env.VECTORIZE_ORG;
    
    if (!apiKey || !organizationId) {
      return NextResponse.json({ 
        error: 'Missing Vectorize API configuration' 
      }, { status: 500 });
    }
    
    // Configure the Vectorize API client
    const config: VectorizeAPIConfig = {
      authorization: apiKey,
      organizationId: organizationId
    };
    
    // Get userId and connectorId from request url
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const connectorId = searchParams.get('connectorId');
    
    // Validate userId and connectorId
    if (!userId || !connectorId) {
      return NextResponse.json({ 
        error: 'Missing userId or connectorId' 
      }, { status: 400 });
    }
    
    // Call Vectorize API to get the token
    // This is where we use the SDK function server-side
    const tokenResponse = await getOneTimeConnectorToken(
      config,
      userId,
      connectorId
    );
    
    // Return the token to the client
    return NextResponse.json(tokenResponse, { status: 200 });
    
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ 
      error: 'Failed to generate token', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
```

## Step 4 (Optional): Create an Additional User Management API Route

This step is completely optional as the redirectToVectorizeGoogleDriveConnect function automatically adds the user to the specified connector ID without requiring a separate API route. Only implement this if you need additional custom user management functionality.

If needed, create a file at `app/api/additional-user-management/[connectorId]/route.ts`:

```typescript
// app/api/additional-user-management/[connectorId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { manageGDriveUser } from '@vectorize-io/vectorize-connect';

interface VectorizeAPIConfig {
  organizationId: string;
  authorization: string;
}

// Helper function to build a response with CORS headers
function buildCorsResponse(body: any, status = 200, origin = 'http://localhost:3000') {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });

  return new NextResponse(JSON.stringify(body), { status, headers });
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  const originHeader = request.headers.get('origin') || '';
  const allowedOrigins = ['http://localhost:3000', 'https://platform.vectorize.io'];
  const origin = allowedOrigins.includes(originHeader) ? originHeader : 'null';
  
  return buildCorsResponse(null, 200, origin);
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
      authorization: process.env.VECTORIZE_TOKEN ?? "",
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
      selectionData.selectedFiles, // Record of selected files with metadata
      selectionData.refreshToken,
      "user123", // Replace with actual user ID
      "add",
      process.env.VECTORIZE_API_URL || "https://api.vectorize.io/v1" // Primarily used for testing
    );

    // Return success response with CORS headers
    const originHeader = request.headers.get('origin') || '';
    const allowedOrigins = ['http://localhost:3000', 'https://platform.vectorize.io'];
    const origin = allowedOrigins.includes(originHeader) ? originHeader : 'null';
    
    return buildCorsResponse({ success: true }, 200, origin);
  } catch (error: any) {
    console.error('Error adding Google Drive user:', error);
    return buildCorsResponse({ error: error.message || 'Failed to add user' }, 500);
  }
}
```

## Step 5: Implement the Frontend

### Google Drive Integration

Create a component to handle the Google Drive connection flow:

```tsx
'use client';

import { useState } from 'react';
import { redirectToVectorizeGoogleDriveConnect } from '@vectorize-io/vectorize-connect';

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
          connectorName: "My Google Drive Connector",
          platformUrl: `${window.location.origin}/api`,
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
  const handleConnectGoogleDrive = async () => {
    setIsLoading(true);
    setError(null);
    
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
      // const apiRoute = `${window.location.origin}/api/additional-user-management/${connectorId}`;
      
      setIsLoading(false);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Google Drive';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Google Drive Connection</h2>
      
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

### Dropbox Integration

Create a component to handle the Dropbox connection flow:

```tsx
'use client';

import { useState } from 'react';
import { redirectToVectorizeDropboxConnect } from '@vectorize-io/vectorize-connect';

export default function DropboxConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a connector
  const handleCreateConnector = async () => {
    try {
      const response = await fetch("/api/createDropboxConnector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectorName: "My Dropbox Connector",
          platformUrl: `${window.location.origin}/api`,
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

  // Connect to Dropbox
  const handleConnectDropbox = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get one-time token from API endpoint
      const tokenResponse = await fetch(`/api/get-one-time-connector-token?userId=user123&connectorId=${connectorId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to generate token. Status: ${response.status}`);
          }
          return response.json();
        });
      
      // Then use the token to redirect to the Dropbox connect page
      await redirectToVectorizeDropboxConnect(
        tokenResponse.token,
        'your-org-id',
        'https://platform.vectorize.io' // Optional
      );
      
      setIsLoading(false);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Dropbox';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dropbox Connection</h2>
      
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

## Step 6: Test the Integration

1. Start your Next.js application
2. Create a connector by clicking the "Create Connector" button
3. Connect to Google Drive by clicking the "Connect with Google Drive" button
4. You'll be redirected to the Vectorize platform
5. Select files in the Google Drive picker on the Vectorize platform
6. The function automatically adds the user to the specified connector ID
7. Verify that the files are successfully added to the connector

## Complete Flow

1. User clicks "Connect with Google Drive"
2. User is redirected to the Vectorize platform
3. User authenticates with Google (if not already authenticated)
4. User selects files in the Google Drive picker
5. The function automatically adds the user to the specified connector ID
6. Files are processed by Vectorize
7. Files are ingested into your Vectorize data pipeline

## Advantages of Non-white-label Integration

1. **Simplified Implementation**: No need to set up Google OAuth credentials
2. **Reduced Maintenance**: Vectorize handles the OAuth flow and token management
3. **Consistent Experience**: Users get a consistent experience across all Vectorize integrations
4. **Automatic Updates**: Benefit from updates and improvements to the Vectorize platform

## Troubleshooting

### Common Issues

1. **Environment Configuration**: Ensure that your Vectorize token and organization ID are correctly set
2. **CORS Errors**: Make sure your API routes handle CORS correctly
3. **Missing Environment Variables**: Verify that all required environment variables are set

### Error Handling

The SDK provides detailed error classes to help diagnose issues:

- `OAuthError`: Base error class for OAuth related errors
- `ConfigurationError`: Error thrown when there's a problem with configuration
- `TokenError`: Error thrown during token exchange or refresh

## Next Steps

- Implement user management to allow users to update or remove their file selections
- Add error handling and retry logic
- Implement monitoring and logging
- Consider adding support for other Vectorize connectors

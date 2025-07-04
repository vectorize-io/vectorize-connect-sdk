# Vectorize Dropbox Integration Guide

This guide explains how to integrate Dropbox authorization and file selection into your application using Vectorize's platform (Vectorize approach).

## Overview

The Vectorize integration allows you to:

1. Use Vectorize's OAuth credentials for Dropbox
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
VECTORIZE_ORGANIZATION_ID=your-organization-id
VECTORIZE_API_KEY=your-api-key
```

## Step 2 (Optional): Create Connector API Route

This step is optional as users can create connectors and get their IDs directly through the Vectorize app. Only implement this if you need programmatic connector creation.

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

    // Create the connector (Vectorize managed)
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
    const apiKey = process.env.VECTORIZE_API_KEY;
    const organizationId = process.env.VECTORIZE_ORGANIZATION_ID;
    
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

## Step 4: Implement the Frontend

Create a component to handle the Dropbox connection flow:

```tsx
'use client';

import { useState } from 'react';
import { DropboxOAuth } from '@vectorize-io/vectorize-connect';

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
      await DropboxOAuth.redirectToVectorizeConnect(
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

## Step 5: Test the Integration

1. Start your Next.js application
2. Create a connector by clicking the "Create Connector" button
3. Connect to Dropbox by clicking the "Connect with Dropbox" button
4. You'll be redirected to the Vectorize platform
5. Select files in the Dropbox picker on the Vectorize platform
6. The function automatically adds the user to the specified connector ID
7. Verify that the files are successfully added to the connector

## Complete Flow

1. User clicks "Connect with Dropbox"
2. User is redirected to the Vectorize platform
3. User authenticates with Dropbox (if not already authenticated)
4. User selects files in the Dropbox picker
5. The function automatically adds the user to the specified connector ID
6. Files are processed by Vectorize
7. Files are ingested into your Vectorize data pipeline

## Advantages of Vectorize Integration

1. **Simplified Implementation**: No need to set up Dropbox OAuth credentials
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

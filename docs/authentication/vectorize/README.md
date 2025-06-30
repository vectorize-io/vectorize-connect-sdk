# Authentication - Vectorize Approach

Authenticate users using Vectorize's managed OAuth flow.

## One-Time Token Generation

Create an API endpoint to generate one-time tokens securely on the server:

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

## Frontend Authentication Flow

```typescript
import { PlatformOAuth } from '@vectorize-io/vectorize-connect';

const handleAuthenticate = async () => {
  try {
    // Get one-time token from API endpoint
    const tokenResponse = await fetch(
      `/api/get-one-time-connector-token?userId=${userId}&connectorId=${connectorId}`
    ).then(response => {
      if (!response.ok) {
        throw new Error(`Failed to generate token. Status: ${response.status}`);
      }
      return response.json();
    });
    
    // Redirect to Vectorize authentication flow
    await PlatformOAuth.redirectToVectorizeConnect(
      tokenResponse.token,
      organizationId
    );
    
  } catch (error) {
    console.error('Authentication failed:', error);
  }
};
```

## Complete Component Example

```typescript
'use client';

import { useState } from 'react';
import { PlatformOAuth } from '@vectorize-io/vectorize-connect';

export default function VectorizeConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get one-time token from API endpoint
      const tokenResponse = await fetch(
        `/api/get-one-time-connector-token?userId=user123&connectorId=${connectorId}`
      ).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate token. Status: ${response.status}`);
        }
        return response.json();
      });
      
      // Redirect to Vectorize authentication flow
      await PlatformOAuth.redirectToVectorizeConnect(
        tokenResponse.token,
        'your-org-id'
      );
      
      setIsLoading(false);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Platform Connection</h2>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={!connectorId || isLoading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        {isLoading ? "Connecting..." : "Connect to Platform"}
      </button>
    </div>
  );
}
```

## Error Handling

```typescript
try {
  const tokenResponse = await getOneTimeConnectorToken(config, userId, connectorId);
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid Vectorize API token');
  } else if (error.response?.status === 404) {
    console.error('Connector or user not found');
  } else {
    console.error('Token generation failed:', error.message);
  }
}
```

## Platform-Specific Examples

For detailed platform-specific authentication examples:

- [Google Drive Authentication](./google-drive.md)
- [Dropbox Authentication](./dropbox.md)
- [Notion Authentication](./notion.md)

## Next Steps

- [User Management](../../user-management/vectorize/)
- [Frontend Implementation](../../frontend-implementation/vectorize/)

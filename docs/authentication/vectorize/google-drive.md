# Google Drive Authentication - Vectorize Approach

Authenticate users with Google Drive using Vectorize's managed OAuth flow.

## Environment Setup

```bash
# Required environment variables
VECTORIZE_API_KEY=your_vectorize_api_key
VECTORIZE_ORGANIZATION_ID=your_organization_id
```

## One-Time Token Generation

Create an API endpoint to generate one-time tokens for Google Drive authentication:

```typescript
// app/api/get-gdrive-token/route.ts
import { getOneTimeConnectorToken, VectorizeAPIConfig } from "@vectorize-io/vectorize-connect";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const config: VectorizeAPIConfig = {
      authorization: process.env.VECTORIZE_API_KEY!,
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID!
    };
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const connectorId = searchParams.get('connectorId');
    
    if (!userId || !connectorId) {
      return NextResponse.json({ 
        error: 'Missing userId or connectorId' 
      }, { status: 400 });
    }
    
    const tokenResponse = await getOneTimeConnectorToken(
      config,
      userId,
      connectorId
    );
    
    return NextResponse.json(tokenResponse, { status: 200 });
    
  } catch (error) {
    console.error('Error generating Google Drive token:', error);
    return NextResponse.json({ 
      error: 'Failed to generate token' 
    }, { status: 500 });
  }
}
```

## Frontend Authentication Flow

```typescript
import { GoogleDriveOAuth } from '@vectorize-io/vectorize-connect';

const handleGoogleDriveAuth = async () => {
  try {
    // Get one-time token from API endpoint
    const tokenResponse = await fetch(
      `/api/get-gdrive-token?userId=${userId}&connectorId=${connectorId}`
    ).then(response => {
      if (!response.ok) {
        throw new Error(`Failed to generate token. Status: ${response.status}`);
      }
      return response.json();
    });
    
    // Redirect to Vectorize Google Drive authentication
    await GoogleDriveOAuth.redirectToVectorizeConnect(
      tokenResponse.token,
      process.env.NEXT_PUBLIC_VECTORIZE_ORGANIZATION_ID!
    );
    
  } catch (error) {
    console.error('Google Drive authentication failed:', error);
  }
};
```

## Complete Component Example

```typescript
'use client';

import { useState } from 'react';
import { GoogleDriveOAuth } from '@vectorize-io/vectorize-connect';

export default function GoogleDriveVectorizeConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get one-time token
      const tokenResponse = await fetch(
        `/api/get-gdrive-token?userId=user123&connectorId=${connectorId}`
      ).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate token. Status: ${response.status}`);
        }
        return response.json();
      });
      
      // Redirect to Vectorize authentication
      await GoogleDriveOAuth.redirectToVectorizeConnect(
        tokenResponse.token,
        process.env.NEXT_PUBLIC_VECTORIZE_ORGANIZATION_ID!
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
      <h2 className="text-lg font-semibold">Google Drive Vectorize Connection</h2>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={!connectorId || isLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        {isLoading ? "Connecting..." : "Connect with Google Drive"}
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
    console.error('Invalid Vectorize API credentials');
  } else if (error.response?.status === 404) {
    console.error('Google Drive connector or user not found');
  } else {
    console.error('Token generation failed:', error.message);
  }
}
```

## Next Steps

- [Google Drive User Management](../../user-management/vectorize/google-drive.md)
- [Frontend Implementation](../../frontend-implementation/vectorize/)

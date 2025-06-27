# Dropbox Authentication - White-Label Approach

Implement Dropbox OAuth authentication using your own credentials.

## OAuth Callback Route

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

## Frontend OAuth Flow

```typescript
import { DropboxOAuth } from '@vectorize-io/vectorize-connect';

const handleConnectDropbox = async () => {
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
        
        // Handle successful authentication
        setSelectedFiles(selection.selectedFiles);
        setRefreshToken(selection.refreshToken);
        
        // Add user to connector
        if (connectorId) {
          addUserToConnector(connectorId, selection.selectedFiles, selection.refreshToken);
        }
      },
      onError: (error) => {
        console.error('OAuth error:', error);
        setError(error.message);
      }
    };
    
    // Start the OAuth flow in a popup
    DropboxOAuth.startOAuth(config);
    
  } catch (error: any) {
    console.error('Failed to start OAuth flow:', error);
  }
};
```

## Complete Component Example

```typescript
'use client';

import { useState } from 'react';
import { DropboxOAuth } from '@vectorize-io/vectorize-connect';

export default function DropboxConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, any> | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const handleConnectDropbox = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const config = {
        appKey: process.env.NEXT_PUBLIC_DROPBOX_APP_KEY!,
        appSecret: '',
        redirectUri: `${window.location.origin}/api/dropbox-callback`,
        scopes: ['files.metadata.read', 'files.content.read'],
        onSuccess: (selection) => {
          setSelectedFiles(selection.selectedFiles);
          setRefreshToken(selection.refreshToken);
          setIsLoading(false);
          
          if (connectorId) {
            addUserToConnector(connectorId, selection.selectedFiles, selection.refreshToken);
          }
        },
        onError: (error) => {
          setError(error.message);
          setIsLoading(false);
        }
      };
      
      DropboxOAuth.startOAuth(config);
      
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const addUserToConnector = async (connectorId: string, selectedFiles: Record<string, any>, refreshToken: string) => {
    try {
      const response = await fetch("/api/manage-dropbox-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId,
          selectedFiles,
          refreshToken,
          userId: "user123",
          action: "add"
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add user to connector');
      }
      
      console.log('User added to connector successfully');
    } catch (error: any) {
      setError(error.message);
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
    </div>
  );
}
```

## Next Steps

- [Dropbox User Management](../../user-management/white-label/dropbox.md)
- [Frontend Implementation](../../frontend-implementation/white-label/)

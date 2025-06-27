# Google Drive Authentication - White-Label Approach

Implement Google Drive OAuth authentication using your own credentials.

## OAuth Callback Route

Create a file at `app/api/oauth/callback/route.ts`:

```typescript
// app/api/oauth/callback/route.ts
import { NextRequest } from "next/server";
import { GoogleDriveOAuth } from "@vectorize-io/vectorize-connect";

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
    return GoogleDriveOAuth.createCallbackResponse(
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

## Frontend OAuth Flow

```typescript
import { GoogleDriveOAuth, GoogleDriveSelection } from '@vectorize-io/vectorize-connect';

const handleConnectGoogleDrive = async () => {
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
        
        // Handle successful authentication
        setSelectedFiles(response.fileIds);
        setRefreshToken(response.refreshToken);
        
        // Add user to connector
        if (connectorId) {
          addUserToConnector(connectorId, response.fileIds, response.refreshToken);
        }
      },
      onError: (error) => {
        console.error('OAuth error:', error);
        setError(error.message);
      }
    };
    
    // Start the OAuth flow in a popup
    GoogleDriveOAuth.startOAuth(config);
    
  } catch (error: any) {
    console.error('Failed to start OAuth flow:', error);
  }
};
```

## File Selection with Existing Token

```typescript
const handleSelectMoreFiles = async () => {
  if (!refreshToken) {
    setError('No refresh token available. Please connect to Google Drive first.');
    return;
  }
  
  try {
    // Configure Google OAuth for file selection
    const config = {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: '', // Client-side should not have the secret
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
      onSuccess: (response) => {
        console.log('Additional files selected:', response.fileIds);
        setSelectedFiles(response.fileIds);
        
        // Update user in connector
        if (connectorId) {
          addUserToConnector(connectorId, response.fileIds, refreshToken);
        }
      },
      onError: (error) => {
        console.error('File selection error:', error);
        setError(error.message);
      }
    };
    
    // Start file selection with existing refresh token
    await GoogleDriveSelection.startFileSelection(config, refreshToken);
    
  } catch (error: any) {
    console.error('Failed to select files:', error);
  }
};
```

## Complete Component Example

```typescript
'use client';

import { useState } from 'react';
import { GoogleDriveOAuth, GoogleDriveSelection } from '@vectorize-io/vectorize-connect';

export default function GoogleDriveConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[] | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const handleConnectGoogleDrive = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const config = {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID!,
        clientSecret: '',
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
        redirectUri: `${window.location.origin}/api/oauth/callback`,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        onSuccess: (response) => {
          setSelectedFiles(response.fileIds);
          setRefreshToken(response.refreshToken);
          setIsLoading(false);
          
          if (connectorId) {
            addUserToConnector(connectorId, response.fileIds, response.refreshToken);
          }
        },
        onError: (error) => {
          setError(error.message);
          setIsLoading(false);
        }
      };
      
      GoogleDriveOAuth.startOAuth(config);
      
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const addUserToConnector = async (connectorId: string, fileIds: string[], refreshToken: string) => {
    try {
      const response = await fetch("/api/manage-gdrive-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId,
          fileIds,
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
      <h2 className="text-lg font-semibold">Google Drive White-Label Connection</h2>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

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
    </div>
  );
}
```

## Next Steps

- [Google Drive User Management](../../user-management/white-label/google-drive.md)
- [Frontend Implementation](../../frontend-implementation/white-label/)

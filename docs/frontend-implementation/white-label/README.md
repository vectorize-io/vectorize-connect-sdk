# Frontend Implementation - White-Label Approach

Frontend components for white-label connectors with custom OAuth flows.

## Google Drive Component

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

  const handleCreateConnector = async () => {
    try {
      const response = await fetch("/api/createGDriveConnector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorName: "My Custom Google Drive Connector",
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create connector');
      }
      
      const { connectorId } = await response.json();
      setConnectorId(connectorId);
    } catch (error: any) {
      setError(error.message);
    }
  };

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

  const handleSelectMoreFiles = async () => {
    if (!refreshToken) {
      setError('No refresh token available. Please connect to Google Drive first.');
      return;
    }
    
    try {
      const config = {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID!,
        clientSecret: '',
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
        onSuccess: (response) => {
          setSelectedFiles(response.fileIds);
          if (connectorId) {
            addUserToConnector(connectorId, response.fileIds, refreshToken);
          }
        },
        onError: (error) => {
          setError(error.message);
        }
      };
      
      await GoogleDriveSelection.startFileSelection(config, refreshToken);
      
    } catch (error: any) {
      setError(error.message);
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
    <div className="max-w-md mx-auto space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900">Google Drive Connection</h2>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleCreateConnector}
          disabled={!!connectorId}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {connectorId ? 'Connector Created' : 'Create Connector'}
        </button>
        
        <button
          onClick={handleConnectGoogleDrive}
          disabled={!connectorId || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isLoading ? "Connecting..." : "Connect with Google Drive"}
        </button>
        
        {refreshToken && (
          <button
            onClick={handleSelectMoreFiles}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Select More Files
          </button>
        )}
      </div>

      {selectedFiles && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h3>
          <pre className="text-xs font-mono text-gray-600 bg-white p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify(selectedFiles, null, 2)}
          </pre>
        </div>
      )}

      {connectorId && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">Connector ID:</h3>
          <p className="text-sm font-mono text-gray-600 break-all">
            {connectorId}
          </p>
        </div>
      )}
    </div>
  );
}
```

## Dropbox Component

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

  const handleCreateConnector = async () => {
    try {
      const response = await fetch("/api/createDropboxConnector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorName: "My Custom Dropbox Connector",
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create connector');
      }
      
      const { connectorId } = await response.json();
      setConnectorId(connectorId);
    } catch (error: any) {
      setError(error.message);
    }
  };

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
    <div className="max-w-md mx-auto space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900">Dropbox Connection</h2>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleCreateConnector}
          disabled={!!connectorId}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {connectorId ? 'Connector Created' : 'Create Connector'}
        </button>
        
        <button
          onClick={handleConnectDropbox}
          disabled={!connectorId || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isLoading ? "Connecting..." : "Connect with Dropbox"}
        </button>
      </div>

      {selectedFiles && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h3>
          <pre className="text-xs font-mono text-gray-600 bg-white p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify(selectedFiles, null, 2)}
          </pre>
        </div>
      )}

      {connectorId && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">Connector ID:</h3>
          <p className="text-sm font-mono text-gray-600 break-all">
            {connectorId}
          </p>
        </div>
      )}
    </div>
  );
}
```

## Multi-Platform Component

```typescript
'use client';

import { useState } from 'react';
import GoogleDriveConnector from './GoogleDriveConnector';
import DropboxConnector from './DropboxConnector';

type Platform = 'google-drive' | 'dropbox';

export default function MultiPlatformConnector() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  const platforms = [
    { id: 'google-drive' as Platform, name: 'Google Drive', icon: '📁' },
    { id: 'dropbox' as Platform, name: 'Dropbox', icon: '📦' },
  ];

  if (selectedPlatform) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedPlatform(null)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Back to platform selection
        </button>
        
        {selectedPlatform === 'google-drive' && <GoogleDriveConnector />}
        {selectedPlatform === 'dropbox' && <DropboxConnector />}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 text-center">
        Choose Your Platform
      </h2>
      
      <div className="grid gap-3">
        {platforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => setSelectedPlatform(platform.id)}
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">{platform.icon}</span>
            <span className="font-medium text-gray-900">{platform.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

## Platform-Specific Examples

For detailed platform-specific frontend implementation examples:

- [Google Drive Frontend Implementation](./google-drive.md) (already exists)
- [Dropbox Frontend Implementation](./dropbox.md) (already exists)
- [Notion Frontend Implementation](./notion.md)

## Next Steps

- [Testing](../../testing/white-label/)
- [User Management](../../user-management/white-label/)

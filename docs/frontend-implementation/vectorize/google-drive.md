# Google Drive Frontend Implementation - Vectorize Approach

Frontend components for Google Drive Vectorize connectors.

## Basic Google Drive Connector Component

```typescript
'use client';

import { useState } from 'react';
import { GoogleDriveOAuth, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

export default function GoogleDriveVectorizeConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateConnector = async () => {
    try {
      const response = await fetch("/api/createGDriveConnector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorName: "My Google Drive Connector",
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create Google Drive connector');
      }
      
      const { connectorId } = await response.json();
      setConnectorId(connectorId);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenResponse = await fetch(
        `/api/get-gdrive-token?userId=user123&connectorId=${connectorId}`
      ).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate token. Status: ${response.status}`);
        }
        return response.json();
      });
      
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
    <div className="max-w-md mx-auto space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
          <span className="text-white text-sm font-bold">GD</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Google Drive Connection</h2>
      </div>
      
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
          {connectorId ? 'Google Drive Connector Created' : 'Create Google Drive Connector'}
        </button>
        
        <button
          onClick={handleConnect}
          disabled={!connectorId || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isLoading ? "Connecting to Google Drive..." : "Connect with Google Drive"}
        </button>
      </div>

      {connectorId && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">Google Drive Connector ID:</h3>
          <p className="text-sm font-mono text-gray-600 break-all">
            {connectorId}
          </p>
        </div>
      )}
    </div>
  );
}
```

## Advanced Google Drive Component with User Management

```typescript
'use client';

import { useState, useEffect } from 'react';
import { GoogleDriveOAuth, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

interface GoogleDriveUser {
  id: string;
  name: string;
  email: string;
  fileCount: number;
  lastSync: string;
}

export default function AdvancedGoogleDriveConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [users, setUsers] = useState<GoogleDriveUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddUser = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenResponse = await fetch(
        `/api/get-gdrive-token?userId=${userId}&connectorId=${connectorId}`
      ).then(response => {
        if (!response.ok) {
          throw new Error('Failed to generate Google Drive token');
        }
        return response.json();
      });
      
      await GoogleDriveOAuth.redirectToVectorizeConnect(
        tokenResponse.token,
        process.env.NEXT_PUBLIC_VECTORIZE_ORGANIZATION_ID!
      );
      
      setIsLoading(false);
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleEditUser = async (userId: string) => {
    try {
      const tokenResponse = await fetch(
        `/api/get-gdrive-token?userId=${userId}&connectorId=${connectorId}`
      ).then(response => response.json());
      
      await GoogleDriveOAuth.redirectToVectorizeEdit(
        tokenResponse.token,
        process.env.NEXT_PUBLIC_VECTORIZE_ORGANIZATION_ID!
      );
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch("/api/manage-gdrive-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId,
          userId,
          action: "remove"
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove Google Drive user');
      }
      
      setUsers(users.filter(user => user.id !== userId));
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">GD</span>
          </div>
          <h2 className="text-xl font-semibold">Google Drive Connector Management</h2>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleAddUser('new-gdrive-user-id')}
            disabled={!connectorId || isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
          >
            {isLoading ? "Adding Google Drive User..." : "Add New Google Drive User"}
          </button>
        </div>
      </div>

      {users.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Connected Google Drive Users</h3>
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">{user.fileCount} Google Drive files</p>
                  <p className="text-xs text-gray-400">Last sync: {user.lastSync}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEditUser(user.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit Files
                  </button>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Google Drive Hook for Reusable Logic

```typescript
// hooks/useGoogleDriveConnector.ts
import { useState } from 'react';
import { GoogleDriveOAuth, createVectorizeGDriveConnector } from '@vectorize-io/vectorize-connect';

export function useGoogleDriveConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConnector = async (name: string) => {
    try {
      const config = {
        authorization: process.env.VECTORIZE_API_KEY!,
        organizationId: process.env.VECTORIZE_ORGANIZATION_ID!
      };

      const connectorId = await createVectorizeGDriveConnector(config, name);
      setConnectorId(connectorId);
      return connectorId;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const connectUser = async (userId: string, organizationId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenResponse = await fetch(
        `/api/get-gdrive-token?userId=${userId}&connectorId=${connectorId}`
      ).then(response => response.json());
      
      await GoogleDriveOAuth.redirectToVectorizeConnect(
        tokenResponse.token,
        organizationId
      );
      
      setIsLoading(false);
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
      throw error;
    }
  };

  return {
    connectorId,
    isLoading,
    error,
    createConnector,
    connectUser,
    setError
  };
}
```

## Next Steps

- [Google Drive User Management](../../user-management/vectorize/google-drive.md)
- [Google Drive Testing](../../testing/vectorize/google-drive.md)

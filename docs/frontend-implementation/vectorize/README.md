# Frontend Implementation - Vectorize Approach

Frontend components for Vectorize connectors with simplified authentication flow.

## Basic Connector Component

```typescript
'use client';

import { useState } from 'react';
import { PlatformOAuth } from '@vectorize-io/vectorize-connect';

export default function VectorizeConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateConnector = async () => {
    try {
      const response = await fetch("/api/createConnector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorName: "My Team Storage Connector",
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
    <div className="max-w-md mx-auto space-y-4 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900">Platform Connection</h2>
      
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
          onClick={handleConnect}
          disabled={!connectorId || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isLoading ? "Connecting..." : "Connect to Platform"}
        </button>
      </div>

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

## Advanced Component with User Management

```typescript
'use client';

import { useState, useEffect } from 'react';
import { PlatformOAuth, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

interface User {
  id: string;
  name: string;
  email: string;
  fileCount: number;
}

export default function AdvancedVectorizeConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddUser = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenResponse = await fetch(
        `/api/get-one-time-connector-token?userId=${userId}&connectorId=${connectorId}`
      ).then(response => {
        if (!response.ok) {
          throw new Error('Failed to generate token');
        }
        return response.json();
      });
      
      await PlatformOAuth.redirectToVectorizeConnect(
        tokenResponse.token,
        'your-org-id'
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
        `/api/get-one-time-connector-token?userId=${userId}&connectorId=${connectorId}`
      ).then(response => response.json());
      
      await PlatformOAuth.redirectToVectorizeEdit(
        tokenResponse.token,
        'your-org-id'
      );
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch("/api/manage-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId,
          userId,
          action: "remove"
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove user');
      }
      
      setUsers(users.filter(user => user.id !== userId));
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Connector Management</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleAddUser('new-user-id')}
            disabled={!connectorId || isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
          >
            {isLoading ? "Adding User..." : "Add New User"}
          </button>
        </div>
      </div>

      {users.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Connected Users</h3>
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">{user.fileCount} files</p>
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

## Hooks for Reusable Logic

```typescript
// hooks/useVectorizeConnector.ts
import { useState } from 'react';
import { PlatformOAuth } from '@vectorize-io/vectorize-connect';

export function useVectorizeConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConnector = async (name: string) => {
    try {
      const response = await fetch("/api/createConnector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorName: name }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create connector');
      }
      
      const { connectorId } = await response.json();
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
        `/api/get-one-time-connector-token?userId=${userId}&connectorId=${connectorId}`
      ).then(response => response.json());
      
      await PlatformOAuth.redirectToVectorizeConnect(
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

- [Testing](../../testing/vectorize/)
- [User Management](../../user-management/vectorize/)

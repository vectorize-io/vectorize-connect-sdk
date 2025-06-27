# Notion Frontend Implementation - Vectorize Approach

Frontend components for Notion Vectorize connectors.

## Basic Notion Connector Component

```typescript
'use client';

import { useState } from 'react';
import { NotionOAuth, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

export default function NotionVectorizeConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateConnector = async () => {
    try {
      const response = await fetch("/api/createNotionConnector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorName: "My Notion Connector",
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create Notion connector');
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
        `/api/get-notion-token?userId=user123&connectorId=${connectorId}`
      ).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate token. Status: ${response.status}`);
        }
        return response.json();
      });
      
      await NotionOAuth.redirectToVectorizeConnect(
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
        <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
          <span className="text-white text-sm font-bold">N</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Notion Connection</h2>
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
          className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {connectorId ? 'Notion Connector Created' : 'Create Notion Connector'}
        </button>
        
        <button
          onClick={handleConnect}
          disabled={!connectorId || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isLoading ? "Connecting to Notion..." : "Connect with Notion"}
        </button>
      </div>

      {connectorId && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">Notion Connector ID:</h3>
          <p className="text-sm font-mono text-gray-600 break-all">
            {connectorId}
          </p>
        </div>
      )}
    </div>
  );
}
```

## Advanced Notion Component with User Management

```typescript
'use client';

import { useState, useEffect } from 'react';
import { NotionOAuth, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

interface NotionUser {
  id: string;
  workspaceName: string;
  pageCount: number;
  lastSync: string;
  selectedPages: Record<string, { title: string; pageId: string; parentType?: string }>;
}

export default function AdvancedNotionConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [users, setUsers] = useState<NotionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddUser = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenResponse = await fetch(
        `/api/get-notion-token?userId=${userId}&connectorId=${connectorId}`
      ).then(response => {
        if (!response.ok) {
          throw new Error('Failed to generate Notion token');
        }
        return response.json();
      });
      
      await NotionOAuth.redirectToVectorizeConnect(
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
        `/api/get-notion-token?userId=${userId}&connectorId=${connectorId}`
      ).then(response => response.json());
      
      await NotionOAuth.redirectToVectorizeEdit(
        tokenResponse.token,
        process.env.NEXT_PUBLIC_VECTORIZE_ORGANIZATION_ID!
      );
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch("/api/manage-notion-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId,
          userId,
          action: "remove"
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove Notion user');
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
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <h2 className="text-xl font-semibold">Notion Connector Management</h2>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleAddUser('new-notion-user-id')}
            disabled={!connectorId || isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
          >
            {isLoading ? "Adding Notion User..." : "Add New Notion User"}
          </button>
        </div>
      </div>

      {users.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Connected Notion Users</h3>
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{user.workspaceName}</p>
                  <p className="text-sm text-gray-500">{user.pageCount} Notion pages</p>
                  <p className="text-xs text-gray-400">Last sync: {user.lastSync}</p>
                  <div className="text-xs text-gray-400 mt-1">
                    Pages: {Object.values(user.selectedPages).map(page => page.title).join(', ')}
                  </div>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEditUser(user.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit Pages
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

## Notion Hook for Reusable Logic

```typescript
// hooks/useNotionConnector.ts
import { useState } from 'react';
import { NotionOAuth, createVectorizeNotionConnector } from '@vectorize-io/vectorize-connect';

export function useNotionConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConnector = async (name: string) => {
    try {
      const config = {
        authorization: process.env.VECTORIZE_API_KEY!,
        organizationId: process.env.VECTORIZE_ORGANIZATION_ID!
      };

      const connectorId = await createVectorizeNotionConnector(config, name);
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
        `/api/get-notion-token?userId=${userId}&connectorId=${connectorId}`
      ).then(response => response.json());
      
      await NotionOAuth.redirectToVectorizeConnect(
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

- [Notion User Management](../../user-management/vectorize/notion.md)
- [Notion Testing](../../testing/vectorize/notion.md)

# Notion Frontend Implementation - White-Label Approach

Frontend components for Notion White-Label connectors.

## Basic Notion White-Label Component

```typescript
'use client';

import { useState } from 'react';
import { NotionOAuth, NotionSelection } from '@vectorize-io/vectorize-connect';

export default function NotionWhiteLabelConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<Record<string, any> | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const handleCreateConnector = async () => {
    try {
      const response = await fetch("/api/createNotionConnector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorName: "My Custom Notion Connector",
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

  const handleConnectNotion = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const config = {
        clientId: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID!,
        clientSecret: '',
        redirectUri: `${window.location.origin}/api/notion-callback`,
        onSuccess: (response) => {
          setSelectedPages(response.selectedPages);
          setAccessToken(response.accessToken);
          setIsLoading(false);
          
          if (connectorId) {
            addUserToConnector(connectorId, response.selectedPages, response.accessToken);
          }
        },
        onError: (error) => {
          setError(error.message);
          setIsLoading(false);
        }
      };
      
      NotionOAuth.startOAuth(config);
      
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const addUserToConnector = async (connectorId: string, selectedPages: Record<string, any>, accessToken: string) => {
    try {
      const response = await fetch("/api/manage-notion-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId,
          selectedPages,
          accessToken,
          userId: "user123",
          action: "add"
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add user to Notion connector');
      }
      
      console.log('User added to Notion connector successfully');
    } catch (error: any) {
      setError(error.message);
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
          {connectorId ? 'Connector Created' : 'Create Connector'}
        </button>
        
        <button
          onClick={handleConnectNotion}
          disabled={!connectorId || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isLoading ? "Connecting..." : "Connect with Notion"}
        </button>
      </div>

      {selectedPages && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Pages:</h3>
          <div className="space-y-1">
            {Object.values(selectedPages).map((page: any) => (
              <div key={page.pageId} className="text-xs text-gray-600">
                {page.title}
              </div>
            ))}
          </div>
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

## Next Steps

- [Notion User Management](../../user-management/white-label/notion.md)
- [Notion Testing](../../testing/white-label/notion.md)

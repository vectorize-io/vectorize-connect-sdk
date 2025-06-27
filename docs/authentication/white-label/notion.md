# Notion Authentication - White-Label Approach

Implement Notion OAuth authentication using your own credentials.

## Prerequisites

Before implementing Notion authentication, you need:

1. **Notion Integration**: Create a Notion integration in your [Notion Developer Portal](https://www.notion.so/my-integrations)
2. **OAuth Credentials**: Obtain your Client ID and Client Secret from the integration settings
3. **Redirect URI**: Configure the redirect URI in your Notion integration settings

## Environment Setup

```bash
# Required environment variables
VECTORIZE_API_KEY=your_vectorize_api_key
VECTORIZE_ORGANIZATION_ID=your_organization_id

# Notion OAuth credentials
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
```

## OAuth Callback Route

Create a file at `app/api/notion-callback/route.ts`:

```typescript
// app/api/notion-callback/route.ts
import { NextRequest } from "next/server";
import { NotionOAuth } from "@vectorize-io/vectorize-connect";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Configure Notion OAuth
    const config = {
      clientId: process.env.NOTION_CLIENT_ID!,
      clientSecret: process.env.NOTION_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/notion-callback`,
      scopes: ['read_content']
    };

    // Create the callback response
    return NotionOAuth.createCallbackResponse(
      code || '',
      config,
      error || undefined
    );
  } catch (error: any) {
    console.error('Notion OAuth callback error:', error);
    return new Response(`OAuth Error: ${error.message}`, { status: 500 });
  }
}
```

## Frontend OAuth Flow

```typescript
import { NotionOAuth } from '@vectorize-io/vectorize-connect';

const handleConnectNotion = async () => {
  try {
    // Configure Notion OAuth
    const config = {
      clientId: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID!,
      clientSecret: '', // Client-side should not have the secret
      redirectUri: `${window.location.origin}/api/notion-callback`,
      scopes: ['read_content'],
      onSuccess: (selection) => {
        console.log('Selected pages:', selection.pages);
        console.log('Access token:', selection.accessToken);
        console.log('Workspace info:', selection.workspaceId, selection.workspaceName);
        
        // Handle successful authentication
        setSelectedPages(selection.pages);
        setAccessToken(selection.accessToken);
        
        // Add user to connector
        if (connectorId) {
          addUserToConnector(connectorId, selection.pages, selection.accessToken);
        }
      },
      onError: (error) => {
        console.error('OAuth error:', error);
        setError(error.message);
      }
    };
    
    // Start the OAuth flow in a popup
    NotionOAuth.startOAuth(config);
    
  } catch (error: any) {
    console.error('Failed to start OAuth flow:', error);
  }
};
```

## Complete Component Example

```typescript
'use client';

import { useState } from 'react';
import { NotionOAuth } from '@vectorize-io/vectorize-connect';

export default function NotionConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<any[] | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const handleConnectNotion = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const config = {
        clientId: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID!,
        clientSecret: '',
        redirectUri: `${window.location.origin}/api/notion-callback`,
        scopes: ['read_content'],
        onSuccess: (selection) => {
          setSelectedPages(selection.pages);
          setAccessToken(selection.accessToken);
          setIsLoading(false);
          
          if (connectorId) {
            addUserToConnector(connectorId, selection.pages, selection.accessToken);
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

  const addUserToConnector = async (connectorId: string, pages: any[], accessToken: string) => {
    try {
      const response = await fetch("/api/manage-notion-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId,
          selectedPages: pages.reduce((acc, page) => {
            acc[page.id] = {
              title: page.title,
              pageId: page.id,
              parentType: page.parentType
            };
            return acc;
          }, {}),
          accessToken,
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
      <h2 className="text-lg font-semibold">Notion White-Label Connection</h2>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={handleConnectNotion}
        disabled={!connectorId || isLoading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        {isLoading ? "Connecting..." : "Connect with Notion"}
      </button>

      {selectedPages && (
        <div>
          <h3 className="text-sm font-medium">Selected Pages:</h3>
          <pre className="mt-1 text-sm font-mono bg-gray-100 p-2 rounded">
            {JSON.stringify(selectedPages, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

## Token Management

### Exchange Authorization Code

```typescript
import { exchangeNotionCodeForTokens } from '@vectorize-io/vectorize-connect';

const tokens = await exchangeNotionCodeForTokens(
  authorizationCode,
  process.env.NOTION_CLIENT_ID!,
  process.env.NOTION_CLIENT_SECRET!,
  redirectUri
);

console.log('Access token:', tokens.access_token);
console.log('Workspace:', tokens.workspace_name);
console.log('Bot ID:', tokens.bot_id);
```

### Validate Access Token

```typescript
import { refreshNotionToken } from '@vectorize-io/vectorize-connect';

const validatedToken = await refreshNotionToken(
  accessToken,
  process.env.NOTION_CLIENT_ID!,
  process.env.NOTION_CLIENT_SECRET!
);

console.log('Token is valid for workspace:', validatedToken.workspace_name);
```

## Error Handling

```typescript
try {
  const config = {
    clientId: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID!,
    clientSecret: '',
    redirectUri: `${window.location.origin}/api/notion-callback`,
    scopes: ['read_content'],
    onSuccess: (selection) => {
      // Handle success
    },
    onError: (error) => {
      if (error.code === 'CONFIGURATION_ERROR') {
        console.error('OAuth configuration error:', error.message);
      } else if (error.code === 'TOKEN_EXCHANGE_ERROR') {
        console.error('Failed to exchange code for tokens:', error.message);
      } else {
        console.error('OAuth error:', error.message);
      }
    }
  };
  
  NotionOAuth.startOAuth(config);
} catch (error: any) {
  console.error('Failed to start OAuth flow:', error);
}
```

## Next Steps

- [Notion User Management](../../user-management/white-label/notion.md)
- [Frontend Implementation](../../frontend-implementation/white-label/)

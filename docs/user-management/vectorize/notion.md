# Notion User Management - Vectorize Approach

Manage Notion users in Vectorize connectors.

## Automatic User Addition

With Vectorize Notion connectors, users are automatically added when they complete the authentication flow through `NotionOAuth.redirectToVectorizeConnect()`. No additional API calls are required for adding users.

## Manual User Management

For editing or removing users, use the `manageNotionUser` function:

```typescript
import { manageNotionUser, VectorizeAPIConfig } from '@vectorize-io/vectorize-connect';

const config: VectorizeAPIConfig = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!
};

// Edit user page selection
const selectedPages = {
  "page1": {
    title: "My Page",
    pageId: "page1",
    parentType: "workspace"
  }
};

await manageNotionUser(
  config,
  connectorId,
  selectedPages,
  accessToken,
  userId,
  'edit'
);

// Remove a user
await manageNotionUser(
  config,
  connectorId,
  null,
  '',
  userId,
  'remove'
);
```

## Notion User Management API Route

Create an API route specifically for Notion user management:

```typescript
// app/api/manage-notion-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { manageNotionUser, VectorizeAPIConfig } from '@vectorize-io/vectorize-connect';

export async function POST(request: NextRequest) {
  try {
    const { connectorId, userId, action, selectedPages, accessToken } = await request.json();

    if (!connectorId || !userId || !action) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
      authorization: process.env.VECTORIZE_API_KEY!,
    };

    // Handle Notion specific user management
    const response = await manageNotionUser(
      config,
      connectorId,
      action === 'remove' ? null : selectedPages,
      action === 'remove' ? '' : accessToken,
      userId,
      action
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error managing Notion user:', error);
    return NextResponse.json(
      { error: error.message || "Failed to manage Notion user" },
      { status: 500 }
    );
  }
}
```

## Frontend Notion User Management

```typescript
import { NotionOAuth, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

const removeNotionUser = async (userId: string) => {
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
    
    console.log('Notion user removed successfully');
  } catch (error: any) {
    console.error('Error removing Notion user:', error.message);
  }
};

const editNotionUserPages = async (userId: string) => {
  try {
    const config = {
      authorization: process.env.VECTORIZE_API_KEY!,
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID!
    };

    // Generate token for editing
    const tokenResponse = await getOneTimeConnectorToken(
      config,
      userId,
      connectorId
    );

    // Redirect to Vectorize Notion edit flow
    await NotionOAuth.redirectToVectorizeEdit(
      tokenResponse.token,
      config.organizationId
    );
  } catch (error) {
    console.error('Failed to start Notion edit flow:', error);
  }
};
```

## Complete Notion User Management Component

```typescript
'use client';

import { useState } from 'react';
import { NotionOAuth, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

interface NotionUser {
  id: string;
  workspaceName: string;
  selectedPages: Record<string, { title: string; pageId: string; parentType?: string }>;
}

export default function NotionUserManager({ connectorId }: { connectorId: string }) {
  const [users, setUsers] = useState<NotionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeUser = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
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
      
      // Update local state
      setUsers(users.filter(user => user.id !== userId));
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const editUserPages = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get one-time token for editing
      const tokenResponse = await fetch(
        `/api/get-notion-token?userId=${userId}&connectorId=${connectorId}`
      ).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate token. Status: ${response.status}`);
        }
        return response.json();
      });
      
      // Redirect to Vectorize edit flow
      await NotionOAuth.redirectToVectorizeEdit(
        tokenResponse.token,
        process.env.NEXT_PUBLIC_VECTORIZE_ORGANIZATION_ID!
      );
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Notion Users</h3>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">{user.workspaceName}</div>
              <div className="text-xs text-gray-500">
                {Object.keys(user.selectedPages).length} pages selected
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {Object.values(user.selectedPages).map(page => page.title).join(', ')}
              </div>
            </div>
            
            <div className="space-x-2">
              <button
                onClick={() => editUserPages(user.id)}
                disabled={isLoading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
              >
                Edit Pages
              </button>
              
              <button
                onClick={() => removeUser(user.id)}
                disabled={isLoading}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Error Handling

```typescript
try {
  await manageNotionUser(config, connectorId, null, '', userId, 'remove');
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid Vectorize API credentials');
  } else if (error.response?.status === 404) {
    console.error('Notion connector or user not found');
  } else if (error.response?.status === 403) {
    console.error('Insufficient permissions to manage Notion user');
  } else {
    console.error('Notion user management failed:', error.message);
  }
}
```

## Next Steps

- [Notion Frontend Implementation](../../frontend-implementation/vectorize/notion.md)
- [Notion Testing](../../testing/vectorize/notion.md)

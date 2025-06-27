# Notion User Management - White-Label Approach

Manage Notion users in White-Label connectors using your own OAuth credentials.

## User Addition

With White-Label Notion connectors, users are added through the OAuth flow and then managed using the `manageNotionUser` function:

```typescript
import { manageNotionUser, VectorizeAPIConfig } from '@vectorize-io/vectorize-connect';

const config: VectorizeAPIConfig = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!
};

// Add user with selected pages
const selectedPages = {
  "page1": {
    title: "My Page",
    pageId: "page1",
    parentType: "workspace"
  },
  "page2": {
    title: "Another Page", 
    pageId: "page2",
    parentType: "database"
  }
};

await manageNotionUser(
  config,
  connectorId,
  selectedPages,
  accessToken,
  userId,
  'add'
);
```

## Complete User Management

### Add User
```typescript
const addNotionUser = async (
  userId: string, 
  selectedPages: Record<string, any>, 
  accessToken: string
) => {
  try {
    await manageNotionUser(
      config,
      connectorId,
      selectedPages,
      accessToken,
      userId,
      'add'
    );
    console.log('Notion user added successfully');
  } catch (error: any) {
    console.error('Error adding Notion user:', error.message);
  }
};
```

### Edit User
```typescript
const editNotionUser = async (
  userId: string, 
  newSelectedPages: Record<string, any>, 
  accessToken: string
) => {
  try {
    await manageNotionUser(
      config,
      connectorId,
      newSelectedPages,
      accessToken,
      userId,
      'edit'
    );
    console.log('Notion user updated successfully');
  } catch (error: any) {
    console.error('Error updating Notion user:', error.message);
  }
};
```

### Remove User
```typescript
const removeNotionUser = async (userId: string) => {
  try {
    await manageNotionUser(
      config,
      connectorId,
      null,
      '',
      userId,
      'remove'
    );
    console.log('Notion user removed successfully');
  } catch (error: any) {
    console.error('Error removing Notion user:', error.message);
  }
};
```

## Notion User Management API Route

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

    // Validate required fields for add/edit actions
    if ((action === 'add' || action === 'edit') && (!selectedPages || !accessToken)) {
      return NextResponse.json(
        { error: "selectedPages and accessToken are required for add/edit actions" },
        { status: 400 }
      );
    }

    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
      authorization: process.env.VECTORIZE_API_KEY!,
    };

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

## Complete Notion User Management Component

```typescript
'use client';

import { useState } from 'react';
import { NotionOAuth } from '@vectorize-io/vectorize-connect';

interface NotionUser {
  id: string;
  workspaceName: string;
  selectedPages: Record<string, { title: string; pageId: string; parentType?: string }>;
  accessToken: string;
}

export default function NotionWhiteLabelUserManager({ connectorId }: { connectorId: string }) {
  const [users, setUsers] = useState<NotionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addUser = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const config = {
        clientId: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID!,
        clientSecret: '',
        redirectUri: `${window.location.origin}/api/notion-callback`,
        scopes: ['read_content'],
        onSuccess: async (selection) => {
          // Add user to connector
          const response = await fetch("/api/manage-notion-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              connectorId,
              userId: `user_${Date.now()}`,
              action: "add",
              selectedPages: selection.pages.reduce((acc: any, page: any) => {
                acc[page.id] = {
                  title: page.title,
                  pageId: page.id,
                  parentType: page.parentType
                };
                return acc;
              }, {}),
              accessToken: selection.accessToken
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to add user to connector');
          }
          
          // Update local state
          const newUser: NotionUser = {
            id: `user_${Date.now()}`,
            workspaceName: selection.workspaceName,
            selectedPages: selection.pages.reduce((acc: any, page: any) => {
              acc[page.id] = {
                title: page.title,
                pageId: page.id,
                parentType: page.parentType
              };
              return acc;
            }, {}),
            accessToken: selection.accessToken
          };
          
          setUsers([...users, newUser]);
          setIsLoading(false);
        },
        onError: (error) => {
          setError(error.message);
          setIsLoading(false);
        }
      };
      
      NotionOAuth.startOAuth(config);
      
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

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
      
      setUsers(users.filter(user => user.id !== userId));
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const editUser = async (user: NotionUser) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const config = {
        clientId: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID!,
        clientSecret: '',
        redirectUri: `${window.location.origin}/api/notion-callback`,
        scopes: ['read_content'],
        onSuccess: async (selection) => {
          // Update user in connector
          const response = await fetch("/api/manage-notion-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              connectorId,
              userId: user.id,
              action: "edit",
              selectedPages: selection.pages.reduce((acc: any, page: any) => {
                acc[page.id] = {
                  title: page.title,
                  pageId: page.id,
                  parentType: page.parentType
                };
                return acc;
              }, {}),
              accessToken: selection.accessToken
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update user');
          }
          
          // Update local state
          setUsers(users.map(u => u.id === user.id ? {
            ...u,
            selectedPages: selection.pages.reduce((acc: any, page: any) => {
              acc[page.id] = {
                title: page.title,
                pageId: page.id,
                parentType: page.parentType
              };
              return acc;
            }, {}),
            accessToken: selection.accessToken
          } : u));
          
          setIsLoading(false);
        },
        onError: (error) => {
          setError(error.message);
          setIsLoading(false);
        }
      };
      
      NotionOAuth.startOAuth(config);
      
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notion Users (White-Label)</h3>
        <button
          onClick={addUser}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          {isLoading ? "Adding..." : "Add User"}
        </button>
      </div>
      
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
                onClick={() => editUser(user)}
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
  await manageNotionUser(config, connectorId, selectedPages, accessToken, userId, 'add');
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid Vectorize API credentials or Notion access token');
  } else if (error.response?.status === 404) {
    console.error('Notion connector not found');
  } else if (error.response?.status === 403) {
    console.error('Insufficient permissions to manage Notion user');
  } else {
    console.error('Notion user management failed:', error.message);
  }
}
```

## Next Steps

- [Notion Frontend Implementation](../../frontend-implementation/white-label/notion.md)
- [Notion Testing](../../testing/white-label/notion.md)

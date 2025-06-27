# Google Drive User Management - Vectorize Approach

Manage Google Drive users in Vectorize connectors.

## Automatic User Addition

With Vectorize Google Drive connectors, users are automatically added when they complete the authentication flow through `GoogleDriveOAuth.redirectToVectorizeConnect()`. No additional API calls are required for adding users.

## Manual User Management

For editing or removing users, use the `manageUser` function:

```typescript
import { manageUser, VectorizeAPIConfig } from '@vectorize-io/vectorize-connect';

const config: VectorizeAPIConfig = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!
};

// Edit user file selection
await manageUser(
  config,
  connectorId,
  userId,
  'edit',
  { selectedFiles: newGoogleDriveFileSelection }
);

// Remove a user
await manageUser(
  config,
  connectorId,
  userId,
  'remove'
);
```

## Google Drive User Management API Route

Create an API route specifically for Google Drive user management:

```typescript
// app/api/manage-gdrive-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { manageUser, VectorizeAPIConfig } from '@vectorize-io/vectorize-connect';

export async function POST(request: NextRequest) {
  try {
    const { connectorId, userId, action, selectedFiles } = await request.json();

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

    // Handle Google Drive specific user management
    const payload = action === 'edit' ? { selectedFiles } : undefined;
    
    const response = await manageUser(
      config,
      connectorId,
      userId,
      action,
      payload
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error managing Google Drive user:', error);
    return NextResponse.json(
      { error: error.message || "Failed to manage Google Drive user" },
      { status: 500 }
    );
  }
}
```

## Frontend Google Drive User Management

```typescript
import { GoogleDriveOAuth, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

const removeGoogleDriveUser = async (userId: string) => {
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
    
    console.log('Google Drive user removed successfully');
  } catch (error: any) {
    console.error('Error removing Google Drive user:', error.message);
  }
};

const editGoogleDriveUserFiles = async (userId: string) => {
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

    // Redirect to Vectorize Google Drive edit flow
    await GoogleDriveOAuth.redirectToVectorizeEdit(
      tokenResponse.token,
      config.organizationId
    );
  } catch (error) {
    console.error('Failed to start Google Drive edit flow:', error);
  }
};
```

## Complete Google Drive User Management Component

```typescript
'use client';

import { useState } from 'react';
import { GoogleDriveOAuth, getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

interface GoogleDriveUser {
  id: string;
  email: string;
  name: string;
  selectedFiles: string[];
}

export default function GoogleDriveUserManager({ connectorId }: { connectorId: string }) {
  const [users, setUsers] = useState<GoogleDriveUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeUser = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
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
      
      // Update local state
      setUsers(users.filter(user => user.id !== userId));
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const editUserFiles = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get one-time token for editing
      const tokenResponse = await fetch(
        `/api/get-gdrive-token?userId=${userId}&connectorId=${connectorId}`
      ).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to generate token. Status: ${response.status}`);
        }
        return response.json();
      });
      
      // Redirect to Vectorize edit flow
      await GoogleDriveOAuth.redirectToVectorizeEdit(
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
      <h3 className="text-lg font-semibold">Google Drive Users</h3>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-gray-600">{user.email}</div>
              <div className="text-xs text-gray-500">
                {user.selectedFiles.length} files selected
              </div>
            </div>
            
            <div className="space-x-2">
              <button
                onClick={() => editUserFiles(user.id)}
                disabled={isLoading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
              >
                Edit Files
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
  await manageUser(config, connectorId, userId, 'remove');
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid Vectorize API credentials');
  } else if (error.response?.status === 404) {
    console.error('Google Drive connector or user not found');
  } else if (error.response?.status === 403) {
    console.error('Insufficient permissions to manage Google Drive user');
  } else {
    console.error('Google Drive user management failed:', error.message);
  }
}
```

## Next Steps

- [Google Drive Frontend Implementation](../../frontend-implementation/vectorize/google-drive.md)
- [Google Drive Testing](../../testing/vectorize/google-drive.md)

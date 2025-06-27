# Google Drive User Management - White-Label Approach

Manage Google Drive users in white-label connectors.

## User Management API Route

Create a file at `app/api/manage-gdrive-user/route.ts`:

```typescript
// app/api/manage-gdrive-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { manageGDriveUser } from "@vectorize-io/vectorize-connect";

interface VectorizeAPIConfig {
  organizationId: string;
  authorization: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { connectorId, fileIds, refreshToken, userId, action } = body;

    // Validate required parameters
    if (!connectorId || !refreshToken || !userId || !action) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Configure Vectorize API
    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID ?? "",
      authorization: process.env.VECTORIZE_API_KEY ?? "",
    };

    // Manage the user
    const response = await manageGDriveUser(
      config,
      connectorId,
      fileIds,
      refreshToken,
      userId,
      action
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error managing Google Drive user:', error);
    return NextResponse.json(
      { error: error.message || "Failed to manage user" },
      { status: 500 }
    );
  }
}
```

## Frontend User Management

```typescript
const addUserToConnector = async (connectorId: string, fileIds: string[], refreshToken: string) => {
  try {
    const response = await fetch("/api/manage-gdrive-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connectorId,
        fileIds,
        refreshToken,
        userId: "user123", // Replace with your user ID
        action: "add"
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to add user to connector');
    }
    
    console.log('User added to connector successfully');
  } catch (error: any) {
    console.error('Error adding user:', error.message);
  }
};

const removeUserFromConnector = async (connectorId: string, userId: string) => {
  try {
    const response = await fetch("/api/manage-gdrive-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connectorId,
        fileIds: [],
        refreshToken: "",
        userId,
        action: "remove"
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove user from connector');
    }
    
    console.log('User removed from connector successfully');
  } catch (error: any) {
    console.error('Error removing user:', error.message);
  }
};

const updateUserFiles = async (connectorId: string, userId: string, newFileIds: string[], refreshToken: string) => {
  try {
    const response = await fetch("/api/manage-gdrive-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connectorId,
        fileIds: newFileIds,
        refreshToken,
        userId,
        action: "edit"
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user files');
    }
    
    console.log('User files updated successfully');
  } catch (error: any) {
    console.error('Error updating user files:', error.message);
  }
};
```

## Complete User Management Component

```typescript
'use client';

import { useState } from 'react';

interface User {
  id: string;
  name: string;
  fileIds: string[];
  refreshToken: string;
}

export default function GoogleDriveUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [connectorId, setConnectorId] = useState<string>('');

  const removeUser = async (userId: string) => {
    try {
      const response = await fetch("/api/manage-gdrive-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId,
          fileIds: [],
          refreshToken: "",
          userId,
          action: "remove"
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove user');
      }
      
      // Update local state
      setUsers(users.filter(user => user.id !== userId));
      console.log('User removed successfully');
    } catch (error: any) {
      console.error('Error removing user:', error.message);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Google Drive User Management</h2>
      
      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-600">{user.fileIds.length} files selected</p>
            </div>
            <button
              onClick={() => removeUser(user.id)}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Next Steps

- [Frontend Implementation](../../frontend-implementation/white-label/)
- [Testing](../../testing/white-label/)

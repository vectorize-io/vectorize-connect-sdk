# User Management - Vectorize Approach

Manage users in Vectorize connectors using the simplified API.

## Automatic User Addition

With Vectorize connectors, users are automatically added when they complete the authentication flow through `PlatformOAuth.redirectToVectorizeConnect()`. No additional API calls are required for adding users.

## Manual User Management

For editing or removing users, use the `manageUser` function:

```typescript
import { manageUser } from '@vectorize-io/vectorize-connect';

// Edit user file selection
await manageUser(
  vectorizeConfig,
  connectorId,
  userId,
  'edit',
  { selectedFiles: newFileSelection }
);

// Remove a user
await manageUser(
  vectorizeConfig,
  connectorId,
  userId,
  'remove'
);
```

## User Management API Route

Create an optional API route for user management operations:

```typescript
// app/api/manage-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { manageUser } from '@vectorize-io/vectorize-connect';

interface VectorizeAPIConfig {
  organizationId: string;
  authorization: string;
}

export async function POST(request: NextRequest) {
  try {
    const { connectorId, userId, action, payload } = await request.json();

    // Validate required parameters
    if (!connectorId || !userId || !action) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get Vectorize config
    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID ?? "",
      authorization: process.env.VECTORIZE_API_KEY ?? "",
    };

    // Manage the user
    const response = await manageUser(
      config,
      connectorId,
      userId,
      action,
      payload
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error managing user:', error);
    return NextResponse.json(
      { error: error.message || "Failed to manage user" },
      { status: 500 }
    );
  }
}
```

## Frontend User Management

```typescript
const removeUser = async (userId: string) => {
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
    
    console.log('User removed successfully');
  } catch (error: any) {
    console.error('Error removing user:', error.message);
  }
};

const editUserFiles = async (userId: string, newFileSelection: any) => {
  try {
    const response = await fetch("/api/manage-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connectorId,
        userId,
        action: "edit",
        payload: { selectedFiles: newFileSelection }
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

## Editing User File Selection

To allow users to modify their file selection, generate a new one-time token and redirect them to the edit flow:

```typescript
import { getOneTimeConnectorToken, PlatformOAuth } from '@vectorize-io/vectorize-connect';

const editUserFiles = async (userId: string) => {
  try {
    // Generate token for editing
    const tokenResponse = await getOneTimeConnectorToken(
      vectorizeConfig,
      userId,
      connectorId
    );

    // Redirect to Vectorize edit flow
    await PlatformOAuth.redirectToVectorizeEdit(
      tokenResponse.token,
      vectorizeConfig.organizationId
    );
  } catch (error) {
    console.error('Failed to start edit flow:', error);
  }
};
```

## Next Steps

- [Frontend Implementation](../../frontend-implementation/vectorize/)
- [Testing](../../testing/vectorize/)

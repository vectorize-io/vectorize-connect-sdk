# Creating Connectors - Vectorize Approach

Create connectors using Vectorize's managed OAuth credentials for quick setup.

## Supported Connectors

Vectorize provides managed OAuth credentials for the following platforms:
- **Google Drive** (`GOOGLE_DRIVE_OAUTH_MULTI`)
- **Dropbox** (`DROPBOX_OAUTH_MULTI`)
- **Notion** (`NOTION_OAUTH_MULTI`)

## API Route Implementation

Create a file at `app/api/createConnector/route.ts`:

```typescript
// app/api/createConnector/route.ts
import { NextResponse } from "next/server";
import { createVectorizeConnector } from "@vectorize-io/vectorize-connect";

interface VectorizeAPIConfig {
  organizationId: string;
  authorization: string;
}

export async function POST(request: Request) {
  try {
    // Parse the incoming request
    const { connectorName, platformType } = await request.json();

    // Gather environment variables for your Vectorize config
    const config: VectorizeAPIConfig = {
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID ?? "",
      authorization: process.env.VECTORIZE_API_KEY ?? "",
    };

    // Validate environment variables
    if (!config.organizationId || !config.authorization) {
      return NextResponse.json(
        { error: "Missing Vectorize credentials in environment" },
        { status: 500 }
      );
    }

    // Create the connector (Vectorize managed)
    const connectorId = await createVectorizeConnector(
      config,
      connectorName,
      platformType
    );

    return NextResponse.json({ connectorId }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
```

## Connector Examples

### Google Drive Multi-User Connector

```typescript
import { createVectorizeConnector } from "@vectorize-io/vectorize-connect";

const config = {
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
  authorization: process.env.VECTORIZE_API_KEY!,
};

// Create Google Drive connector
const gdriveConnectorId = await createVectorizeConnector(
  config,
  "Team Google Drive",
  "GOOGLE_DRIVE_OAUTH_MULTI"
);

console.log('Google Drive connector created:', gdriveConnectorId);
```

### Dropbox Multi-User Connector

```typescript
import { createVectorizeConnector } from "@vectorize-io/vectorize-connect";

const config = {
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
  authorization: process.env.VECTORIZE_API_KEY!,
};

// Create Dropbox connector
const dropboxConnectorId = await createVectorizeConnector(
  config,
  "Team Dropbox Storage",
  "DROPBOX_OAUTH_MULTI"
);

console.log('Dropbox connector created:', dropboxConnectorId);
```

### Notion Multi-User Connector

```typescript
import { createVectorizeConnector } from "@vectorize-io/vectorize-connect";

const config = {
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
  authorization: process.env.VECTORIZE_API_KEY!,
};

// Create Notion connector
const notionConnectorId = await createVectorizeConnector(
  config,
  "Team Notion Workspace",
  "NOTION_OAUTH_MULTI"
);

console.log('Notion connector created:', notionConnectorId);
```

## Alternative: Using createSourceConnector

For more control over connector configuration:

```typescript
import { createSourceConnector } from '@vectorize-io/vectorize-connect';

// Google Drive with createSourceConnector
const gdriveConnectorId = await createSourceConnector(
  config,
  {
    name: "Team Google Drive",
    type: "GOOGLE_DRIVE_OAUTH_MULTI",
    config: {}
  }
);

// Dropbox with createSourceConnector
const dropboxConnectorId = await createSourceConnector(
  config,
  {
    name: "Team Dropbox Storage",
    type: "DROPBOX_OAUTH_MULTI",
    config: {}
  }
);

// Notion with createSourceConnector
const notionConnectorId = await createSourceConnector(
  config,
  {
    name: "Team Notion Workspace",
    type: "NOTION_OAUTH_MULTI",
    config: {}
  }
);
```

## Frontend Usage Examples

### Google Drive Connector Creation

```typescript
const handleCreateGoogleDriveConnector = async () => {
  try {
    const response = await fetch("/api/createConnector", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connectorName: "Team Google Drive",
        platformType: "GOOGLE_DRIVE_OAUTH_MULTI"
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create Google Drive connector');
    }
    
    const { connectorId } = await response.json();
    console.log('Google Drive connector created:', connectorId);
  } catch (error: any) {
    console.error('Error creating Google Drive connector:', error.message);
  }
};
```

### Dropbox Connector Creation

```typescript
const handleCreateDropboxConnector = async () => {
  try {
    const response = await fetch("/api/createConnector", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connectorName: "Team Dropbox Storage",
        platformType: "DROPBOX_OAUTH_MULTI"
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create Dropbox connector');
    }
    
    const { connectorId } = await response.json();
    console.log('Dropbox connector created:', connectorId);
  } catch (error: any) {
    console.error('Error creating Dropbox connector:', error.message);
  }
};
```

### Notion Connector Creation

```typescript
const handleCreateNotionConnector = async () => {
  try {
    const response = await fetch("/api/createConnector", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connectorName: "Team Notion Workspace",
        platformType: "NOTION_OAUTH_MULTI"
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create Notion connector');
    }
    
    const { connectorId } = await response.json();
    console.log('Notion connector created:', connectorId);
  } catch (error: any) {
    console.error('Error creating Notion connector:', error.message);
  }
};
```

### Dynamic Connector Creation

```typescript
const handleCreateConnector = async (platformType: string, connectorName: string) => {
  try {
    const response = await fetch("/api/createConnector", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connectorName,
        platformType
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create connector');
    }
    
    const { connectorId } = await response.json();
    console.log(`${platformType} connector created:`, connectorId);
    return connectorId;
  } catch (error: any) {
    console.error(`Error creating ${platformType} connector:`, error.message);
    throw error;
  }
};

// Usage examples
await handleCreateConnector("GOOGLE_DRIVE_OAUTH_MULTI", "Team Google Drive");
await handleCreateConnector("DROPBOX_OAUTH_MULTI", "Team Dropbox Storage");
await handleCreateConnector("NOTION_OAUTH_MULTI", "Team Notion Workspace");
```

## Error Handling

### Basic Error Handling

```typescript
try {
  const connectorId = await createVectorizeConnector(
    vectorizeConfig,
    "Team Google Drive",
    "GOOGLE_DRIVE_OAUTH_MULTI"
  );
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid Vectorize API token');
  } else if (error.response?.status === 403) {
    console.error('Insufficient permissions or plan limitations');
  } else {
    console.error('Connector creation failed:', error.message);
  }
}
```

### Platform-Specific Error Handling

```typescript
const createConnectorWithErrorHandling = async (
  platformType: string, 
  connectorName: string
) => {
  try {
    const connectorId = await createVectorizeConnector(
      vectorizeConfig,
      connectorName,
      platformType
    );
    
    console.log(`${platformType} connector created successfully:`, connectorId);
    return connectorId;
  } catch (error) {
    // Handle specific platform errors
    if (error.response?.status === 401) {
      throw new Error(`Invalid Vectorize API credentials for ${platformType}`);
    } else if (error.response?.status === 403) {
      throw new Error(`Insufficient permissions for ${platformType} connector creation`);
    } else if (error.response?.status === 400) {
      throw new Error(`Invalid configuration for ${platformType} connector`);
    } else {
      throw new Error(`Failed to create ${platformType} connector: ${error.message}`);
    }
  }
};

// Usage with error handling
try {
  await createConnectorWithErrorHandling("GOOGLE_DRIVE_OAUTH_MULTI", "Team Google Drive");
  await createConnectorWithErrorHandling("DROPBOX_OAUTH_MULTI", "Team Dropbox");
  await createConnectorWithErrorHandling("NOTION_OAUTH_MULTI", "Team Notion");
} catch (error) {
  console.error('Connector creation failed:', error.message);
}
```

## Next Steps

- [Authentication](../../authentication/vectorize/)
- [User Management](../../user-management/vectorize/)

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
import { 
  createVectorizeGDriveConnector,
  createVectorizeDropboxConnector,
  createVectorizeNotionConnector
} from "@vectorize-io/vectorize-connect";

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

    // Create the connector based on platform type
    let connectorId: string;
    
    switch (platformType) {
      case "GOOGLE_DRIVE_OAUTH_MULTI":
        connectorId = await createVectorizeGDriveConnector(config, connectorName);
        break;
      case "DROPBOX_OAUTH_MULTI":
        connectorId = await createVectorizeDropboxConnector(config, connectorName);
        break;
      case "NOTION_OAUTH_MULTI":
        connectorId = await createVectorizeNotionConnector(config, connectorName);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported platform type: ${platformType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ connectorId }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
```

## Connector Examples

### Google Drive Multi-User Connector

```typescript
import { createVectorizeGDriveConnector } from "@vectorize-io/vectorize-connect";

const config = {
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
  authorization: process.env.VECTORIZE_API_KEY!,
};

// Create Google Drive connector
const gdriveConnectorId = await createVectorizeGDriveConnector(
  config,
  "Team Google Drive"
);

console.log('Google Drive connector created:', gdriveConnectorId);
```

### Dropbox Multi-User Connector

```typescript
import { createVectorizeDropboxConnector } from "@vectorize-io/vectorize-connect";

const config = {
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
  authorization: process.env.VECTORIZE_API_KEY!,
};

// Create Dropbox connector
const dropboxConnectorId = await createVectorizeDropboxConnector(
  config,
  "Team Dropbox Storage"
);

console.log('Dropbox connector created:', dropboxConnectorId);
```

### Notion Multi-User Connector

```typescript
import { createVectorizeNotionConnector } from "@vectorize-io/vectorize-connect";

const config = {
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
  authorization: process.env.VECTORIZE_API_KEY!,
};

// Create Notion connector
const notionConnectorId = await createVectorizeNotionConnector(
  config,
  "Team Notion Workspace"
);

console.log('Notion connector created:', notionConnectorId);
```

## Alternative: Using createSourceConnector

For more control over connector configuration, you can use the generic `createSourceConnector` function for any platform:

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

// Notion with createVectorizeNotionConnector
const notionConnectorId = await createVectorizeNotionConnector(
  config,
  "Team Notion Workspace"
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
// Google Drive error handling
try {
  const connectorId = await createVectorizeGDriveConnector(
    vectorizeConfig,
    "Team Google Drive"
  );
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid Vectorize API token');
  } else if (error.response?.status === 403) {
    console.error('Insufficient permissions or plan limitations');
  } else {
    console.error('Google Drive connector creation failed:', error.message);
  }
}

// Dropbox error handling
try {
  const connectorId = await createVectorizeDropboxConnector(
    vectorizeConfig,
    "Team Dropbox Storage"
  );
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid Vectorize API token');
  } else if (error.response?.status === 403) {
    console.error('Insufficient permissions or plan limitations');
  } else {
    console.error('Dropbox connector creation failed:', error.message);
  }
}

// Notion error handling
try {
  const connectorId = await createVectorizeNotionConnector(
    vectorizeConfig,
    "Team Notion Workspace"
  );
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Invalid Vectorize API token');
  } else if (error.response?.status === 403) {
    console.error('Insufficient permissions or plan limitations');
  } else {
    console.error('Notion connector creation failed:', error.message);
  }
}
```

### Platform-Specific Error Handling

```typescript
const createGoogleDriveConnector = async (connectorName: string) => {
  try {
    const connectorId = await createVectorizeGDriveConnector(
      vectorizeConfig,
      connectorName
    );
    
    console.log('Google Drive connector created successfully:', connectorId);
    return connectorId;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid Vectorize API credentials for Google Drive');
    } else if (error.response?.status === 403) {
      throw new Error('Insufficient permissions for Google Drive connector creation');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid configuration for Google Drive connector');
    } else {
      throw new Error(`Failed to create Google Drive connector: ${error.message}`);
    }
  }
};

const createDropboxConnector = async (connectorName: string) => {
  try {
    const connectorId = await createVectorizeDropboxConnector(
      vectorizeConfig,
      connectorName
    );
    
    console.log('Dropbox connector created successfully:', connectorId);
    return connectorId;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid Vectorize API credentials for Dropbox');
    } else if (error.response?.status === 403) {
      throw new Error('Insufficient permissions for Dropbox connector creation');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid configuration for Dropbox connector');
    } else {
      throw new Error(`Failed to create Dropbox connector: ${error.message}`);
    }
  }
};

const createNotionConnector = async (connectorName: string) => {
  try {
    const connectorId = await createVectorizeNotionConnector(
      vectorizeConfig,
      connectorName
    );
    
    console.log('Notion connector created successfully:', connectorId);
    return connectorId;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid Vectorize API credentials for Notion');
    } else if (error.response?.status === 403) {
      throw new Error('Insufficient permissions for Notion connector creation');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid configuration for Notion connector');
    } else {
      throw new Error(`Failed to create Notion connector: ${error.message}`);
    }
  }
};

// Usage with error handling
try {
  await createGoogleDriveConnector("Team Google Drive");
  await createDropboxConnector("Team Dropbox Storage");
  await createNotionConnector("Team Notion Workspace");
} catch (error) {
  console.error('Connector creation failed:', error.message);
}
```

## Next Steps

- [Authentication](../../authentication/vectorize/)
- [User Management](../../user-management/vectorize/)

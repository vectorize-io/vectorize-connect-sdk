# Creating Connectors - Vectorize Approach

Create connectors using Vectorize's managed OAuth credentials for quick setup.

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
      connectorName
    );

    return NextResponse.json({ connectorId }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
```

## Alternative: Using createSourceConnector

For more control over connector configuration:

```typescript
import { createSourceConnector } from '@vectorize-io/vectorize-connect';

const connectorId = await createSourceConnector(
  config,
  {
    name: "My Platform Connector",
    type: "PLATFORM_OAUTH_MULTI",
    config: {}
  }
);
```

## Frontend Usage

```typescript
const handleCreateConnector = async () => {
  try {
    const response = await fetch("/api/createConnector", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connectorName: "My Team Storage Connector",
        platformType: "PLATFORM_OAUTH_MULTI"
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create connector');
    }
    
    const { connectorId } = await response.json();
    console.log('Connector created:', connectorId);
  } catch (error: any) {
    console.error('Error creating connector:', error.message);
  }
};
```

## Error Handling

```typescript
try {
  const connectorId = await createVectorizeConnector(
    vectorizeConfig,
    "My Connector"
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

## Next Steps

- [Authentication](../../authentication/vectorize/)
- [User Management](../../user-management/vectorize/)

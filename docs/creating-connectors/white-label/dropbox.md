# Creating Dropbox Connectors - White-Label Approach

Create Dropbox connectors using your own OAuth credentials.

## Prerequisites

- Dropbox App credentials (App Key, App Secret)
- Configured redirect URI in Dropbox Developer Console

## API Route Implementation

Create a file at `app/api/createDropboxConnector/route.ts`:

```typescript
// app/api/createDropboxConnector/route.ts
import { NextResponse } from "next/server";
import { createWhiteLabelDropboxConnector } from "@vectorize-io/vectorize-connect";

interface VectorizeAPIConfig {
  organizationId: string;
  authorization: string;
}

export async function POST(request: Request) {
  try {
    // Parse the incoming request
    const { connectorName } = await request.json();

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

    // Validate Dropbox credentials
    const appKey = process.env.DROPBOX_APP_KEY;
    const appSecret = process.env.DROPBOX_APP_SECRET;

    if (!appKey || !appSecret) {
      return NextResponse.json(
        { error: "Missing Dropbox credentials in environment" },
        { status: 500 }
      );
    }

    // Create the connector (White-Label)
    const connectorId = await createWhiteLabelDropboxConnector(
      config,
      connectorName,
      appKey,
      appSecret
    );

    return NextResponse.json({ connectorId }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
  }
}
```

## Frontend Usage

```typescript
const handleCreateConnector = async () => {
  try {
    const response = await fetch("/api/createDropboxConnector", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connectorName: "My Custom Dropbox Connector",
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create connector');
    }
    
    const { connectorId } = await response.json();
    console.log('Dropbox connector created:', connectorId);
  } catch (error: any) {
    console.error('Error creating connector:', error.message);
  }
};
```

## Next Steps

- [Dropbox Authentication](../../authentication/white-label/dropbox.md)
- [Dropbox User Management](../../user-management/white-label/dropbox.md)

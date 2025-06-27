# Creating Google Drive Connectors - White-Label Approach

Create Google Drive connectors using your own OAuth credentials.

## Prerequisites

- Google OAuth credentials (Client ID, Client Secret, API Key)
- Configured redirect URI in Google Cloud Console

## API Route Implementation

Create a file at `app/api/createGDriveConnector/route.ts`:

```typescript
// app/api/createGDriveConnector/route.ts
import { NextResponse } from "next/server";
import { createWhiteLabelGDriveConnector } from "@vectorize-io/vectorize-connect";

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

    // Validate Google OAuth credentials
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Missing Google OAuth credentials in environment" },
        { status: 500 }
      );
    }

    // Create the connector (White-Label)
    const connectorId = await createWhiteLabelGDriveConnector(
      config,
      connectorName,
      clientId,
      clientSecret
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
    const response = await fetch("/api/createGDriveConnector", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connectorName: "My Custom Google Drive Connector",
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create connector');
    }
    
    const { connectorId } = await response.json();
    console.log('Google Drive connector created:', connectorId);
  } catch (error: any) {
    console.error('Error creating connector:', error.message);
  }
};
```

## Next Steps

- [Google Drive Authentication](../../authentication/white-label/google-drive.md)
- [Google Drive User Management](../../user-management/white-label/google-drive.md)

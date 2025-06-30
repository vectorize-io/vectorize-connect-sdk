# Creating Connectors - White-Label Approach

Create connectors using your own OAuth credentials for full control over the user experience.

## Overview

White-label connectors allow you to use your own OAuth applications, providing:

- **Custom Branding**: Users stay within your application's branding
- **Full Control**: Complete control over the OAuth flow and user experience
- **Direct Integration**: No redirection to external platforms
- **Flexibility**: Ability to customize the authentication and file selection experience

## Platform-Specific Guides

- [Google Drive Connectors](./google-drive.md)
- [Dropbox Connectors](./dropbox.md)

## General Implementation Pattern

All white-label connectors follow a similar pattern:

### 1. Environment Setup
Configure both Vectorize and platform-specific credentials:

```env
# Vectorize credentials
VECTORIZE_API_KEY=your_vectorize_api_token
VECTORIZE_ORGANIZATION_ID=your_organization_id

# Platform-specific OAuth credentials
PLATFORM_OAUTH_CLIENT_ID=your_client_id
PLATFORM_OAUTH_CLIENT_SECRET=your_client_secret
```

### 2. Connector Creation API
Create an API route for connector creation:

```typescript
// app/api/createPlatformConnector/route.ts
import { NextResponse } from "next/server";
import { createWhiteLabelPlatformConnector } from "@vectorize-io/vectorize-connect";

export async function POST(request: Request) {
  try {
    const { connectorName } = await request.json();

    const config = {
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID ?? "",
      authorization: process.env.VECTORIZE_API_KEY ?? "",
    };

    const connectorId = await createWhiteLabelPlatformConnector(
      config,
      connectorName,
      process.env.PLATFORM_OAUTH_CLIENT_ID!,
      process.env.PLATFORM_OAUTH_CLIENT_SECRET!
    );

    return NextResponse.json({ connectorId }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 3. OAuth Callback Handling
Implement OAuth callback routes for each platform:

```typescript
// app/api/platform-callback/route.ts
import { NextRequest } from "next/server";
import { PlatformOAuth } from "@vectorize-io/vectorize-connect";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    const config = {
      clientId: process.env.PLATFORM_OAUTH_CLIENT_ID!,
      clientSecret: process.env.PLATFORM_OAUTH_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/platform-callback`
    };

    return PlatformOAuth.createCallbackResponse(
      code || '',
      config,
      error || undefined
    );
  } catch (error: any) {
    return new Response(`OAuth Error: ${error.message}`, { status: 500 });
  }
}
```

### 4. Frontend Implementation
Create components that handle the OAuth flow:

```typescript
'use client';

import { useState } from 'react';
import { PlatformOAuth } from '@vectorize-io/vectorize-connect';

export default function PlatformConnector() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      const config = {
        clientId: process.env.NEXT_PUBLIC_PLATFORM_OAUTH_CLIENT_ID!,
        redirectUri: `${window.location.origin}/api/platform-callback`,
        onSuccess: (response) => {
          // Handle successful authentication
          console.log('Authentication successful:', response);
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('Authentication failed:', error);
          setIsLoading(false);
        }
      };
      
      PlatformOAuth.startOAuth(config);
      
    } catch (error: any) {
      console.error('Failed to start OAuth:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleConnect}
        disabled={!connectorId || isLoading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        {isLoading ? "Connecting..." : "Connect to Platform"}
      </button>
    </div>
  );
}
```

## Advantages

1. **Brand Consistency**: Users never leave your application
2. **Customization**: Full control over UI/UX and authentication flow
3. **Security**: Direct control over OAuth credentials and token management
4. **Compliance**: Easier to meet specific security and compliance requirements

## Considerations

1. **Setup Complexity**: Requires setting up OAuth applications for each platform
2. **Maintenance**: Need to maintain OAuth credentials and handle updates
3. **Support**: Responsible for troubleshooting OAuth-related issues

## Platform-Specific Guides

For detailed implementation guides for specific platforms:

- [Google Drive White-Label Guide](./google-drive.md)
- [Dropbox White-Label Guide](./dropbox.md)
- [Notion White-Label Guide](./notion.md)

## Next Steps

Choose your platform and follow the specific implementation guide above, or continue with:

- [Authentication](../../authentication/white-label/)
- [User Management](../../user-management/white-label/)

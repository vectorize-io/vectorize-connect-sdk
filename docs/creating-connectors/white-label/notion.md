# Creating White-Label Notion Connectors

This guide covers creating Notion connectors using your own OAuth credentials for complete control over branding and user experience.

## Prerequisites

Before creating a White-Label Notion connector, you need:

1. **Notion Integration**: Create a Notion integration in your [Notion Developer Portal](https://www.notion.so/my-integrations)
2. **OAuth Credentials**: Obtain your Client ID and Client Secret from the integration settings
3. **Redirect URI**: Configure the redirect URI in your Notion integration settings

## Environment Setup

```bash
# Required environment variables
VECTORIZE_API_KEY=your_vectorize_api_key
VECTORIZE_ORGANIZATION_ID=your_organization_id

# Notion OAuth credentials
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
```

## Creating the Connector

### Using the SDK

```typescript
import { createWhiteLabelNotionConnector } from '@vectorize-io/vectorize-connect';

const config = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
};

const connectorId = await createWhiteLabelNotionConnector(
  config,
  "My Custom Notion Connector",
  process.env.NOTION_CLIENT_ID!,
  process.env.NOTION_CLIENT_SECRET!
);
```

### API Route Implementation

```typescript
// app/api/create-notion-connector/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createWhiteLabelNotionConnector } from '@vectorize-io/vectorize-connect';

export async function POST(request: NextRequest) {
  try {
    const { connectorName } = await request.json();

    const config = {
      authorization: process.env.VECTORIZE_API_KEY!,
      organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
    };

    const connectorId = await createWhiteLabelNotionConnector(
      config,
      connectorName,
      process.env.NOTION_CLIENT_ID!,
      process.env.NOTION_CLIENT_SECRET!
    );

    return NextResponse.json({ connectorId });
  } catch (error) {
    console.error('Error creating Notion connector:', error);
    return NextResponse.json(
      { error: 'Failed to create connector' },
      { status: 500 }
    );
  }
}
```

## User Management

### Adding Users

```typescript
import { manageNotionUser } from '@vectorize-io/vectorize-connect';

const selectedPages = {
  "page_id_1": {
    title: "Project Documentation",
    pageId: "page_id_1",
    parentType: "workspace"
  },
  "page_id_2": {
    title: "Meeting Notes",
    pageId: "page_id_2",
    parentType: "database"
  }
};

const response = await manageNotionUser(
  config,
  connectorId,
  selectedPages,
  notionAccessToken,
  userId,
  "add"
);
```

### Editing User Access

```typescript
const updatedPages = {
  "page_id_1": {
    title: "Updated Project Documentation",
    pageId: "page_id_1",
    parentType: "workspace"
  }
};

const response = await manageNotionUser(
  config,
  connectorId,
  updatedPages,
  notionAccessToken,
  userId,
  "edit"
);
```

### Removing Users

```typescript
const response = await manageNotionUser(
  config,
  connectorId,
  null, // No pages needed for removal
  "", // No access token needed for removal
  userId,
  "remove"
);
```

## OAuth Flow Implementation

### Frontend Component

```typescript
import { NotionOAuth } from '@vectorize-io/vectorize-connect';

function NotionConnector() {
  const handleConnect = async () => {
    const notionOAuth = new NotionOAuth({
      clientId: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID!,
      clientSecret: '', // Keep empty on frontend
      redirectUri: `${window.location.origin}/callback/notion`,
      scopes: ['read_content']
    });

    // Get one-time token for authentication
    const tokenResponse = await fetch('/api/get-one-time-connector-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user123',
        connectorId: connectorId
      })
    });

    const { token } = await tokenResponse.json();

    // Redirect to Notion OAuth
    notionOAuth.redirectToVectorizeConnect(token);
  };

  return (
    <button onClick={handleConnect}>
      Connect to Notion
    </button>
  );
}
```

### OAuth Callback Handler

```typescript
// app/callback/notion/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function NotionCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return;
    }

    if (code) {
      // Handle successful OAuth callback
      handleOAuthSuccess(code);
    }
  }, [searchParams]);

  const handleOAuthSuccess = async (code: string) => {
    try {
      // Exchange code for tokens and complete user setup
      const response = await fetch('/api/complete-notion-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (response.ok) {
        // Redirect to success page or close popup
        window.location.href = '/success';
      }
    } catch (error) {
      console.error('Error completing OAuth:', error);
    }
  };

  return <div>Processing Notion connection...</div>;
}
```

## Token Management

### Exchange Authorization Code

```typescript
import { exchangeNotionCodeForTokens } from '@vectorize-io/vectorize-connect';

const tokens = await exchangeNotionCodeForTokens(
  authorizationCode,
  process.env.NOTION_CLIENT_ID!,
  process.env.NOTION_CLIENT_SECRET!,
  redirectUri
);
```

### Validate Access Token

```typescript
import { refreshNotionToken } from '@vectorize-io/vectorize-connect';

const validatedToken = await refreshNotionToken(accessToken);
```

## Error Handling

### Common Error Scenarios

```typescript
try {
  const connectorId = await createWhiteLabelNotionConnector(
    config,
    connectorName,
    clientId,
    clientSecret
  );
} catch (error) {
  if (error.message.includes('Client ID and Client Secret are required')) {
    // Handle missing credentials
    console.error('OAuth credentials not configured');
  } else if (error.message.includes('500 Internal Server Error')) {
    // Handle API errors
    console.error('Server error creating connector');
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

### User Management Errors

```typescript
try {
  await manageNotionUser(config, connectorId, selectedPages, accessToken, userId, "add");
} catch (error) {
  if (error.message.includes('Selected pages are required')) {
    // Handle missing page selection
  } else if (error.message.includes('Access token is required')) {
    // Handle missing access token
  }
}
```

## Best Practices

1. **Secure Credential Storage**: Store OAuth credentials securely using environment variables
2. **Error Handling**: Implement comprehensive error handling for OAuth flows
3. **Token Validation**: Regularly validate access tokens before making API calls
4. **User Experience**: Provide clear feedback during the OAuth process
5. **Page Selection**: Allow users to select specific Notion pages they want to sync

## Next Steps

- [User Management Guide](../../user-management/white-label/)
- [Frontend Implementation](../../frontend-implementation/white-label/)
- [Testing Guide](../../testing/white-label/)

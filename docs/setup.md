# Setup Guide

This guide provides instructions for setting up the `@vectorize-io/vectorize-connect` package in your Next.js application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setting Up Google OAuth Credentials](#setting-up-google-oauth-credentials)
- [Configuring Next.js for OAuth Callbacks](#configuring-nextjs-for-oauth-callbacks)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, you'll need:

1. A Next.js application (version 14.0.0 or higher recommended)
2. A Vectorize account with API access
3. A Google Cloud Platform account

## Setting Up Google OAuth Credentials

> **Note:** This step is only required for white-label integration. If you're using the non-white-label approach, you can skip this section.

1. **Create a Google Cloud Platform Project**

   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Click on the project dropdown at the top of the page
   - Click "New Project"
   - Enter a name for your project and click "Create"

2. **Enable Required APIs**

   - In your new project, go to "APIs & Services" > "Library"
   - Search for and enable the following APIs:
     - Google Drive API
     - Google Picker API

3. **Create OAuth 2.0 Credentials**

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Enter a name for your OAuth client
   - Add authorized JavaScript origins:
     - For development: `http://localhost:3000` (or your local development URL)
     - For production: Your production domain(s)
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/api/google-callback` (or your callback path)
     - For production: Your production callback URL(s)
   - Click "Create"
   - Note your Client ID and Client Secret

4. **Create API Key**

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Note your API Key
   - (Optional but recommended) Restrict the API key to only the Google Drive API and Google Picker API

## Configuring Next.js for OAuth Callbacks

1. **Create OAuth Callback API Route**

   Create a file at `app/api/google-callback/route.ts`:

   ```typescript
   // app/api/google-callback/route.ts
   import { createGDrivePickerCallbackResponse } from '@vectorize-io/vectorize-connect';
   import { type NextRequest } from 'next/server';

   export async function GET(request: NextRequest) {
     const searchParams = request.nextUrl.searchParams;
     const code = searchParams.get('code');
     const error = searchParams.get('error');

     // Create config object with all required fields
     const config = {
       clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
       clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
       apiKey: process.env.GOOGLE_API_KEY!,
       redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/google-callback`
     };

     try {
       return createGDrivePickerCallbackResponse(
         code || '',
         config,
         error || undefined
       );
     } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
       return createGDrivePickerCallbackResponse(
         '',
         config,
         errorMessage
       );
     }
   }
   ```

2. **Create Connector API Route**

   Create a file at `app/api/createGDriveConnector/route.ts`:

   ```typescript
   // app/api/createGDriveConnector/route.ts
   import { NextResponse } from "next/server";
   import { createVectorizeGDriveConnector, createWhiteLabelGDriveConnector } from "@vectorize-io/vectorize-connect";

   interface VectorizeAPIConfig {
     organizationId: string;
     authorization: string;
   }

   export async function POST(request: Request) {
     try {
      const { whiteLabel, connectorName, platformUrl, clientId, clientSecret } = await request.json();

      const config: VectorizeAPIConfig = {
        organizationId: process.env.VECTORIZE_ORG ?? "",
        authorization: process.env.VECTORIZE_TOKEN ?? "",
      };

      if (!config.organizationId || !config.authorization) {
        return NextResponse.json(
          { error: "Missing Vectorize credentials in environment" },
          { status: 500 }
        );
      }

      let connectorId: string;
      
      if (whiteLabel) {
        if (!clientId || !clientSecret) {
          return NextResponse.json(
            { error: "Client ID and Client Secret are required for white label connectors" },
            { status: 400 }
          );
        }
        
        connectorId = await createWhiteLabelGDriveConnector(
          config,
          connectorName,
          clientId,
          clientSecret,
          platformUrl
        );
      } else {
        connectorId = await createVectorizeGDriveConnector(
          config,
          connectorName,
          platformUrl
        );
      }

       return NextResponse.json(connectorId, { status: 200 });
     } catch (error: any) {
       return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 });
     }
   }
   ```

3. **Create User Management API Route**

   Create a file at `app/api/add-google-drive-user/[connectorId]/route.ts`:

   ```typescript
   // app/api/add-google-drive-user/[connectorId]/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { manageGDriveUser } from '@vectorize-io/vectorize-connect';

   interface VectorizeAPIConfig {
     organizationId: string;
     authorization: string;
   }

   export async function POST(request: NextRequest) {
     try {
       const url = new URL(request.url);
       const segments = url.pathname.split('/');
       const connectorId = segments[segments.length - 1];

       const config: VectorizeAPIConfig = {
         organizationId: process.env.VECTORIZE_ORG ?? "",
         authorization: process.env.VECTORIZE_TOKEN ?? "",
       };

       const body = await request.json();
       if (!body) {
         throw new Error('Request body is required');
       }

       let selectionData = null;
       if (body.status === 'success') {
         selectionData = body.selection;
       }

       const response = await manageGDriveUser(
         config,
         connectorId,
         selectionData.selectedFiles, // Record of selected files with metadata
         selectionData.refreshToken,
         "user123", // Replace with actual user ID
         "add",
         process.env.VECTORIZE_API_URL || "https://api.vectorize.io/v1"
       );

       return NextResponse.json({ success: true }, { status: 200 });
     } catch (error: any) {
       console.error('Error adding Google Drive user:', error);
       return NextResponse.json({ error: error.message || 'Failed to add user' }, { status: 500 });
     }
   }
   ```

## Environment Variables

Create a `.env.local` file in the root of your Next.js project with the following variables:

### For White-label Integration

```env
# Google OAuth credentials (required for white-label integration)
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_API_KEY=your-api-key

# Make these available to the client-side code
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your-client-id
NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key

# Vectorize credentials
VECTORIZE_ORG=your-organization-id
VECTORIZE_TOKEN=your-api-key

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### For Non-white-label Integration

```env
# Vectorize credentials
VECTORIZE_ORG=your-organization-id
VECTORIZE_TOKEN=your-api-key

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Installation

1. **Install the Package**

   ```bash
   npm install @vectorize-io/vectorize-connect
   ```

   Or with yarn:

   ```bash
   yarn add @vectorize-io/vectorize-connect
   ```

   Or with pnpm:

   ```bash
   pnpm add @vectorize-io/vectorize-connect
   ```

2. **Add as a Peer Dependency**

   The package requires Next.js as a peer dependency. Make sure you have Next.js installed:

   ```bash
   npm install next@^14.0.0
   ```

## Next Steps

Now that you've set up the package, you can:

1. Implement the frontend components for Google Drive integration
2. Create connectors using the Vectorize API
3. Manage users and their file selections

For detailed implementation guides, see:

- [White-label Integration Guide](./white-label-guide.md)
- [Non-white-label Integration Guide](./non-white-label-guide.md)
- [API Reference](./API.md)

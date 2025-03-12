# @vectorize-io/vectorize-connect

A TypeScript package for Google Drive OAuth authorization and file selection, designed to work with Vectorize connectors.

[![npm version](https://img.shields.io/npm/v/@vectorize-io/vectorize-connect.svg)](https://www.npmjs.com/package/@vectorize-io/vectorize-connect)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

The `@vectorize-io/vectorize-connect` package provides a simple way to integrate Google Drive authorization and file selection into your applications. It supports two main integration approaches:

1. **White-label integration**: Use your own Google OAuth credentials to create a fully customized experience.
2. **Non-white-label integration**: Leverage Vectorize's platform for a simpler integration process.

This package is specifically designed to work with Vectorize connectors, allowing you to easily ingest selected Google Drive files into your Vectorize data pipeline.

## Installation

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

## Prerequisites

- A Vectorize account with API access
- Google Cloud Platform project with OAuth 2.0 credentials (for white-label integration)
- Next.js application (the package is designed to work with Next.js)

## Basic Usage

### White-label Integration (Using Your Own Google OAuth Credentials)

```typescript
import { startGDriveOAuth } from '@vectorize-io/vectorize-connect';

// Configure with your Google OAuth credentials
const config = {
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  apiKey: process.env.GOOGLE_API_KEY!,
  redirectUri: `${window.location.origin}/api/google-callback`
};

// Start the OAuth flow
const popup = startGDriveOAuth({
  ...config,
  onSuccess: (selection) => {
    // Handle the selected files and refresh token
    const { fileIds, refreshToken } = selection;
    console.log('Selected files:', fileIds);
    console.log('Refresh token:', refreshToken);
    
    // Send to your backend to manage the Google Drive user
  },
  onError: (error) => {
    console.error('OAuth error:', error.message);
  }
});
```

### Non-white-label Integration (Using Vectorize's Platform)

```typescript
import { redirectToVectorizeGoogleDriveConnect } from '@vectorize-io/vectorize-connect';

// Create a callback URL for your server API
const callbackUrl = `${window.location.origin}/api/add-google-drive-user/${connectorId}`;

// Redirect to Vectorize's Google Drive connect page
await redirectToVectorizeGoogleDriveConnect(
  callbackUrl,
  'https://platform.vectorize.io' // Or your environment-specific platform URL
);
```

## Documentation

For detailed documentation, please refer to the following guides:

- [API Reference](./docs/API.md)
- [White-label Integration Guide](./docs/white-label-guide.md)
- [Non-white-label Integration Guide](./docs/non-white-label-guide.md)
- [TypeScript Definitions](./docs/types.md)
- [Setup Guide](./docs/setup.md)

## Example Project

For a complete example of how to use this package, check out the [test-vectorize-connect-sdk](https://github.com/vectorize-io/test-vectorize-connect-sdk) repository.

## License

MIT

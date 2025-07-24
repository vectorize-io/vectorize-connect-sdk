# Vectorize Connect SDK

TypeScript/JavaScript SDK for building multi-user connectors that integrate cloud storage platforms such as Google Drive with the Vectorize platform.

## What is this?

The Vectorize Connect SDK enables you to:
- Build applications where multiple users can connect their cloud storage accounts
- Let users select specific files to be processed by Vectorize RAG pipelines
- Manage user authentication and file permissions
- Handle OAuth flows without building the authentication infrastructure yourself

This SDK is designed for developers who want to integrate multiple users' documents into their AI-powered applications using Vectorize's infrastructure.

## SDK Installation

### NPM
```bash
npm install @vectorize-io/vectorize-connect
```

### Yarn
```bash
yarn add @vectorize-io/vectorize-connect
```

### pnpm
```bash
pnpm add @vectorize-io/vectorize-connect
```

## Quick Start

### 1. Install the SDK
```bash
npm install @vectorize-io/vectorize-connect
```

### 2. Set up your environment
```typescript
import { createGDriveConnector } from '@vectorize-io/vectorize-connect';

const vectorizeConfig = {
  organizationId: 'your-org-id',
  authorization: 'your-api-key'
};
```

### 3. Create a connector and add users
```typescript
// Create a connector
const connector = await createGDriveConnector({
  connectorName: 'My Google Drive Connector',
  config: vectorizeConfig
});

// Add users via OAuth
const authUrl = await getGDriveAuthURL({
  connectorId: connector.id,
  redirectUri: 'https://your-app.com/callback',
  config: vectorizeConfig
});
```

## Documentation

For comprehensive guides and examples:

- [Multi-User Connectors Overview](https://docs.vectorize.io/developer-guides/multi-user-connectors) - Understanding connector types
- [Vectorize-Managed OAuth Guide](https://docs.vectorize.io/developer-guides/multi-user-connectors/vectorize-managed-oauth) - Quick setup using Vectorize's OAuth
- [White-Label OAuth Guide](https://docs.vectorize.io/developer-guides/multi-user-connectors/white-labeled-oauth) - Using your own OAuth apps

### SDK-Specific Documentation

- [API Reference](https://github.com/vectorize-io/vectorize-connect-sdk/blob/main/docs/API.md) - Complete API documentation
- [General Guide](https://github.com/vectorize-io/vectorize-connect-sdk/blob/main/docs/general-guide.md) - SDK concepts and patterns
- [TypeScript Definitions](https://github.com/vectorize-io/vectorize-connect-sdk/blob/main/docs/types.md) - Type definitions

### Implementation Examples

- [Environment Setup](https://github.com/vectorize-io/vectorize-connect-sdk/tree/main/docs/environment-setup)
- [Creating Connectors](https://github.com/vectorize-io/vectorize-connect-sdk/tree/main/docs/creating-connectors)
- [Authentication Flows](https://github.com/vectorize-io/vectorize-connect-sdk/tree/main/docs/authentication)
- [User Management](https://github.com/vectorize-io/vectorize-connect-sdk/tree/main/docs/user-management)
- [Frontend Integration](https://github.com/vectorize-io/vectorize-connect-sdk/tree/main/docs/frontend-implementation)
- [Testing](https://github.com/vectorize-io/vectorize-connect-sdk/tree/main/docs/testing)

## Supported Platforms

### Google Drive
- [Google Drive Overview](https://docs.vectorize.io/integrations/source-connectors/google-drive)
- [Multi-User Setup (Vectorize)](https://docs.vectorize.io/integrations/source-connectors/google-drive/multi-user-vectorize)
- [Multi-User Setup (White-Label)](https://docs.vectorize.io/integrations/source-connectors/google-drive/multi-user-white-label)

### Dropbox
- [Dropbox Overview](https://docs.vectorize.io/integrations/source-connectors/dropbox)
- [Multi-User Setup (Vectorize)](https://docs.vectorize.io/integrations/source-connectors/dropbox/multi-user-vectorize)
- [Multi-User Setup (White-Label)](https://docs.vectorize.io/integrations/source-connectors/dropbox/multi-user-white-label)

### Notion
- [OAuth Setup](https://docs.vectorize.io/integrations/source-connectors/notion)

## Two Approaches: Vectorize-Managed vs White-Label

### Vectorize-Managed OAuth (Recommended for Getting Started)
- Uses Vectorize's pre-configured OAuth apps
- No OAuth app setup required
- Fastest way to get started
- Available on Starter plan and above

### White-Label OAuth (For Production Apps)
- Use your own OAuth applications
- Full control over branding and authentication flow
- Required for production applications with custom branding
- Available on Pro plan and above


## Core Features

### OAuth Authentication
- Handle complex OAuth flows for Google Drive, Dropbox, and Notion
- Support for both Vectorize-managed and white-label OAuth approaches
- Automatic token management and refresh

### File Selection
- Interactive file picker UI components
- Granular file and folder selection
- Support for file type filtering

### User Management
- Add multiple users to a single connector
- Update user file selections
- Remove users and their associated data

### Connector Management
- Create and configure connectors programmatically
- Monitor connector status
- Handle connector lifecycle

## Example: Building a Team Knowledge Base

```typescript
import { 
  createGDriveConnector, 
  getGDriveAuthURL, 
  selectGDriveFiles 
} from '@vectorize-io/vectorize-connect';

// 1. Create a connector for your team
const connector = await createGDriveConnector({
  connectorName: 'Team Knowledge Base',
  config: {
    organizationId: process.env.VECTORIZE_ORG_ID,
    authorization: process.env.VECTORIZE_API_KEY
  }
});

// 2. Each team member authorizes access
app.get('/connect-drive', async (req, res) => {
  const authUrl = await getGDriveAuthURL({
    connectorId: connector.id,
    redirectUri: 'https://your-app.com/oauth/callback',
    config: vectorizeConfig
  });
  res.redirect(authUrl);
});

// 3. Let users select which files to include
app.post('/select-files', async (req, res) => {
  await selectGDriveFiles({
    connectorId: connector.id,
    selectedFiles: req.body.files,
    config: vectorizeConfig
  });
});
```

## Requirements

- Node.js 16+ or modern browsers
- TypeScript 4.7+ (optional, for TypeScript projects)
- A Vectorize account with API credentials

## Resources

### Getting Help
- [Vectorize Documentation](https://docs.vectorize.io)
- [GitHub Issues](https://github.com/vectorize-io/vectorize-connect-sdk/issues)
- [Example Implementation](https://github.com/vectorize-io/test-vectorize-connect-sdk)

### Related Documentation
- [RAG Pipelines Overview](https://docs.vectorize.io/rag-pipelines/understanding)
- [Source Connectors Guide](https://docs.vectorize.io/integrations/source-connectors)
- [Vectorize Platform Overview](https://docs.vectorize.io/concepts/vectorize-architecture)


## License

This project is licensed under the MIT License - see the LICENSE file for details.

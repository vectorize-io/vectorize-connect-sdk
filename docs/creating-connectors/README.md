# Creating Connectors

This section covers how to create connectors using different approaches.

## Approaches

- **[Vectorize](./vectorize/)** - Create connectors using Vectorize's managed OAuth credentials
- **[White-Label](./white-label/)** - Create connectors using your own OAuth credentials

## Overview

Connectors are the foundation of your integration. They define how users will authenticate and which files they can access from their cloud storage accounts.

### Vectorize Approach
- Uses Vectorize's pre-configured OAuth applications
- Simpler setup with fewer credentials to manage
- Consistent experience across all platforms

### White-Label Approach  
- Uses your own OAuth applications
- Full control over branding and user experience
- Requires setting up OAuth apps for each platform

## Quick Reference

### Vectorize Connector Creation
```typescript
// For Google Drive
import { createVectorizeGDriveConnector } from '@vectorize-io/vectorize-connect';
const gdriveConnectorId = await createVectorizeGDriveConnector(
  vectorizeConfig,
  "My Google Drive Connector"
);

// For Dropbox
import { createVectorizeDropboxConnector } from '@vectorize-io/vectorize-connect';
const dropboxConnectorId = await createVectorizeDropboxConnector(
  vectorizeConfig,
  "My Dropbox Connector"
);

// For Notion
import { createVectorizeNotionConnector } from '@vectorize-io/vectorize-connect';
const notionConnectorId = await createVectorizeNotionConnector(
  vectorizeConfig,
  "My Notion Connector"
);
```

### White-Label Connector Creation
```typescript
// For Google Drive
import { createWhiteLabelGDriveConnector } from '@vectorize-io/vectorize-connect';
const gdriveConnectorId = await createWhiteLabelGDriveConnector(
  vectorizeConfig,
  "My Custom Google Drive Connector",
  googleClientId,
  googleClientSecret
);

// For Dropbox
import { createWhiteLabelDropboxConnector } from '@vectorize-io/vectorize-connect';
const dropboxConnectorId = await createWhiteLabelDropboxConnector(
  vectorizeConfig,
  "My Custom Dropbox Connector",
  dropboxAppKey,
  dropboxAppSecret
);

// For Notion
import { createWhiteLabelNotionConnector } from '@vectorize-io/vectorize-connect';
const notionConnectorId = await createWhiteLabelNotionConnector(
  vectorizeConfig,
  "My Custom Notion Connector",
  notionClientId,
  notionClientSecret
);
```

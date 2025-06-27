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
import { createVectorizeConnector } from '@vectorize-io/vectorize-connect';

const connectorId = await createVectorizeConnector(
  vectorizeConfig,
  "My Connector"
);
```

### White-Label Connector Creation
```typescript
import { createWhiteLabelConnector } from '@vectorize-io/vectorize-connect';

const connectorId = await createWhiteLabelConnector(
  vectorizeConfig,
  "My Custom Connector",
  platformClientId,
  platformClientSecret
);
```

# Vectorize Connect SDK - General Guide

## Overview

The Vectorize Connect SDK provides a set of tools to integrate with various cloud storage platforms, enabling seamless connection between your application and Vectorize's platform. This guide covers the general concepts and usage patterns for the SDK.

## Installation

```bash
npm install @vectorize-io/vectorize-connect
```

## Authentication

All interactions with the Vectorize API require authentication using a Vectorize token. You'll need to provide this token in your API requests:

```typescript
const config = {
  authorization: 'Bearer your-token', // Use VECTORIZE_API_KEY environment variable
  organizationId: 'your-org-id'
};
```

## Connection Types

The SDK supports two main connection types:

1. **White-Label Integration**: Your application handles the OAuth flow and user interface, with Vectorize providing the backend services.

2. **Non-White-Label Integration**: Vectorize handles the OAuth flow and user interface, with your application integrating with the Vectorize platform.

## Common Configuration

### VectorizeAPIConfig

Most functions in the SDK require a `VectorizeAPIConfig` object:

```typescript
interface VectorizeAPIConfig {
  authorization: string; // Bearer token for authentication - use VECTORIZE_API_KEY env var
  organizationId: string; // Your Vectorize organization ID - use VECTORIZE_ORGANIZATION_ID env var
}
```

## Error Handling

All SDK functions return Promises that may reject with errors. Always implement proper error handling:

```typescript
try {
  // SDK function call
} catch (error) {
  console.error('Operation failed:', error);
  // Handle the error appropriately
}
```

## Connector Management

Connectors are the bridge between your application and data sources. The SDK provides functions to create and manage connectors:

```typescript
// Create a connector
const connectorId = await createConnector(config, connectorName);

// Manage users for a connector
await manageUser(config, connectorId, userId);
```

## Next Steps

For specific platform integrations, refer to the step-based documentation structure:

### Step-by-Step Implementation Guides

#### Vectorize Approach (Managed OAuth)
- [Environment Setup](./environment-setup/vectorize/README.md)
- [Creating Connectors](./creating-connectors/vectorize/README.md)
- [Authentication](./authentication/vectorize/README.md)
- [User Management](./user-management/vectorize/README.md)
- [Frontend Implementation](./frontend-implementation/vectorize/README.md)
- [Testing](./testing/vectorize/README.md)

#### White-Label Approach (Custom OAuth)
- [Environment Setup](./environment-setup/white-label/README.md)
- [Creating Connectors](./creating-connectors/white-label/README.md)
- [Authentication](./authentication/white-label/README.md)
- [User Management](./user-management/white-label/README.md)
- [Frontend Implementation](./frontend-implementation/white-label/README.md)
- [Testing](./testing/white-label/README.md)

### Legacy Platform-Specific Guides (Deprecated)
- [Google Drive Integration](./google-drive/) - Use step-based guides instead
- [Dropbox Integration](./dropbox/) - Use step-based guides instead
- [Setup Guide](./setup.md)

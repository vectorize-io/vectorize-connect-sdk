# Vectorize Connect SDK

TypeScript/JavaScript SDK for connecting different platforms such as Google Drive and Dropbox to the Vectorize platform.

This is a lightweight client that provides functionality for OAuth authentication and Vectorize API integration. The SDK helps you create connectors to various platforms, let users select files, and manage those connections through the Vectorize platform.

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

## Documentation

For detailed documentation, please refer to:

- [General Guide](./docs/general-guide.md) - Overview and common concepts
- [Google Drive Integration](./docs/google-drive/) - Google Drive specific integration
- [Dropbox Integration](./docs/dropbox/) - Dropbox specific integration
- [API Reference](./docs/API.md) - Complete API documentation
- [White-Label Integration](./docs/google-drive/white-label-guide.md) - White-label integration
- [Vectorize Integration](./docs/google-drive/vectorize-guide.md) - Vectorize integration
- [Setup Guide](./docs/setup.md) - Setup instructions

## SDK Example Usage

### For Google Drive Integration

For detailed information and examples on Google Drive integration, please refer to the [Google Drive Integration](./docs/google-drive/) guides.

### For Dropbox Integration

For detailed information and examples on Dropbox integration, please refer to the [Dropbox Integration](./docs/dropbox/) guides.


## API Reference

For detailed API documentation, please refer to the [API Reference](./docs/API.md) which includes:

- OAuth functions for Google Drive and Dropbox
- File selection functions
- Connector management functions
- User management functions
- Token utilities
- Configuration types

## Configuration

### `VectorizeAPIConfig`

| Property | Type | Description |
|----------|------|-------------|
| `organizationId` | `string` | Your Vectorize organization ID |
| `authorization` | `string` | Your Vectorize API key |

## Requirements

- This SDK is compatible with Node.js environments and modern browsers
- TypeScript 4.7+ for type definitions
- Next.js 14.0.0+ for server components (optional)

## Summary

The Vectorize Connect SDK provides:

- OAuth authentication for Google Drive and Dropbox
- File selection functionality
- Token management for platform APIs
- Vectorize API integration for connectors
- User management capabilities

## Detailed Documentation

For more detailed documentation, please refer to the following guides:

- [API Reference](./docs/API.md)
- [Google Drive White-Label Guide](./docs/google-drive/white-label-guide.md)
- [Google Drive Vectorize Guide](./docs/google-drive/vectorize-guide.md)
- [Dropbox White-Label Guide](./docs/dropbox/white-label-guide.md)
- [Dropbox Vectorize Guide](./docs/dropbox/vectorize-guide.md)
- [TypeScript Definitions](./docs/types.md)
- [Setup Guide](./docs/setup.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Environment Setup

This section covers how to configure environment variables for different connector approaches.

## Approaches

- **[Vectorize](./vectorize/)** - Using Vectorize's managed OAuth credentials
- **[White-Label](./white-label/)** - Using your own OAuth credentials

## Quick Reference

### Vectorize Approach
```env
VECTORIZE_API_KEY=your_vectorize_api_token
VECTORIZE_ORGANIZATION_ID=your_organization_id
```

### White-Label Approach
```env
# Vectorize credentials
VECTORIZE_API_KEY=your_vectorize_api_token
VECTORIZE_ORGANIZATION_ID=your_organization_id

# Platform-specific OAuth credentials
PLATFORM_OAUTH_CLIENT_ID=your_client_id
PLATFORM_OAUTH_CLIENT_SECRET=your_client_secret
PLATFORM_API_KEY=your_api_key  # If required by platform
```

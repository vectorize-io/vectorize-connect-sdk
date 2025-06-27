# Environment Setup - Vectorize Approach

When using Vectorize's managed OAuth credentials, you only need to configure your Vectorize API credentials.

## Required Environment Variables

Add the following environment variables to your Next.js application:

```env
# Vectorize credentials
VECTORIZE_API_KEY=your_vectorize_api_token
VECTORIZE_ORGANIZATION_ID=your_organization_id
```

## Getting Your Credentials

1. Log in to your Vectorize account
2. Navigate to your organization settings
3. Generate an API key if you haven't already
4. Note your organization ID from the URL or settings page

## Validation

You can validate your environment variables in your application:

```typescript
const config = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
};

if (!config.authorization || !config.organizationId) {
  throw new Error('Missing required Vectorize credentials');
}
```

## Next Steps

- [Creating Connectors](../../creating-connectors/vectorize/)
- [Authentication](../../authentication/vectorize/)

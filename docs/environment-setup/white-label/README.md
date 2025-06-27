# Environment Setup - White-Label Approach

When using your own OAuth credentials, you need to configure both Vectorize API credentials and platform-specific OAuth credentials.

## Required Environment Variables

Add the following environment variables to your Next.js application:

```env
# Vectorize credentials
VECTORIZE_API_KEY=your_vectorize_api_token
VECTORIZE_ORGANIZATION_ID=your_organization_id

# Platform-specific OAuth credentials (example for Google Drive)
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
GOOGLE_API_KEY=your_google_api_key

# Platform-specific OAuth credentials (example for Dropbox)
DROPBOX_APP_KEY=your_dropbox_app_key
DROPBOX_APP_SECRET=your_dropbox_app_secret
```

## Platform-Specific Setup

### Google Drive
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Configure the OAuth consent screen
5. Create OAuth 2.0 credentials (Web application type)
6. Add your redirect URI (e.g., `https://your-app.com/api/oauth/callback`)
7. Create an API key for the Google Picker API

### Dropbox
1. Go to the [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
3. Choose "Scoped access" for API
4. Choose "Full Dropbox" or "App folder" access depending on your needs
5. Name your app
6. Under "OAuth 2", add your redirect URI (e.g., `https://your-app.com/api/dropbox-callback`)
7. Note your App Key and App Secret

## Validation

```typescript
const vectorizeConfig = {
  authorization: process.env.VECTORIZE_API_KEY!,
  organizationId: process.env.VECTORIZE_ORGANIZATION_ID!,
};

// Platform-specific validation
const googleConfig = {
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  apiKey: process.env.GOOGLE_API_KEY!,
};

if (!vectorizeConfig.authorization || !vectorizeConfig.organizationId) {
  throw new Error('Missing required Vectorize credentials');
}

if (!googleConfig.clientId || !googleConfig.clientSecret || !googleConfig.apiKey) {
  throw new Error('Missing required Google OAuth credentials');
}
```

## Next Steps

- [Creating Connectors](../../creating-connectors/white-label/)
- [Authentication](../../authentication/white-label/)

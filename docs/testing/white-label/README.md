# Testing - White-Label Approach

Testing strategies for white-label connectors with custom OAuth flows.

## Test Environment Setup

```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';

// Mock environment variables
process.env.VECTORIZE_API_KEY = 'test-api-key';
process.env.VECTORIZE_ORGANIZATION_ID = 'test-org-id';
process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_API_KEY = 'test-google-api-key';
process.env.DROPBOX_APP_KEY = 'test-dropbox-app-key';
process.env.DROPBOX_APP_SECRET = 'test-dropbox-app-secret';
```

## Unit Tests

### Testing Google Drive Connector Creation

```typescript
// __tests__/google-drive.test.ts
import { createWhiteLabelGDriveConnector } from '@vectorize-io/vectorize-connect';

describe('Google Drive White-Label Connector', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should create a Google Drive connector successfully', async () => {
    const connectorId = await createWhiteLabelGDriveConnector(
      mockConfig,
      'Test Google Drive Connector',
      'test-client-id',
      'test-client-secret'
    );
    
    expect(connectorId).toBeDefined();
    expect(typeof connectorId).toBe('string');
  });

  it('should handle missing OAuth credentials', async () => {
    await expect(
      createWhiteLabelGDriveConnector(
        mockConfig,
        'Test Connector',
        '',
        ''
      )
    ).rejects.toThrow();
  });
});
```

### Testing Dropbox Connector Creation

```typescript
// __tests__/dropbox.test.ts
import { createWhiteLabelDropboxConnector } from '@vectorize-io/vectorize-connect';

describe('Dropbox White-Label Connector', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should create a Dropbox connector successfully', async () => {
    const connectorId = await createWhiteLabelDropboxConnector(
      mockConfig,
      'Test Dropbox Connector',
      'test-app-key',
      'test-app-secret'
    );
    
    expect(connectorId).toBeDefined();
    expect(typeof connectorId).toBe('string');
  });
});
```

## OAuth Flow Tests

### Testing Google Drive OAuth

```typescript
// __tests__/oauth/google-drive.test.ts
import { GoogleDriveOAuth } from '@vectorize-io/vectorize-connect';

// Mock window.open for popup testing
global.open = jest.fn();

describe('Google Drive OAuth Flow', () => {
  const mockConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    apiKey: 'test-api-key',
    redirectUri: 'http://localhost:3000/api/oauth/callback',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    onSuccess: jest.fn(),
    onError: jest.fn(),
  };

  it('should start OAuth flow', () => {
    GoogleDriveOAuth.startOAuth(mockConfig);
    
    expect(global.open).toHaveBeenCalled();
  });

  it('should handle OAuth success', () => {
    const mockResponse = {
      fileIds: ['file1', 'file2'],
      refreshToken: 'test-refresh-token',
    };

    mockConfig.onSuccess(mockResponse);
    
    expect(mockConfig.onSuccess).toHaveBeenCalledWith(mockResponse);
  });

  it('should handle OAuth error', () => {
    const mockError = new Error('OAuth failed');

    mockConfig.onError(mockError);
    
    expect(mockConfig.onError).toHaveBeenCalledWith(mockError);
  });
});
```

### Testing Dropbox OAuth

```typescript
// __tests__/oauth/dropbox.test.ts
import { DropboxOAuth } from '@vectorize-io/vectorize-connect';

describe('Dropbox OAuth Flow', () => {
  const mockConfig = {
    appKey: 'test-app-key',
    appSecret: 'test-app-secret',
    redirectUri: 'http://localhost:3000/api/dropbox-callback',
    scopes: ['files.metadata.read', 'files.content.read'],
    onSuccess: jest.fn(),
    onError: jest.fn(),
  };

  it('should start OAuth flow', () => {
    DropboxOAuth.startOAuth(mockConfig);
    
    expect(global.open).toHaveBeenCalled();
  });
});
```

## Integration Tests

### Testing Complete Google Drive Flow

```typescript
// __tests__/integration/google-drive.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GoogleDriveConnector from '../components/GoogleDriveConnector';

jest.mock('@vectorize-io/vectorize-connect', () => ({
  createWhiteLabelGDriveConnector: jest.fn().mockResolvedValue('test-connector-id'),
  GoogleDriveOAuth: {
    startOAuth: jest.fn(),
  },
}));

describe('GoogleDriveConnector Integration', () => {
  it('should complete the full connector flow', async () => {
    render(<GoogleDriveConnector />);
    
    // Create connector
    const createButton = screen.getByText('Create Connector');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connector Created')).toBeInTheDocument();
    });
    
    // Start OAuth flow
    const connectButton = screen.getByText('Connect with Google Drive');
    fireEvent.click(connectButton);
    
    expect(require('@vectorize-io/vectorize-connect').GoogleDriveOAuth.startOAuth).toHaveBeenCalled();
  });
});
```

## API Route Tests

### Testing Google Drive Connector API

```typescript
// __tests__/api/google-drive.test.ts
import { POST } from '../../app/api/createGDriveConnector/route';
import { NextRequest } from 'next/server';

describe('/api/createGDriveConnector', () => {
  it('should create a Google Drive connector successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/createGDriveConnector', {
      method: 'POST',
      body: JSON.stringify({
        connectorName: 'Test Google Drive Connector',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.connectorId).toBeDefined();
  });

  it('should handle missing environment variables', async () => {
    // Temporarily remove environment variables
    const originalClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;

    const request = new NextRequest('http://localhost:3000/api/createGDriveConnector', {
      method: 'POST',
      body: JSON.stringify({
        connectorName: 'Test Connector',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Missing Google OAuth credentials');

    // Restore environment variable
    process.env.GOOGLE_OAUTH_CLIENT_ID = originalClientId;
  });
});
```

### Testing OAuth Callback API

```typescript
// __tests__/api/oauth-callback.test.ts
import { GET } from '../../app/api/oauth/callback/route';
import { NextRequest } from 'next/server';

describe('/api/oauth/callback', () => {
  it('should handle successful OAuth callback', async () => {
    const url = new URL('http://localhost:3000/api/oauth/callback');
    url.searchParams.set('code', 'test-auth-code');

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('should handle OAuth error callback', async () => {
    const url = new URL('http://localhost:3000/api/oauth/callback');
    url.searchParams.set('error', 'access_denied');

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
```

## User Management Tests

### Testing Google Drive User Management

```typescript
// __tests__/user-management/google-drive.test.ts
import { manageGDriveUser } from '@vectorize-io/vectorize-connect';

describe('Google Drive User Management', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should add user successfully', async () => {
    const result = await manageGDriveUser(
      mockConfig,
      'connector123',
      ['file1', 'file2'],
      'refresh-token',
      'user123',
      'add'
    );

    expect(result).toBeDefined();
  });

  it('should remove user successfully', async () => {
    const result = await manageGDriveUser(
      mockConfig,
      'connector123',
      [],
      '',
      'user123',
      'remove'
    );

    expect(result).toBeDefined();
  });
});
```

## Manual Testing Checklist

### Google Drive Integration
- [ ] Create Google Drive connector with valid OAuth credentials
- [ ] Start OAuth flow and complete authentication
- [ ] Select files using Google Picker
- [ ] Verify files are processed by Vectorize
- [ ] Test file selection editing
- [ ] Test user removal

### Dropbox Integration
- [ ] Create Dropbox connector with valid app credentials
- [ ] Start OAuth flow and complete authentication
- [ ] Select files using Dropbox chooser
- [ ] Verify files are processed by Vectorize
- [ ] Test user management operations

### Error Scenarios
- [ ] Invalid OAuth credentials
- [ ] Network connectivity issues
- [ ] Popup blocked by browser
- [ ] OAuth flow cancellation
- [ ] File access permission issues

## Performance Testing

```typescript
// __tests__/performance/white-label.test.ts
describe('White-Label Performance Tests', () => {
  it('should create connectors within acceptable time', async () => {
    const start = Date.now();
    
    await createWhiteLabelGDriveConnector(
      mockConfig,
      'Performance Test',
      'client-id',
      'client-secret'
    );
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });

  it('should handle multiple OAuth flows concurrently', async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      createWhiteLabelGDriveConnector(
        mockConfig,
        `Connector ${i}`,
        'client-id',
        'client-secret'
      )
    );

    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result).toBeDefined();
    });
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run platform-specific tests
npm test -- google-drive
npm test -- dropbox

# Run OAuth flow tests
npm test -- oauth

# Run integration tests
npm test -- integration

# Run with coverage
npm test -- --coverage
```

## Platform-Specific Examples

For detailed platform-specific testing examples:

- [Google Drive Testing](./google-drive.md)
- [Dropbox Testing](./dropbox.md)
- [Notion Testing](./notion.md)

## Next Steps

- [Environment Setup](../../environment-setup/white-label/)
- [Creating Connectors](../../creating-connectors/white-label/)

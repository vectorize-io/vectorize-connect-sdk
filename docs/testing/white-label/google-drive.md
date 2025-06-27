# Google Drive Testing - White-Label Approach

Testing strategies for Google Drive White-Label connectors.

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
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
```

## Unit Tests

### Testing Google Drive Connector Creation

```typescript
// __tests__/google-drive-white-label.test.ts
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

  it('should handle invalid API credentials', async () => {
    const invalidConfig = {
      authorization: '',
      organizationId: '',
    };

    await expect(
      createWhiteLabelGDriveConnector(
        invalidConfig,
        'Test Connector',
        'test-client-id',
        'test-client-secret'
      )
    ).rejects.toThrow();
  });
});
```

### Testing OAuth Flow

```typescript
// __tests__/oauth/google-drive-white-label.test.ts
import { GoogleDriveOAuth } from '@vectorize-io/vectorize-connect';

// Mock window.open for popup testing
global.open = jest.fn();

describe('Google Drive White-Label OAuth Flow', () => {
  const mockConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
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
      selectedFiles: ['file1', 'file2'],
      accessToken: 'test-access-token',
    };

    mockConfig.onSuccess(mockResponse);
    
    expect(mockConfig.onSuccess).toHaveBeenCalledWith(mockResponse);
  });

  it('should handle OAuth error', () => {
    const mockError = new Error('OAuth failed');

    mockConfig.onError(mockError);
    
    expect(mockConfig.onError).toHaveBeenCalledWith(mockError);
  });

  it('should validate required OAuth parameters', () => {
    const invalidConfig = {
      ...mockConfig,
      clientId: '',
    };

    expect(() => GoogleDriveOAuth.startOAuth(invalidConfig)).toThrow();
  });
});
```

## Integration Tests

### Testing Complete Google Drive Flow

```typescript
// __tests__/integration/google-drive-white-label.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GoogleDriveWhiteLabel from '../components/GoogleDriveWhiteLabel';

jest.mock('@vectorize-io/vectorize-connect', () => ({
  createWhiteLabelGDriveConnector: jest.fn().mockResolvedValue('test-connector-id'),
  GoogleDriveOAuth: {
    startOAuth: jest.fn(),
  },
  manageUser: jest.fn().mockResolvedValue({ ok: true }),
}));

describe('GoogleDriveWhiteLabel Integration', () => {
  it('should complete the full connector flow', async () => {
    render(<GoogleDriveWhiteLabel />);
    
    // Create connector
    const createButton = screen.getByText('Create Google Drive Connector');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connector Created')).toBeInTheDocument();
    });
    
    // Start OAuth flow
    const connectButton = screen.getByText('Connect with Google Drive');
    fireEvent.click(connectButton);
    
    expect(require('@vectorize-io/vectorize-connect').GoogleDriveOAuth.startOAuth).toHaveBeenCalled();
  });

  it('should handle connector creation errors', async () => {
    const mockError = new Error('Failed to create connector');
    require('@vectorize-io/vectorize-connect').createWhiteLabelGDriveConnector.mockRejectedValueOnce(mockError);

    render(<GoogleDriveWhiteLabel />);
    
    const createButton = screen.getByText('Create Google Drive Connector');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to create connector/)).toBeInTheDocument();
    });
  });
});
```

## API Route Tests

### Testing Google Drive Connector API

```typescript
// __tests__/api/google-drive-white-label.test.ts
import { POST } from '../../app/api/createGDriveWhiteLabelConnector/route';
import { NextRequest } from 'next/server';

describe('/api/createGDriveWhiteLabelConnector', () => {
  it('should create a Google Drive connector successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/createGDriveWhiteLabelConnector', {
      method: 'POST',
      body: JSON.stringify({
        connectorName: 'Test Google Drive Connector',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.connectorId).toBeDefined();
  });

  it('should handle missing OAuth credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/createGDriveWhiteLabelConnector', {
      method: 'POST',
      body: JSON.stringify({
        connectorName: 'Test Connector',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing OAuth credentials');
  });

  it('should handle missing environment variables', async () => {
    // Temporarily remove environment variables
    const originalApiKey = process.env.VECTORIZE_API_KEY;
    delete process.env.VECTORIZE_API_KEY;

    const request = new NextRequest('http://localhost:3000/api/createGDriveWhiteLabelConnector', {
      method: 'POST',
      body: JSON.stringify({
        connectorName: 'Test Connector',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Missing Vectorize credentials');

    // Restore environment variable
    process.env.VECTORIZE_API_KEY = originalApiKey;
  });
});
```

### Testing OAuth Callback API

```typescript
// __tests__/api/oauth-callback-gdrive.test.ts
import { GET } from '../../app/api/oauth/gdrive-callback/route';
import { NextRequest } from 'next/server';

describe('/api/oauth/gdrive-callback', () => {
  it('should handle successful OAuth callback', async () => {
    const url = new URL('http://localhost:3000/api/oauth/gdrive-callback');
    url.searchParams.set('code', 'test-auth-code');
    url.searchParams.set('state', 'test-state');

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('should handle OAuth error callback', async () => {
    const url = new URL('http://localhost:3000/api/oauth/gdrive-callback');
    url.searchParams.set('error', 'access_denied');

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('should handle missing authorization code', async () => {
    const url = new URL('http://localhost:3000/api/oauth/gdrive-callback');

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
```

## User Management Tests

### Testing Google Drive User Management

```typescript
// __tests__/user-management/google-drive-white-label.test.ts
import { manageUser } from '@vectorize-io/vectorize-connect';

describe('Google Drive White-Label User Management', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should add user successfully', async () => {
    const result = await manageUser(
      mockConfig,
      'connector123',
      'user123',
      'add',
      {
        selectedFiles: ['file1', 'file2'],
        accessToken: 'test-access-token'
      }
    );

    expect(result).toBeDefined();
  });

  it('should edit user successfully', async () => {
    const result = await manageUser(
      mockConfig,
      'connector123',
      'user123',
      'edit',
      {
        selectedFiles: ['file1', 'file3'],
        accessToken: 'test-access-token'
      }
    );

    expect(result).toBeDefined();
  });

  it('should remove user successfully', async () => {
    const result = await manageUser(
      mockConfig,
      'connector123',
      'user123',
      'remove'
    );

    expect(result).toBeDefined();
  });

  it('should handle missing access token for add operation', async () => {
    await expect(
      manageUser(
        mockConfig,
        'connector123',
        'user123',
        'add',
        {
          selectedFiles: ['file1', 'file2']
        }
      )
    ).rejects.toThrow();
  });
});
```

## Manual Testing Checklist

### Google Drive White-Label Integration
- [ ] Create Google Drive connector with valid OAuth credentials
- [ ] Start OAuth flow and complete authentication
- [ ] Select files using Google Picker
- [ ] Verify files are processed by Vectorize
- [ ] Test file selection editing
- [ ] Test user removal
- [ ] Verify OAuth credentials validation

### Error Scenarios
- [ ] Invalid OAuth credentials (client ID/secret)
- [ ] Missing environment variables
- [ ] Network connectivity issues
- [ ] Popup blocked by browser
- [ ] OAuth flow cancellation
- [ ] File access permission issues
- [ ] Invalid redirect URI configuration

### Security Testing
- [ ] OAuth state parameter validation
- [ ] CSRF protection
- [ ] Token expiration handling
- [ ] Secure credential storage

## Performance Testing

```typescript
// __tests__/performance/google-drive-white-label.test.ts
describe('Google Drive White-Label Performance Tests', () => {
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

  it('should handle large file selections efficiently', async () => {
    const largeFileSelection = Array.from({ length: 100 }, (_, i) => ({
      id: `file_${i}`,
      name: `File ${i}.pdf`,
      size: 1024 * 1024 // 1MB
    }));

    const start = Date.now();
    
    await manageUser(
      mockConfig,
      'connector123',
      'user123',
      'add',
      {
        selectedFiles: largeFileSelection,
        accessToken: 'test-access-token'
      }
    );
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10000); // 10 seconds max
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run Google Drive specific tests
npm test -- google-drive

# Run OAuth flow tests
npm test -- oauth

# Run integration tests
npm test -- integration

# Run with coverage
npm test -- --coverage

# Run performance tests
npm test -- performance
```

## Next Steps

- [Google Drive User Management](../../user-management/white-label/google-drive.md)
- [Environment Setup](../../environment-setup/white-label/)

# Dropbox Testing - White-Label Approach

Testing strategies for Dropbox White-Label connectors.

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
process.env.DROPBOX_APP_KEY = 'test-dropbox-app-key';
process.env.DROPBOX_APP_SECRET = 'test-dropbox-app-secret';
```

## Unit Tests

### Testing Dropbox Connector Creation

```typescript
// __tests__/dropbox-white-label.test.ts
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

  it('should handle missing OAuth credentials', async () => {
    await expect(
      createWhiteLabelDropboxConnector(
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
      createWhiteLabelDropboxConnector(
        invalidConfig,
        'Test Connector',
        'test-app-key',
        'test-app-secret'
      )
    ).rejects.toThrow();
  });
});
```

### Testing OAuth Flow

```typescript
// __tests__/oauth/dropbox-white-label.test.ts
import { DropboxOAuth } from '@vectorize-io/vectorize-connect';

// Mock window.open for popup testing
global.open = jest.fn();

describe('Dropbox White-Label OAuth Flow', () => {
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
      appKey: '',
    };

    expect(() => DropboxOAuth.startOAuth(invalidConfig)).toThrow();
  });
});
```

## Integration Tests

### Testing Complete Dropbox Flow

```typescript
// __tests__/integration/dropbox-white-label.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DropboxWhiteLabel from '../components/DropboxWhiteLabel';

jest.mock('@vectorize-io/vectorize-connect', () => ({
  createWhiteLabelDropboxConnector: jest.fn().mockResolvedValue('test-connector-id'),
  DropboxOAuth: {
    startOAuth: jest.fn(),
  },
  manageUser: jest.fn().mockResolvedValue({ ok: true }),
}));

describe('DropboxWhiteLabel Integration', () => {
  it('should complete the full connector flow', async () => {
    render(<DropboxWhiteLabel />);
    
    // Create connector
    const createButton = screen.getByText('Create Dropbox Connector');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connector Created')).toBeInTheDocument();
    });
    
    // Start OAuth flow
    const connectButton = screen.getByText('Connect with Dropbox');
    fireEvent.click(connectButton);
    
    expect(require('@vectorize-io/vectorize-connect').DropboxOAuth.startOAuth).toHaveBeenCalled();
  });

  it('should handle connector creation errors', async () => {
    const mockError = new Error('Failed to create connector');
    require('@vectorize-io/vectorize-connect').createWhiteLabelDropboxConnector.mockRejectedValueOnce(mockError);

    render(<DropboxWhiteLabel />);
    
    const createButton = screen.getByText('Create Dropbox Connector');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to create connector/)).toBeInTheDocument();
    });
  });
});
```

## API Route Tests

### Testing Dropbox Connector API

```typescript
// __tests__/api/dropbox-white-label.test.ts
import { POST } from '../../app/api/createDropboxWhiteLabelConnector/route';
import { NextRequest } from 'next/server';

describe('/api/createDropboxWhiteLabelConnector', () => {
  it('should create a Dropbox connector successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/createDropboxWhiteLabelConnector', {
      method: 'POST',
      body: JSON.stringify({
        connectorName: 'Test Dropbox Connector',
        appKey: 'test-app-key',
        appSecret: 'test-app-secret',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.connectorId).toBeDefined();
  });

  it('should handle missing OAuth credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/createDropboxWhiteLabelConnector', {
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

    const request = new NextRequest('http://localhost:3000/api/createDropboxWhiteLabelConnector', {
      method: 'POST',
      body: JSON.stringify({
        connectorName: 'Test Connector',
        appKey: 'test-app-key',
        appSecret: 'test-app-secret',
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
// __tests__/api/oauth-callback-dropbox.test.ts
import { GET } from '../../app/api/oauth/dropbox-callback/route';
import { NextRequest } from 'next/server';

describe('/api/oauth/dropbox-callback', () => {
  it('should handle successful OAuth callback', async () => {
    const url = new URL('http://localhost:3000/api/oauth/dropbox-callback');
    url.searchParams.set('code', 'test-auth-code');
    url.searchParams.set('state', 'test-state');

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('should handle OAuth error callback', async () => {
    const url = new URL('http://localhost:3000/api/oauth/dropbox-callback');
    url.searchParams.set('error', 'access_denied');

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('should handle missing authorization code', async () => {
    const url = new URL('http://localhost:3000/api/oauth/dropbox-callback');

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
```

## User Management Tests

### Testing Dropbox User Management

```typescript
// __tests__/user-management/dropbox-white-label.test.ts
import { manageUser } from '@vectorize-io/vectorize-connect';

describe('Dropbox White-Label User Management', () => {
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

### Dropbox White-Label Integration
- [ ] Create Dropbox connector with valid OAuth credentials
- [ ] Start OAuth flow and complete authentication
- [ ] Select files using Dropbox chooser
- [ ] Verify files are processed by Vectorize
- [ ] Test file selection editing
- [ ] Test user removal
- [ ] Verify OAuth credentials validation

### Error Scenarios
- [ ] Invalid OAuth credentials (app key/secret)
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
// __tests__/performance/dropbox-white-label.test.ts
describe('Dropbox White-Label Performance Tests', () => {
  it('should create connectors within acceptable time', async () => {
    const start = Date.now();
    
    await createWhiteLabelDropboxConnector(
      mockConfig,
      'Performance Test',
      'app-key',
      'app-secret'
    );
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });

  it('should handle multiple OAuth flows concurrently', async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      createWhiteLabelDropboxConnector(
        mockConfig,
        `Connector ${i}`,
        'app-key',
        'app-secret'
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

# Run Dropbox specific tests
npm test -- dropbox

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

- [Dropbox User Management](../../user-management/white-label/dropbox.md)
- [Environment Setup](../../environment-setup/white-label/)

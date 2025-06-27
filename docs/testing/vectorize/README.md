# Testing - Vectorize Approach

Testing strategies for Vectorize connectors.

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
```

## Unit Tests

### Testing Connector Creation

```typescript
// __tests__/connector.test.ts
import { 
  createVectorizeGDriveConnector,
  createVectorizeDropboxConnector,
  createVectorizeNotionConnector
} from '@vectorize-io/vectorize-connect';

describe('Vectorize Connector Creation', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should create a Google Drive connector successfully', async () => {
    const connectorId = await createVectorizeGDriveConnector(
      mockConfig,
      'Test Google Drive Connector'
    );
    
    expect(connectorId).toBeDefined();
    expect(typeof connectorId).toBe('string');
  });

  it('should create a Dropbox connector successfully', async () => {
    const connectorId = await createVectorizeDropboxConnector(
      mockConfig,
      'Test Dropbox Connector'
    );
    
    expect(connectorId).toBeDefined();
    expect(typeof connectorId).toBe('string');
  });

  it('should create a Notion connector successfully', async () => {
    const connectorId = await createVectorizeNotionConnector(
      mockConfig,
      'Test Notion Connector'
    );
    
    expect(connectorId).toBeDefined();
    expect(typeof connectorId).toBe('string');
  });

  it('should handle invalid credentials', async () => {
    const invalidConfig = {
      authorization: '',
      organizationId: '',
    };

    await expect(
      createVectorizeGDriveConnector(invalidConfig, 'Test Connector')
    ).rejects.toThrow();
  });

  it('should handle Notion connector creation errors', async () => {
    const invalidConfig = {
      authorization: '',
      organizationId: '',
    };

    await expect(
      createVectorizeNotionConnector(invalidConfig, 'Test Connector')
    ).rejects.toThrow();
  });
});
```

### Testing Token Generation

```typescript
// __tests__/token.test.ts
import { getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

describe('One-Time Token Generation', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should generate a valid token', async () => {
    const tokenResponse = await getOneTimeConnectorToken(
      mockConfig,
      'user123',
      'connector123'
    );
    
    expect(tokenResponse.token).toBeDefined();
    expect(typeof tokenResponse.token).toBe('string');
  });

  it('should handle missing parameters', async () => {
    await expect(
      getOneTimeConnectorToken(mockConfig, '', 'connector123')
    ).rejects.toThrow();
  });
});
```

## Integration Tests

### Testing Complete Flow

```typescript
// __tests__/integration.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VectorizeConnector from '../components/VectorizeConnector';

// Mock the SDK functions
jest.mock('@vectorize-io/vectorize-connect', () => ({
  createVectorizeGDriveConnector: jest.fn().mockResolvedValue('test-gdrive-connector-id'),
  createVectorizeDropboxConnector: jest.fn().mockResolvedValue('test-dropbox-connector-id'),
  createVectorizeNotionConnector: jest.fn().mockResolvedValue('test-notion-connector-id'),
  getOneTimeConnectorToken: jest.fn().mockResolvedValue({ token: 'test-token' }),
  manageNotionUser: jest.fn().mockResolvedValue({ ok: true }),
  PlatformOAuth: {
    redirectToVectorizeConnect: jest.fn(),
  },
}));

describe('VectorizeConnector Integration', () => {
  it('should complete the full connector flow', async () => {
    render(<VectorizeConnector />);
    
    // Create connector
    const createButton = screen.getByText('Create Connector');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connector Created')).toBeInTheDocument();
    });
    
    // Connect user
    const connectButton = screen.getByText('Connect to Platform');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });
  });
});
```

## API Route Tests

### Testing Connector Creation API

```typescript
// __tests__/api/createConnector.test.ts
import { POST } from '../../app/api/createConnector/route';
import { NextRequest } from 'next/server';

describe('/api/createConnector', () => {
  it('should create a connector successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/createConnector', {
      method: 'POST',
      body: JSON.stringify({
        connectorName: 'Test Connector',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.connectorId).toBeDefined();
  });

  it('should handle missing connector name', async () => {
    const request = new NextRequest('http://localhost:3000/api/createConnector', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
```

### Testing Token Generation API

```typescript
// __tests__/api/token.test.ts
import { GET } from '../../app/api/get-one-time-connector-token/route';
import { NextRequest } from 'next/server';

describe('/api/get-one-time-connector-token', () => {
  it('should generate a token successfully', async () => {
    const url = new URL('http://localhost:3000/api/get-one-time-connector-token');
    url.searchParams.set('userId', 'user123');
    url.searchParams.set('connectorId', 'connector123');

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBeDefined();
  });
});
```

## Manual Testing Checklist

### Connector Creation
- [ ] Create connector with valid credentials
- [ ] Handle invalid credentials gracefully
- [ ] Verify connector appears in Vectorize dashboard

### User Authentication
- [ ] Generate one-time token successfully
- [ ] Redirect to Vectorize authentication page
- [ ] Complete authentication flow
- [ ] Verify user is added to connector

### User Management
- [ ] Edit user file selection
- [ ] Remove user from connector
- [ ] Handle user management errors

### Error Scenarios
- [ ] Network connectivity issues
- [ ] Invalid API credentials
- [ ] Expired tokens
- [ ] Missing environment variables

## Performance Testing

```typescript
// __tests__/performance.test.ts
describe('Performance Tests', () => {
  it('should create connectors within acceptable time', async () => {
    const start = Date.now();
    
    await createVectorizeGDriveConnector(mockConfig, 'Performance Test');
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });

  it('should handle concurrent token requests', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      getOneTimeConnectorToken(mockConfig, `user${i}`, 'connector123')
    );

    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result.token).toBeDefined();
    });
  });
});
```

## Test Data Setup

```typescript
// __tests__/helpers/testData.ts
export const mockVectorizeConfig = {
  authorization: 'test-api-key',
  organizationId: 'test-org-id',
};

export const mockConnectorData = {
  id: 'test-connector-id',
  name: 'Test Connector',
  type: 'PLATFORM_OAUTH_MULTI',
};

export const mockUserData = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
};

export const mockTokenResponse = {
  token: 'test-one-time-token',
  expiresAt: new Date(Date.now() + 300000), // 5 minutes
};
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- connector.test.ts

# Run integration tests only
npm test -- --testPathPattern=integration
```

## Platform-Specific Examples

For detailed platform-specific testing examples:

- [Google Drive Testing](./google-drive.md)
- [Dropbox Testing](./dropbox.md)
- [Notion Testing](./notion.md)

## Next Steps

- [Environment Setup](../../environment-setup/vectorize/)
- [Creating Connectors](../../creating-connectors/vectorize/)

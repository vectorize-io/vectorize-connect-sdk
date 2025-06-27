# Dropbox Testing - Vectorize Approach

Testing strategies for Dropbox Vectorize connectors.

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

### Testing Dropbox Connector Creation

```typescript
// __tests__/dropbox-vectorize.test.ts
import { createVectorizeDropboxConnector } from '@vectorize-io/vectorize-connect';

describe('Dropbox Vectorize Connector', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should create a Dropbox connector successfully', async () => {
    const connectorId = await createVectorizeDropboxConnector(
      mockConfig,
      'Test Dropbox Connector'
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
      createVectorizeDropboxConnector(invalidConfig, 'Test Connector')
    ).rejects.toThrow();
  });
});
```

### Testing Dropbox Token Generation

```typescript
// __tests__/dropbox-token.test.ts
import { getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

describe('Dropbox Token Generation', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should generate a valid token for Dropbox connector', async () => {
    const tokenResponse = await getOneTimeConnectorToken(
      mockConfig,
      'dropbox-user123',
      'dropbox-connector123'
    );
    
    expect(tokenResponse.token).toBeDefined();
    expect(typeof tokenResponse.token).toBe('string');
  });

  it('should handle missing Dropbox user ID', async () => {
    await expect(
      getOneTimeConnectorToken(mockConfig, '', 'dropbox-connector123')
    ).rejects.toThrow();
  });
});
```

## Integration Tests

### Testing Complete Dropbox Flow

```typescript
// __tests__/integration/dropbox-vectorize.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DropboxVectorizeConnector from '../components/DropboxVectorizeConnector';

// Mock the SDK functions
jest.mock('@vectorize-io/vectorize-connect', () => ({
  createVectorizeDropboxConnector: jest.fn().mockResolvedValue('test-dropbox-connector-id'),
  getOneTimeConnectorToken: jest.fn().mockResolvedValue({ token: 'test-dropbox-token' }),
  DropboxOAuth: {
    redirectToVectorizeConnect: jest.fn(),
    redirectToVectorizeEdit: jest.fn(),
  },
}));

describe('DropboxVectorizeConnector Integration', () => {
  it('should complete the full Dropbox connector flow', async () => {
    render(<DropboxVectorizeConnector />);
    
    // Create Dropbox connector
    const createButton = screen.getByText('Create Dropbox Connector');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Dropbox Connector Created')).toBeInTheDocument();
    });
    
    // Connect Dropbox user
    const connectButton = screen.getByText('Connect with Dropbox');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connecting to Dropbox...')).toBeInTheDocument();
    });
  });

  it('should handle Dropbox connection errors', async () => {
    const mockError = new Error('Dropbox connection failed');
    require('@vectorize-io/vectorize-connect').DropboxOAuth.redirectToVectorizeConnect.mockRejectedValue(mockError);

    render(<DropboxVectorizeConnector />);
    
    const connectButton = screen.getByText('Connect with Dropbox');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Dropbox connection failed')).toBeInTheDocument();
    });
  });
});
```

## API Route Tests

### Testing Dropbox Connector API

```typescript
// __tests__/api/dropbox-connector.test.ts
import { POST } from '../../app/api/createDropboxConnector/route';
import { NextRequest } from 'next/server';

describe('/api/createDropboxConnector', () => {
  it('should create a Dropbox connector successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/createDropboxConnector', {
      method: 'POST',
      body: JSON.stringify({
        connectorName: 'Test Dropbox Connector',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.connectorId).toBeDefined();
  });

  it('should handle missing connector name', async () => {
    const request = new NextRequest('http://localhost:3000/api/createDropboxConnector', {
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

### Testing Dropbox Token API

```typescript
// __tests__/api/dropbox-token.test.ts
import { GET } from '../../app/api/get-dropbox-token/route';
import { NextRequest } from 'next/server';

describe('/api/get-dropbox-token', () => {
  it('should generate a Dropbox token successfully', async () => {
    const url = new URL('http://localhost:3000/api/get-dropbox-token');
    url.searchParams.set('userId', 'dropbox-user123');
    url.searchParams.set('connectorId', 'dropbox-connector123');

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBeDefined();
  });
});
```

## User Management Tests

### Testing Dropbox User Management

```typescript
// __tests__/user-management/dropbox.test.ts
import { manageUser } from '@vectorize-io/vectorize-connect';

describe('Dropbox User Management', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should edit Dropbox user successfully', async () => {
    const result = await manageUser(
      mockConfig,
      'dropbox-connector123',
      'dropbox-user123',
      'edit',
      { selectedFiles: ['file1', 'file2'] }
    );

    expect(result).toBeDefined();
  });

  it('should remove Dropbox user successfully', async () => {
    const result = await manageUser(
      mockConfig,
      'dropbox-connector123',
      'dropbox-user123',
      'remove'
    );

    expect(result).toBeDefined();
  });
});
```

## Manual Testing Checklist

### Dropbox Integration
- [ ] Create Dropbox connector with valid Vectorize credentials
- [ ] Generate one-time token for Dropbox user
- [ ] Redirect to Vectorize Dropbox authentication
- [ ] Complete Dropbox file selection
- [ ] Verify files are processed by Vectorize
- [ ] Test Dropbox file selection editing
- [ ] Test Dropbox user removal

### Error Scenarios
- [ ] Invalid Vectorize API credentials
- [ ] Network connectivity issues
- [ ] Expired Dropbox tokens
- [ ] Missing environment variables
- [ ] Dropbox API rate limiting

## Performance Testing

```typescript
// __tests__/performance/dropbox.test.ts
describe('Dropbox Performance Tests', () => {
  it('should create Dropbox connectors within acceptable time', async () => {
    const start = Date.now();
    
    await createVectorizeDropboxConnector(mockConfig, 'Performance Test');
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });

  it('should handle concurrent Dropbox token requests', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      getOneTimeConnectorToken(mockConfig, `dropbox-user${i}`, 'dropbox-connector123')
    );

    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result.token).toBeDefined();
    });
  });
});
```

## Running Tests

```bash
# Run Dropbox specific tests
npm test -- dropbox

# Run Dropbox integration tests
npm test -- integration/dropbox

# Run Dropbox API tests
npm test -- api/dropbox

# Run with coverage
npm test -- --coverage dropbox
```

## Next Steps

- [Dropbox User Management](../../user-management/vectorize/dropbox.md)
- [Dropbox Frontend Implementation](../../frontend-implementation/vectorize/dropbox.md)

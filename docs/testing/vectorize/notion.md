# Notion Testing - Vectorize Approach

Testing strategies for Notion Vectorize connectors.

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

### Testing Notion Connector Creation

```typescript
// __tests__/notion-vectorize.test.ts
import { createVectorizeNotionConnector } from '@vectorize-io/vectorize-connect';

describe('Notion Vectorize Connector', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

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
      createVectorizeNotionConnector(invalidConfig, 'Test Connector')
    ).rejects.toThrow();
  });
});
```

### Testing Notion Token Generation

```typescript
// __tests__/notion-token.test.ts
import { getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

describe('Notion Token Generation', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should generate a valid token for Notion connector', async () => {
    const tokenResponse = await getOneTimeConnectorToken(
      mockConfig,
      'notion-user123',
      'notion-connector123'
    );
    
    expect(tokenResponse.token).toBeDefined();
    expect(typeof tokenResponse.token).toBe('string');
  });

  it('should handle missing Notion user ID', async () => {
    await expect(
      getOneTimeConnectorToken(mockConfig, '', 'notion-connector123')
    ).rejects.toThrow();
  });
});
```

## Integration Tests

### Testing Complete Notion Flow

```typescript
// __tests__/integration/notion-vectorize.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotionVectorizeConnector from '../components/NotionVectorizeConnector';

// Mock the SDK functions
jest.mock('@vectorize-io/vectorize-connect', () => ({
  createVectorizeNotionConnector: jest.fn().mockResolvedValue('test-notion-connector-id'),
  getOneTimeConnectorToken: jest.fn().mockResolvedValue({ token: 'test-notion-token' }),
  manageNotionUser: jest.fn().mockResolvedValue({ ok: true }),
  NotionOAuth: {
    redirectToVectorizeConnect: jest.fn(),
    redirectToVectorizeEdit: jest.fn(),
  },
}));

describe('NotionVectorizeConnector Integration', () => {
  it('should complete the full Notion connector flow', async () => {
    render(<NotionVectorizeConnector />);
    
    // Create Notion connector
    const createButton = screen.getByText('Create Notion Connector');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Notion Connector Created')).toBeInTheDocument();
    });
    
    // Connect Notion user
    const connectButton = screen.getByText('Connect with Notion');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connecting to Notion...')).toBeInTheDocument();
    });
  });

  it('should handle Notion connection errors', async () => {
    const mockError = new Error('Notion connection failed');
    require('@vectorize-io/vectorize-connect').NotionOAuth.redirectToVectorizeConnect.mockRejectedValue(mockError);

    render(<NotionVectorizeConnector />);
    
    const connectButton = screen.getByText('Connect with Notion');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Notion connection failed')).toBeInTheDocument();
    });
  });
});
```

## API Route Tests

### Testing Notion Connector API

```typescript
// __tests__/api/notion-connector.test.ts
import { POST } from '../../app/api/createNotionConnector/route';
import { NextRequest } from 'next/server';

describe('/api/createNotionConnector', () => {
  it('should create a Notion connector successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/createNotionConnector', {
      method: 'POST',
      body: JSON.stringify({
        connectorName: 'Test Notion Connector',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.connectorId).toBeDefined();
  });

  it('should handle missing connector name', async () => {
    const request = new NextRequest('http://localhost:3000/api/createNotionConnector', {
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

### Testing Notion Token API

```typescript
// __tests__/api/notion-token.test.ts
import { GET } from '../../app/api/get-notion-token/route';
import { NextRequest } from 'next/server';

describe('/api/get-notion-token', () => {
  it('should generate a Notion token successfully', async () => {
    const url = new URL('http://localhost:3000/api/get-notion-token');
    url.searchParams.set('userId', 'notion-user123');
    url.searchParams.set('connectorId', 'notion-connector123');

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBeDefined();
  });
});
```

## User Management Tests

### Testing Notion User Management

```typescript
// __tests__/user-management/notion.test.ts
import { manageNotionUser } from '@vectorize-io/vectorize-connect';

describe('Notion User Management', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  const mockSelectedPages = {
    'page1': { title: 'Test Page 1', pageId: 'page1' },
    'page2': { title: 'Test Page 2', pageId: 'page2' }
  };

  it('should add Notion user successfully', async () => {
    const result = await manageNotionUser(
      mockConfig,
      'notion-connector123',
      mockSelectedPages,
      'notion-access-token',
      'notion-user123',
      'add'
    );

    expect(result).toBeDefined();
  });

  it('should edit Notion user successfully', async () => {
    const result = await manageNotionUser(
      mockConfig,
      'notion-connector123',
      mockSelectedPages,
      'notion-access-token',
      'notion-user123',
      'edit'
    );

    expect(result).toBeDefined();
  });

  it('should remove Notion user successfully', async () => {
    const result = await manageNotionUser(
      mockConfig,
      'notion-connector123',
      null,
      '',
      'notion-user123',
      'remove'
    );

    expect(result).toBeDefined();
  });
});
```

## Manual Testing Checklist

### Notion Integration
- [ ] Create Notion connector with valid Vectorize credentials
- [ ] Generate one-time token for Notion user
- [ ] Redirect to Vectorize Notion authentication
- [ ] Complete Notion page selection
- [ ] Verify pages are processed by Vectorize
- [ ] Test Notion page selection editing
- [ ] Test Notion user removal

### Error Scenarios
- [ ] Invalid Vectorize API credentials
- [ ] Network connectivity issues
- [ ] Expired Notion tokens
- [ ] Missing environment variables
- [ ] Notion API rate limiting
- [ ] Invalid Notion workspace permissions

## Performance Testing

```typescript
// __tests__/performance/notion.test.ts
describe('Notion Performance Tests', () => {
  it('should create Notion connectors within acceptable time', async () => {
    const start = Date.now();
    
    await createVectorizeNotionConnector(mockConfig, 'Performance Test');
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });

  it('should handle concurrent Notion token requests', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      getOneTimeConnectorToken(mockConfig, `notion-user${i}`, 'notion-connector123')
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
# Run Notion specific tests
npm test -- notion

# Run Notion integration tests
npm test -- integration/notion

# Run Notion API tests
npm test -- api/notion

# Run with coverage
npm test -- --coverage notion
```

## Next Steps

- [Notion User Management](../../user-management/vectorize/notion.md)
- [Notion Frontend Implementation](../../frontend-implementation/vectorize/notion.md)

# Testing White-Label Notion Connectors

This guide covers testing strategies specific to White-Label Notion connectors.

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
process.env.NOTION_CLIENT_ID = 'test-notion-client-id';
process.env.NOTION_CLIENT_SECRET = 'test-notion-client-secret';
```

## Unit Tests

### Testing Connector Creation

```typescript
// __tests__/notion-connector.test.ts
import { createWhiteLabelNotionConnector } from '@vectorize-io/vectorize-connect';

describe('White-Label Notion Connector Creation', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should create a white-label Notion connector successfully', async () => {
    const connectorId = await createWhiteLabelNotionConnector(
      mockConfig,
      'Test White-Label Notion Connector',
      'test-client-id',
      'test-client-secret'
    );
    
    expect(connectorId).toBeDefined();
    expect(typeof connectorId).toBe('string');
  });

  it('should require client ID and secret', async () => {
    await expect(
      createWhiteLabelNotionConnector(
        mockConfig,
        'Test Connector',
        '', // Empty client ID
        'test-client-secret'
      )
    ).rejects.toThrow('Client ID and Client Secret are required');

    await expect(
      createWhiteLabelNotionConnector(
        mockConfig,
        'Test Connector',
        'test-client-id',
        '' // Empty client secret
      )
    ).rejects.toThrow('Client ID and Client Secret are required');
  });

  it('should handle API errors gracefully', async () => {
    const invalidConfig = {
      authorization: 'invalid-token',
      organizationId: 'invalid-org',
    };

    await expect(
      createWhiteLabelNotionConnector(
        invalidConfig,
        'Test Connector',
        'test-client-id',
        'test-client-secret'
      )
    ).rejects.toThrow();
  });
});
```

### Testing User Management

```typescript
// __tests__/notion-user-management.test.ts
import { manageNotionUser } from '@vectorize-io/vectorize-connect';

describe('Notion User Management', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  const mockSelectedPages = {
    'page1': {
      title: 'Test Page',
      pageId: 'page1',
      parentType: 'workspace'
    }
  };

  it('should add a user successfully', async () => {
    const response = await manageNotionUser(
      mockConfig,
      'connector123',
      mockSelectedPages,
      'notion-access-token',
      'user123',
      'add'
    );
    
    expect(response).toBeDefined();
  });

  it('should edit a user successfully', async () => {
    const updatedPages = {
      'page2': {
        title: 'Updated Page',
        pageId: 'page2',
        parentType: 'database'
      }
    };

    const response = await manageNotionUser(
      mockConfig,
      'connector123',
      updatedPages,
      'notion-access-token',
      'user123',
      'edit'
    );
    
    expect(response).toBeDefined();
  });

  it('should remove a user successfully', async () => {
    const response = await manageNotionUser(
      mockConfig,
      'connector123',
      null, // No pages needed for removal
      '', // No access token needed for removal
      'user123',
      'remove'
    );
    
    expect(response).toBeDefined();
  });

  it('should require selected pages for add action', async () => {
    await expect(
      manageNotionUser(
        mockConfig,
        'connector123',
        null, // Missing pages
        'notion-access-token',
        'user123',
        'add'
      )
    ).rejects.toThrow('Selected pages are required for add action');
  });

  it('should require access token for add action', async () => {
    await expect(
      manageNotionUser(
        mockConfig,
        'connector123',
        mockSelectedPages,
        '', // Missing access token
        'user123',
        'add'
      )
    ).rejects.toThrow('Access token is required for add action');
  });

  it('should require selected pages for edit action', async () => {
    await expect(
      manageNotionUser(
        mockConfig,
        'connector123',
        {}, // Empty pages object
        'notion-access-token',
        'user123',
        'edit'
      )
    ).rejects.toThrow('Selected pages are required for edit action');
  });
});
```

### Testing Token Utilities

```typescript
// __tests__/notion-tokens.test.ts
import { 
  exchangeNotionCodeForTokens, 
  refreshNotionToken 
} from '@vectorize-io/vectorize-connect';

describe('Notion Token Utilities', () => {
  it('should exchange code for tokens', async () => {
    const tokens = await exchangeNotionCodeForTokens(
      'auth-code',
      'client-id',
      'client-secret',
      'https://example.com/callback'
    );
    
    expect(tokens).toBeDefined();
  });

  it('should validate access token', async () => {
    const validatedToken = await refreshNotionToken('access-token');
    
    expect(validatedToken).toBeDefined();
  });

  it('should handle invalid authorization code', async () => {
    await expect(
      exchangeNotionCodeForTokens(
        'invalid-code',
        'client-id',
        'client-secret',
        'https://example.com/callback'
      )
    ).rejects.toThrow();
  });

  it('should handle invalid access token', async () => {
    await expect(
      refreshNotionToken('invalid-token')
    ).rejects.toThrow();
  });
});
```

## Integration Tests

### Testing Complete OAuth Flow

```typescript
// __tests__/notion-oauth-flow.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotionConnector from '../components/NotionConnector';

// Mock the SDK functions
jest.mock('@vectorize-io/vectorize-connect', () => ({
  createWhiteLabelNotionConnector: jest.fn().mockResolvedValue('test-notion-connector-id'),
  getOneTimeConnectorToken: jest.fn().mockResolvedValue({ token: 'test-token' }),
  manageNotionUser: jest.fn().mockResolvedValue({ ok: true }),
  NotionOAuth: jest.fn().mockImplementation(() => ({
    redirectToVectorizeConnect: jest.fn(),
  })),
}));

describe('Notion OAuth Flow Integration', () => {
  it('should complete the full connector flow', async () => {
    render(<NotionConnector />);
    
    // Create connector
    const createButton = screen.getByText('Create Notion Connector');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connector Created')).toBeInTheDocument();
    });
    
    // Connect user
    const connectButton = screen.getByText('Connect to Notion');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });
  });

  it('should handle OAuth errors gracefully', async () => {
    // Mock OAuth error
    const mockNotionOAuth = require('@vectorize-io/vectorize-connect').NotionOAuth;
    mockNotionOAuth.mockImplementation(() => ({
      redirectToVectorizeConnect: jest.fn().mockRejectedValue(new Error('OAuth failed')),
    }));

    render(<NotionConnector />);
    
    const connectButton = screen.getByText('Connect to Notion');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });
});
```

## API Route Tests

### Testing Connector Creation API

```typescript
// __tests__/api/create-notion-connector.test.ts
import { POST } from '../../app/api/create-notion-connector/route';
import { NextRequest } from 'next/server';

describe('/api/create-notion-connector', () => {
  it('should create a connector successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/create-notion-connector', {
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
    const request = new NextRequest('http://localhost:3000/api/create-notion-connector', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should handle missing OAuth credentials', async () => {
    // Temporarily remove environment variables
    const originalClientId = process.env.NOTION_CLIENT_ID;
    const originalClientSecret = process.env.NOTION_CLIENT_SECRET;
    
    delete process.env.NOTION_CLIENT_ID;
    delete process.env.NOTION_CLIENT_SECRET;

    const request = new NextRequest('http://localhost:3000/api/create-notion-connector', {
      method: 'POST',
      body: JSON.stringify({
        connectorName: 'Test Connector',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();

    // Restore environment variables
    process.env.NOTION_CLIENT_ID = originalClientId;
    process.env.NOTION_CLIENT_SECRET = originalClientSecret;
  });
});
```

### Testing OAuth Callback API

```typescript
// __tests__/api/notion-oauth-callback.test.ts
import { POST } from '../../app/api/complete-notion-oauth/route';
import { NextRequest } from 'next/server';

describe('/api/complete-notion-oauth', () => {
  it('should complete OAuth flow successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/complete-notion-oauth', {
      method: 'POST',
      body: JSON.stringify({
        code: 'valid-auth-code',
        userId: 'user123',
        connectorId: 'connector123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should handle invalid authorization code', async () => {
    const request = new NextRequest('http://localhost:3000/api/complete-notion-oauth', {
      method: 'POST',
      body: JSON.stringify({
        code: 'invalid-code',
        userId: 'user123',
        connectorId: 'connector123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
```

## Manual Testing Checklist

### Connector Creation
- [ ] Create white-label Notion connector with valid OAuth credentials
- [ ] Handle missing client ID gracefully
- [ ] Handle missing client secret gracefully
- [ ] Verify connector appears in Vectorize dashboard

### OAuth Flow
- [ ] Redirect to Notion OAuth page with correct parameters
- [ ] Handle successful OAuth callback
- [ ] Handle OAuth errors (user denial, invalid credentials)
- [ ] Exchange authorization code for access tokens

### User Management
- [ ] Add user with selected Notion pages
- [ ] Edit user's page selection
- [ ] Remove user from connector
- [ ] Handle user management errors

### Page Selection
- [ ] Display available Notion pages
- [ ] Allow multi-page selection
- [ ] Handle pages from different workspaces
- [ ] Validate page access permissions

### Error Scenarios
- [ ] Network connectivity issues
- [ ] Invalid OAuth credentials
- [ ] Expired access tokens
- [ ] Missing environment variables
- [ ] Notion API rate limiting

## Performance Testing

```typescript
// __tests__/notion-performance.test.ts
describe('Notion Performance Tests', () => {
  it('should create connectors within acceptable time', async () => {
    const start = Date.now();
    
    await createWhiteLabelNotionConnector(
      mockConfig,
      'Performance Test',
      'client-id',
      'client-secret'
    );
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });

  it('should handle concurrent user management requests', async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      manageNotionUser(
        mockConfig,
        'connector123',
        mockSelectedPages,
        'access-token',
        `user${i}`,
        'add'
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

## Test Data Setup

```typescript
// __tests__/helpers/notionTestData.ts
export const mockNotionConfig = {
  authorization: 'test-api-key',
  organizationId: 'test-org-id',
};

export const mockNotionCredentials = {
  clientId: 'test-notion-client-id',
  clientSecret: 'test-notion-client-secret',
};

export const mockNotionPages = {
  'page1': {
    title: 'Project Documentation',
    pageId: 'page1',
    parentType: 'workspace'
  },
  'page2': {
    title: 'Meeting Notes',
    pageId: 'page2',
    parentType: 'database'
  },
  'page3': {
    title: 'Task List',
    pageId: 'page3',
    parentType: 'workspace'
  }
};

export const mockNotionTokens = {
  access_token: 'notion_access_token_123',
  token_type: 'bearer',
  bot_id: 'bot_123',
  workspace_name: 'Test Workspace',
  workspace_id: 'workspace_123'
};
```

## Running Tests

```bash
# Run all Notion tests
npm test -- --testPathPattern=notion

# Run tests in watch mode
npm test -- --watch --testPathPattern=notion

# Run tests with coverage
npm test -- --coverage --testPathPattern=notion

# Run specific test file
npm test -- notion-connector.test.ts

# Run integration tests only
npm test -- --testPathPattern=notion.*integration
```

## Next Steps

- [Environment Setup](../../environment-setup/white-label/)
- [Creating Connectors](../../creating-connectors/white-label/notion.md)
- [User Management](../../user-management/white-label/)

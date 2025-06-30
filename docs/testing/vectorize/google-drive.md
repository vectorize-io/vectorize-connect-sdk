# Google Drive Testing - Vectorize Approach

Testing strategies for Google Drive Vectorize connectors.

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

### Testing Google Drive Connector Creation

```typescript
// __tests__/google-drive-vectorize.test.ts
import { createVectorizeGDriveConnector } from '@vectorize-io/vectorize-connect';

describe('Google Drive Vectorize Connector', () => {
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

  it('should handle invalid credentials', async () => {
    const invalidConfig = {
      authorization: '',
      organizationId: '',
    };

    await expect(
      createVectorizeGDriveConnector(invalidConfig, 'Test Connector')
    ).rejects.toThrow();
  });
});
```

### Testing Google Drive Token Generation

```typescript
// __tests__/google-drive-token.test.ts
import { getOneTimeConnectorToken } from '@vectorize-io/vectorize-connect';

describe('Google Drive Token Generation', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should generate a valid token for Google Drive connector', async () => {
    const tokenResponse = await getOneTimeConnectorToken(
      mockConfig,
      'gdrive-user123',
      'gdrive-connector123'
    );
    
    expect(tokenResponse.token).toBeDefined();
    expect(typeof tokenResponse.token).toBe('string');
  });

  it('should handle missing Google Drive user ID', async () => {
    await expect(
      getOneTimeConnectorToken(mockConfig, '', 'gdrive-connector123')
    ).rejects.toThrow();
  });
});
```

## Integration Tests

### Testing Complete Google Drive Flow

```typescript
// __tests__/integration/google-drive-vectorize.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GoogleDriveVectorizeConnector from '../components/GoogleDriveVectorizeConnector';

// Mock the SDK functions
jest.mock('@vectorize-io/vectorize-connect', () => ({
  createVectorizeGDriveConnector: jest.fn().mockResolvedValue('test-gdrive-connector-id'),
  getOneTimeConnectorToken: jest.fn().mockResolvedValue({ token: 'test-gdrive-token' }),
  GoogleDriveOAuth: {
    redirectToVectorizeConnect: jest.fn(),
    redirectToVectorizeEdit: jest.fn(),
  },
}));

describe('GoogleDriveVectorizeConnector Integration', () => {
  it('should complete the full Google Drive connector flow', async () => {
    render(<GoogleDriveVectorizeConnector />);
    
    // Create Google Drive connector
    const createButton = screen.getByText('Create Google Drive Connector');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Google Drive Connector Created')).toBeInTheDocument();
    });
    
    // Connect Google Drive user
    const connectButton = screen.getByText('Connect with Google Drive');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connecting to Google Drive...')).toBeInTheDocument();
    });
  });

  it('should handle Google Drive connection errors', async () => {
    const mockError = new Error('Google Drive connection failed');
    require('@vectorize-io/vectorize-connect').GoogleDriveOAuth.redirectToVectorizeConnect.mockRejectedValue(mockError);

    render(<GoogleDriveVectorizeConnector />);
    
    const connectButton = screen.getByText('Connect with Google Drive');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Google Drive connection failed')).toBeInTheDocument();
    });
  });
});
```

## API Route Tests

### Testing Google Drive Connector API

```typescript
// __tests__/api/google-drive-connector.test.ts
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

  it('should handle missing connector name', async () => {
    const request = new NextRequest('http://localhost:3000/api/createGDriveConnector', {
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

### Testing Google Drive Token API

```typescript
// __tests__/api/google-drive-token.test.ts
import { GET } from '../../app/api/get-gdrive-token/route';
import { NextRequest } from 'next/server';

describe('/api/get-gdrive-token', () => {
  it('should generate a Google Drive token successfully', async () => {
    const url = new URL('http://localhost:3000/api/get-gdrive-token');
    url.searchParams.set('userId', 'gdrive-user123');
    url.searchParams.set('connectorId', 'gdrive-connector123');

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBeDefined();
  });
});
```

## User Management Tests

### Testing Google Drive User Management

```typescript
// __tests__/user-management/google-drive.test.ts
import { manageUser } from '@vectorize-io/vectorize-connect';

describe('Google Drive User Management', () => {
  const mockConfig = {
    authorization: 'test-api-key',
    organizationId: 'test-org-id',
  };

  it('should edit Google Drive user successfully', async () => {
    const result = await manageUser(
      mockConfig,
      'gdrive-connector123',
      'gdrive-user123',
      'edit',
      { selectedFiles: ['file1', 'file2'] }
    );

    expect(result).toBeDefined();
  });

  it('should remove Google Drive user successfully', async () => {
    const result = await manageUser(
      mockConfig,
      'gdrive-connector123',
      'gdrive-user123',
      'remove'
    );

    expect(result).toBeDefined();
  });
});
```

## Manual Testing Checklist

### Google Drive Integration
- [ ] Create Google Drive connector with valid Vectorize credentials
- [ ] Generate one-time token for Google Drive user
- [ ] Redirect to Vectorize Google Drive authentication
- [ ] Complete Google Drive file selection
- [ ] Verify files are processed by Vectorize
- [ ] Test Google Drive file selection editing
- [ ] Test Google Drive user removal

### Error Scenarios
- [ ] Invalid Vectorize API credentials
- [ ] Network connectivity issues
- [ ] Expired Google Drive tokens
- [ ] Missing environment variables
- [ ] Google Drive API rate limiting

## Performance Testing

```typescript
// __tests__/performance/google-drive.test.ts
describe('Google Drive Performance Tests', () => {
  it('should create Google Drive connectors within acceptable time', async () => {
    const start = Date.now();
    
    await createVectorizeGDriveConnector(mockConfig, 'Performance Test');
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });

  it('should handle concurrent Google Drive token requests', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      getOneTimeConnectorToken(mockConfig, `gdrive-user${i}`, 'gdrive-connector123')
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
# Run Google Drive specific tests
npm test -- google-drive

# Run Google Drive integration tests
npm test -- integration/google-drive

# Run Google Drive API tests
npm test -- api/google-drive

# Run with coverage
npm test -- --coverage google-drive
```

## Next Steps

- [Google Drive User Management](../../user-management/vectorize/google-drive.md)
- [Google Drive Frontend Implementation](../../frontend-implementation/vectorize/google-drive.md)

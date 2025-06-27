# Google Drive Frontend Implementation - White-Label Approach

Frontend components for Google Drive White-Label connectors.

## Basic Google Drive White-Label Component

```typescript
import React, { useState } from 'react';
import { createWhiteLabelGDriveConnector, GoogleDriveOAuth, manageUser } from '@vectorize-io/vectorize-connect';

interface GoogleDriveWhiteLabelProps {
  onConnectorCreated?: (connectorId: string) => void;
  onUserAdded?: (userId: string) => void;
}

const GoogleDriveWhiteLabel: React.FC<GoogleDriveWhiteLabelProps> = ({
  onConnectorCreated,
  onUserAdded
}) => {
  const [connectorId, setConnectorId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  const createConnector = async () => {
    setIsCreating(true);
    setError('');
    
    try {
      const config = {
        authorization: process.env.NEXT_PUBLIC_VECTORIZE_API_KEY!,
        organizationId: process.env.NEXT_PUBLIC_VECTORIZE_ORGANIZATION_ID!
      };

      const newConnectorId = await createWhiteLabelGDriveConnector(
        config,
        'Google Drive White-Label Connector',
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!
      );

      setConnectorId(newConnectorId);
      onConnectorCreated?.(newConnectorId);
    } catch (err: any) {
      setError(err.message || 'Failed to create Google Drive connector');
    } finally {
      setIsCreating(false);
    }
  };

  const connectUser = async (userId: string) => {
    if (!connectorId) return;
    
    setIsConnecting(true);
    setError('');

    try {
      const oauthConfig = {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
        redirectUri: `${window.location.origin}/api/gdrive-callback`,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        onSuccess: async (response: any) => {
          const vectorizeConfig = {
            authorization: process.env.NEXT_PUBLIC_VECTORIZE_API_KEY!,
            organizationId: process.env.NEXT_PUBLIC_VECTORIZE_ORGANIZATION_ID!
          };

          await manageUser(
            vectorizeConfig,
            connectorId,
            userId,
            'add',
            {
              selectedFiles: response.selectedFiles,
              accessToken: response.accessToken
            }
          );

          onUserAdded?.(userId);
          setIsConnecting(false);
        },
        onError: (error: any) => {
          setError(error.message || 'OAuth failed');
          setIsConnecting(false);
        }
      };

      GoogleDriveOAuth.startOAuth(oauthConfig);
    } catch (err: any) {
      setError(err.message || 'Failed to start OAuth flow');
      setIsConnecting(false);
    }
  };

  return (
    <div className="google-drive-white-label">
      <h3>Google Drive White-Label Connector</h3>
      
      {!connectorId ? (
        <button 
          onClick={createConnector} 
          disabled={isCreating}
          className="btn-primary"
        >
          {isCreating ? 'Creating...' : 'Create Google Drive Connector'}
        </button>
      ) : (
        <div>
          <p>Connector Created: {connectorId}</p>
          <button 
            onClick={() => connectUser('user123')} 
            disabled={isConnecting}
            className="btn-secondary"
          >
            {isConnecting ? 'Connecting...' : 'Connect with Google Drive'}
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default GoogleDriveWhiteLabel;
```

## Advanced Google Drive White-Label Component

```typescript
import React, { useState } from 'react';
import { 
  createWhiteLabelGDriveConnector, 
  GoogleDriveOAuth, 
  manageUser 
} from '@vectorize-io/vectorize-connect';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'connected' | 'pending' | 'error';
  selectedFiles?: any[];
}

const AdvancedGoogleDriveWhiteLabel: React.FC = () => {
  const [connectorId, setConnectorId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const vectorizeConfig = {
    authorization: process.env.NEXT_PUBLIC_VECTORIZE_API_KEY!,
    organizationId: process.env.NEXT_PUBLIC_VECTORIZE_ORGANIZATION_ID!
  };

  const createConnector = async () => {
    setIsLoading(true);
    try {
      const newConnectorId = await createWhiteLabelGDriveConnector(
        vectorizeConfig,
        'Advanced Google Drive White-Label',
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!
      );
      setConnectorId(newConnectorId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addUser = async (userId: string, userName: string, userEmail: string) => {
    if (!connectorId) return;

    const newUser: User = {
      id: userId,
      name: userName,
      email: userEmail,
      status: 'pending'
    };

    setUsers(prev => [...prev, newUser]);

    const oauthConfig = {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
      redirectUri: `${window.location.origin}/api/gdrive-callback`,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      onSuccess: async (response: any) => {
        try {
          await manageUser(
            vectorizeConfig,
            connectorId,
            userId,
            'add',
            {
              selectedFiles: response.selectedFiles,
              accessToken: response.accessToken
            }
          );

          setUsers(prev => 
            prev.map(user => 
              user.id === userId 
                ? { ...user, status: 'connected', selectedFiles: response.selectedFiles }
                : user
            )
          );
        } catch (err: any) {
          setUsers(prev => 
            prev.map(user => 
              user.id === userId 
                ? { ...user, status: 'error' }
                : user
            )
          );
          setError(err.message);
        }
      },
      onError: (error: any) => {
        setUsers(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, status: 'error' }
              : user
          )
        );
        setError(error.message);
      }
    };

    GoogleDriveOAuth.startOAuth(oauthConfig);
  };

  const removeUser = async (userId: string) => {
    if (!connectorId) return;

    try {
      await manageUser(vectorizeConfig, connectorId, userId, 'remove');
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="advanced-google-drive-white-label">
      <h2>Advanced Google Drive White-Label Connector</h2>
      
      {!connectorId ? (
        <button onClick={createConnector} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Connector'}
        </button>
      ) : (
        <div>
          <h3>Connector ID: {connectorId}</h3>
          
          <div className="user-management">
            <h4>Users</h4>
            <button 
              onClick={() => addUser(
                `user_${Date.now()}`, 
                'New User', 
                'user@example.com'
              )}
            >
              Add User
            </button>
            
            <div className="users-list">
              {users.map(user => (
                <div key={user.id} className="user-item">
                  <div className="user-info">
                    <span>{user.name} ({user.email})</span>
                    <span className={`status ${user.status}`}>
                      {user.status}
                    </span>
                    {user.selectedFiles && (
                      <span className="file-count">
                        {user.selectedFiles.length} files selected
                      </span>
                    )}
                  </div>
                  <div className="user-actions">
                    <button 
                      onClick={() => removeUser(user.id)}
                      className="btn-danger"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default AdvancedGoogleDriveWhiteLabel;
```

## Reusable Google Drive White-Label Hook

```typescript
import { useState, useCallback } from 'react';
import { 
  createWhiteLabelGDriveConnector, 
  GoogleDriveOAuth, 
  manageUser 
} from '@vectorize-io/vectorize-connect';

interface UseGoogleDriveWhiteLabelOptions {
  clientId: string;
  clientSecret: string;
  onConnectorCreated?: (connectorId: string) => void;
  onUserAdded?: (userId: string) => void;
  onError?: (error: string) => void;
}

export const useGoogleDriveWhiteLabel = (options: UseGoogleDriveWhiteLabelOptions) => {
  const [connectorId, setConnectorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const vectorizeConfig = {
    authorization: process.env.NEXT_PUBLIC_VECTORIZE_API_KEY!,
    organizationId: process.env.NEXT_PUBLIC_VECTORIZE_ORGANIZATION_ID!
  };

  const createConnector = useCallback(async (name: string = 'Google Drive White-Label Connector') => {
    setIsLoading(true);
    setError('');

    try {
      const newConnectorId = await createWhiteLabelGDriveConnector(
        vectorizeConfig,
        name,
        options.clientId,
        options.clientSecret
      );
      setConnectorId(newConnectorId);
      options.onConnectorCreated?.(newConnectorId);
      return newConnectorId;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create Google Drive connector';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options, vectorizeConfig]);

  const addUser = useCallback(async (userId: string) => {
    if (!connectorId) throw new Error('No connector created');

    return new Promise<void>((resolve, reject) => {
      const oauthConfig = {
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        redirectUri: `${window.location.origin}/api/gdrive-callback`,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        onSuccess: async (response: any) => {
          try {
            await manageUser(
              vectorizeConfig,
              connectorId,
              userId,
              'add',
              {
                selectedFiles: response.selectedFiles,
                accessToken: response.accessToken
              }
            );
            options.onUserAdded?.(userId);
            resolve();
          } catch (err: any) {
            const errorMessage = err.message || 'Failed to add user';
            setError(errorMessage);
            options.onError?.(errorMessage);
            reject(err);
          }
        },
        onError: (error: any) => {
          const errorMessage = error.message || 'OAuth failed';
          setError(errorMessage);
          options.onError?.(errorMessage);
          reject(error);
        }
      };

      GoogleDriveOAuth.startOAuth(oauthConfig);
    });
  }, [connectorId, options, vectorizeConfig]);

  const removeUser = useCallback(async (userId: string) => {
    if (!connectorId) throw new Error('No connector created');

    try {
      await manageUser(vectorizeConfig, connectorId, userId, 'remove');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to remove user';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    }
  }, [connectorId, options, vectorizeConfig]);

  return {
    connectorId,
    isLoading,
    error,
    createConnector,
    addUser,
    removeUser
  };
};
```

## Next Steps

- [Google Drive User Management](../../user-management/white-label/google-drive.md)
- [Google Drive Testing](../../testing/white-label/google-drive.md)

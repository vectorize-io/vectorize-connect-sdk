// Custom error types
class OAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

class ConfigurationError extends OAuthError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

class TokenError extends OAuthError {
  constructor(message: string, details?: any) {
    super(message, 'TOKEN_ERROR', details);
    this.name = 'TokenError';
  }
}

class PickerError extends OAuthError {
  constructor(message: string, details?: any) {
    super(message, 'PICKER_ERROR', details);
    this.name = 'PickerError';
  }
}

// Interfaces
interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  redirectUri: string;
  scopes?: string[];
  onSuccess?: (selectedFields?: any) => void;
  onError?: (error: OAuthError) => void;
}

interface OAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

interface DriveSelection {
  files: DriveFile[];
}

// Validation function
function validateConfig(config: OAuthConfig): void {
  if (!config.clientId) {
    throw new ConfigurationError('Client ID is required');
  }
  if (!config.redirectUri) {
    throw new ConfigurationError('Redirect URI is required');
  }
  if (!config.apiKey) {
    throw new ConfigurationError('API key is required');
  }
  if (!config.clientSecret) {
    throw new ConfigurationError('Client secret is required');
  }
}

// Create error response helper
function createErrorResponse(error: OAuthError): Response {
  return new Response(
    `<script>
      const errorObj = ${JSON.stringify(error)};
      const reconstructedError = new (window.opener.OAuthError || Error)(
        errorObj.message,
        errorObj.code,
        errorObj.details
      );
      window.opener.__oauthHandler?.onError(reconstructedError);
      window.close();
    </script>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// Main popup creation function
function createOAuthPopup(config: OAuthConfig): Window | null {
  try {
    validateConfig(config);

    const {
      clientId,
      redirectUri,
      scopes = [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ],
      onSuccess,
      onError,
    } = config;

    // Store configuration for the callback to access
    (window as any).__oauthHandler = {
      onSuccess,
      onError: (error: string | OAuthError) => {
        if (typeof error === 'string') {
          error = new OAuthError(error, 'UNKNOWN_ERROR');
        }
        onError?.(error);
      },
      config,
      OAuthError // Make error constructor available to popup
    };

    // Build OAuth URL with parameters
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes.join(' ')
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Open centered popup
    const width = 1200;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'OAuth2 Login',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (!popup) {
      throw new OAuthError('Failed to open popup window. Please check if popups are blocked.', 'POPUP_BLOCKED');
    }

    // Monitor popup and cleanup
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        delete (window as any).__oauthHandler;
      }
    }, 500);

    return popup;
  } catch (error) {
    if (error instanceof OAuthError) {
      config.onError?.(error);
    } else {
      config.onError?.(new OAuthError(
        error instanceof Error ? error.message : 'An unknown error occurred',
        'UNKNOWN_ERROR',
        error
      ));
    }
    return null;
  }
}

// Token exchange function
async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<OAuthResponse> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new TokenError(
        data.error_description || data.error || 'Failed to exchange code for tokens',
        {
          statusCode: response.status,
          errorCode: data.error,
          errorDetails: data
        }
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TokenError) {
      throw error;
    }
    throw new TokenError(
      'Failed to exchange code for tokens',
      {
        originalError: error instanceof Error ? error.message : error
      }
    );
  }
}

// Create response for callback page
async function createCallbackResponse(
  code: string,
  config: OAuthConfig,
  error?: string | OAuthError
): Promise<Response> {
  if (error) {
    const errorObj = typeof error === 'string' ? new OAuthError(error, 'CALLBACK_ERROR') : error;
    return createErrorResponse(errorObj);
  }

  try {
    const tokens = await exchangeCodeForTokens(
      code,
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <script src="https://apis.google.com/js/api.js"></script>
        <script src="https://apis.google.com/js/platform.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div class="p-6">
          <div class="space-y-6">
            <div class="flex justify-between items-center">
              <h1 class="text-2xl font-bold">Selected Files and Folders</h1>
              <button 
                onclick="handleSelectMore()"
                class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Select Files/Folders
              </button>
            </div>
            
            <div id="fileList" class="space-y-4">
              <p>No files selected</p>
            </div>
  
            <div id="submitButton" class="flex justify-end mt-6" style="display: none;">
              <button
                onclick="finishSelection()"
                class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                Finish Selection
              </button>
            </div>
          </div>
        </div>
  
        <script>
          const tokens = ${JSON.stringify(tokens)};
          const config = window.opener.__oauthHandler.config;
          let selectedFiles = [];
  
          function handleError(error) {
            const errorObj = new (window.opener.OAuthError || Error)(
              error.message || 'An error occurred in the picker',
              error.code || 'PICKER_ERROR',
              error.details
            );
            window.opener.__oauthHandler.onError(errorObj);
            window.close();
          }
  
          function loadPicker() {
            try {
              window.gapi.load('picker', initPicker);
            } catch (error) {
              handleError({
                message: 'Failed to load Google Picker API',
                code: 'PICKER_LOAD_ERROR',
                details: error
              });
            }
          }
  
          function initPicker() {
            createPicker(tokens.access_token);
          }
  
          function createPicker(token) {
            if (!token) {
              handleError({
                message: 'No access token available',
                code: 'TOKEN_MISSING'
              });
              return;
            }
  
            try {
              const myDriveView = new google.picker.DocsView()
                .setIncludeFolders(true)
                .setSelectFolderEnabled(true)
                .setParent('root')
                .setLabel('My Drive');
    
              const sharedDriveView = new google.picker.DocsView(google.picker.ViewId.DOCS)
                .setEnableTeamDrives(true)
                .setIncludeFolders(true)
                .setSelectFolderEnabled(true)
                .setLabel('Shared Drives');
    
              const sharedWithMeView = new google.picker.DocsView(google.picker.ViewId.SHARED_WITH_ME)
                .setIncludeFolders(true)
                .setOwnedByMe(false)
                .setSelectFolderEnabled(true)
                .setLabel('Shared with me');
    
              const picker = new google.picker.PickerBuilder()
                .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
                .addView(myDriveView)
                .addView(sharedDriveView)
                .addView(sharedWithMeView)
                .setOAuthToken(token)
                .setDeveloperKey(config.apiKey)
                .setCallback(handlePickerCallback)
                .build();
    
              picker.setVisible(true);
            } catch (error) {
              handleError({
                message: 'Failed to create picker',
                code: 'PICKER_CREATE_ERROR',
                details: error
              });
            }
          }
  
          function handlePickerCallback(data) {
            if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
              const newDocs = data[google.picker.Response.DOCUMENTS];
              const existingIds = new Set(selectedFiles.map(file => file.id));
              const uniqueNewFiles = newDocs.filter(file => !existingIds.has(file.id));
              selectedFiles = [...selectedFiles, ...uniqueNewFiles];
              updateFileList();
            }
          }
  
          function updateFileList() {
            const fileList = document.getElementById('fileList');
            const submitButton = document.getElementById('submitButton');
  
            if (selectedFiles.length === 0) {
              fileList.innerHTML = '<p>No files selected</p>';
              submitButton.style.display = 'none';
              return;
            }
  
            fileList.innerHTML = selectedFiles.map(file => 
              \`<div class="group p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p class="font-medium text-gray-800">
                    \${file.name}
                  </p>
                  <p class="text-sm text-gray-500">
                    Type: \${file.mimeType}
                  </p>
                </div>
                <button
                  onclick="removeFile('\${file.id}')"
                  class="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  aria-label="Remove file"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>\`
            ).join('');
  
            submitButton.style.display = 'flex';
          }
  
          function removeFile(fileId) {
            selectedFiles = selectedFiles.filter(file => file.id !== fileId);
            updateFileList();
          }
  
          function handleSelectMore() {
            loadPicker();
          }
  
          async function finishSelection() {
            try {
              if (!selectedFiles.length) {
                throw new Error('No files selected');
              }

              const bodyData = {
                fileIds: selectedFiles.map(file => file.id),
                refreshToken: tokens.refresh_token
              };

              window.opener.__oauthHandler.onSuccess(bodyData);
              window.close();
            } catch (error) {
              handleError({
                message: error.message || 'Failed to complete file selection',
                code: 'SELECTION_ERROR',
                details: error
              });
            }
          }
  
          // Initialize picker
          loadPicker();
        </script>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    return createErrorResponse(
      error instanceof OAuthError ? error : new OAuthError(
        error instanceof Error ? error.message : 'Failed to create callback page',
        'CALLBACK_ERROR',
        error
      )
    );
  }
}

// Refresh token utility
async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<OAuthResponse> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new TokenError(
        data.error_description || data.error || 'Failed to refresh token',
        {
          statusCode: response.status,
          errorCode: data.error,
          errorDetails: data
        }
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TokenError) {
      throw error;
    }
    throw new TokenError(
      'Failed to refresh access token',
      {
        originalError: error instanceof Error ? error.message : error
      }
    );
  }
}

// Export everything needed for external use
export {
  createOAuthPopup,
  exchangeCodeForTokens,
  createCallbackResponse,
  refreshAccessToken,
  // Error classes
  OAuthError,
  ConfigurationError,
  TokenError,
  PickerError
};

export type {
  OAuthConfig,
  OAuthResponse,
  DriveSelection,
  DriveFile
};
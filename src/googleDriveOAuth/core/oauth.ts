import { OAuthConfig, OAuthResponse, OAuthError, VectorizeAPIConfig } from '../types';
import { validateConfig, createErrorResponse } from '../utils/validation';
import { exchangeGDriveCodeForTokens } from '../utils/token';
import { GoogleDrivePicker } from '../ui/picker';

/**
 * Creates an OAuth popup window for Google authentication
 * @param config The OAuth configuration
 * @returns The popup window instance or null if creation failed
 */
export function startGDriveOAuth(config: OAuthConfig): Window | null {
  try {
    validateConfig(config);

    const {
      clientId,
      redirectUri,
      scopes = [
        'https://www.googleapis.com/auth/drive.file',
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
      OAuthError // Make error constructor available to the popup
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

    // Create a new popup window with centered positioning
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
      throw new OAuthError(
        'Failed to open popup window. Please check if popups are blocked.',
        'POPUP_BLOCKED'
      );
    }

    // Monitor popup and cleanup
    const checkPopup = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkPopup);
        delete (window as any).__oauthHandler;
      }
    }, 500);

    return popup;
  } catch (error) {
    if (error instanceof OAuthError) {
      config.onError?.(error);
    } else {
      config.onError?.(
        new OAuthError(
          error instanceof Error ? error.message : 'An unknown error occurred',
          'UNKNOWN_ERROR',
          error
        )
      );
    }
    return null;
  }
}

/**
 * Creates a response for the OAuth callback page
 * @param code Authorization code from the OAuth redirect
 * @param config The OAuth configuration
 * @param error Optional error from the OAuth process
 * @returns A Response object with the callback page
 */
export async function createGDrivePickerCallbackResponse(
  code: string,
  config: OAuthConfig,
  error?: string | OAuthError
): Promise<Response> {
  if (error) {
    const errorObj = typeof error === 'string' ? new OAuthError(error, 'CALLBACK_ERROR') : error;
    return createErrorResponse(errorObj);
  }

  try {
    const tokens = await exchangeGDriveCodeForTokens(
      code,
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    // Use the centralized picker template
    const htmlContent = GoogleDrivePicker.createPickerHTML(tokens, config, tokens.refresh_token);
    
    return new Response(htmlContent, { headers: { 'Content-Type': 'text/html' } });
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

/**
 * Redirects to the platform's Google Drive connection page with configuration.
 * The connection page will handle the selection process and communicate
 * back to the parent window using postMessage.
 *
 * @param config VectorizeAPIConfig containing authorization and organizationId
 * @param userId User identifier for the connection
 * @param connectorId ID of the Google Drive connector to which the user will be automatically added
 * @param platformUrl Optional URL of the Vectorize platform (primarily used for testing)
 * @returns Promise that resolves when the iframe is closed
 */
export function redirectToVectorizeGoogleDriveConnect(
  config: VectorizeAPIConfig,
  userId: string,
  connectorId: string,
  platformUrl: string = 'https://platform.vectorize.io'
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Validate config
      if (!config || !config.authorization || !config.organizationId) {
        reject(new Error('Valid VectorizeAPIConfig with authorization and organizationId is required'));
        return;
      }

      // Set cookies for configuration
      const setCookie = (name: string, value: string, path: string = '/') => {
        // Encode the value to handle special characters
        const encodedValue = encodeURIComponent(value);
        // Set cookie with same-site attribute to ensure it's available in the iframe
        document.cookie = `${name}=${encodedValue}; path=${path}; SameSite=None; Secure`;
      };

      // Set configuration values as cookies
      setCookie('authorization', config.authorization);
      setCookie('organizationId', config.organizationId);
      setCookie('connectorId', connectorId);
      setCookie('userId', userId);

      // Build the redirect URL with encoded connectorId
      const connectUrl = `${platformUrl}/connect/google-drive`;


      // Create iframe element
      const iframe = document.createElement('iframe');
      iframe.src = connectUrl;
      iframe.id = 'vectorize-connect-iframe';
      
      // Style the iframe to fill the container
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.backgroundColor = 'white';
      
      // Create a container for the iframe and close button
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '50%';
      container.style.left = '50%';
      container.style.transform = 'translate(-50%, -50%)';
      container.style.width = '40%';
      container.style.height = '40%';
      container.style.zIndex = '9999';
      container.style.borderRadius = '8px';
      container.style.overflow = 'hidden';
      container.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      
      // Create a close button inside the iframe container
      const closeButton = document.createElement('button');
      closeButton.textContent = '✕';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '10px';
      closeButton.style.right = '10px';
      closeButton.style.zIndex = '10000';
      closeButton.style.backgroundColor = '#f44336';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '50%';
      closeButton.style.width = '30px';
      closeButton.style.height = '30px';
      closeButton.style.fontSize = '16px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.display = 'flex';
      closeButton.style.alignItems = 'center';
      closeButton.style.justifyContent = 'center';
      
      // Add the iframe and close button to the container
      container.appendChild(iframe);
      container.appendChild(closeButton);
      
      // Function to clean up the container, cookies and resolve the promise
      const cleanupIframe = () => {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
        
        // Clear the cookies by setting expiration date in the past
        document.cookie = "authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure";
        document.cookie = "organizationId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure";
        document.cookie = "connectorId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure";
        document.cookie = "vectorize-config-set=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure";
        
        clearTimeout(timeout);
        resolve();
      };
      
      // Add event listener to close button
      closeButton.addEventListener('click', cleanupIframe);
      
      // Add the container to the document
      document.body.appendChild(container);
      
      // Add a message event listener to detect when the iframe is done
      window.addEventListener('message', function messageHandler(event) {
        // Check if the message is from the Vectorize platform
        if (event.origin.includes('vectorize.io')) {
          if (event.data === 'vectorize-connect-complete') {
            // Connection process completed
            window.removeEventListener('message', messageHandler);
            cleanupIframe();
          }
        }
      });
      
      // Add a timeout (5 minutes)
      const timeout = setTimeout(() => {
        cleanupIframe();
        reject(new Error('Operation timed out after 5 minutes'));
      }, 5 * 60 * 1000);

    } catch (error) {
      reject(error);
    }
  });
}

import { OAuthConfig, OAuthResponse, OAuthError } from '../types';
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
 * Redirects to the platform's Google Drive connection page with a callback URI.
 * The connection page will make a POST request directly to the callback URI
 * and then close itself.
 *
 * @param callbackUri Required URI that will receive the POST with selection data
 * @param platformUrl Optional URL of the Vectorize platform
 * @returns Promise that resolves when the new tab is closed
 */
export function redirectToVectorizeGoogleDriveConnect(
  callbackUri: string,
  platformUrl: string = 'https://platform.vectorize.io'
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Validate callback URI
      if (!callbackUri) {
        reject(new Error('Callback URI is required'));
        return;
      }

      // Encode the callback URI
      const encodedCallback = encodeURIComponent(callbackUri);

      // Build the redirect URL with callback parameter
      const connectUrl = `${platformUrl}/connect/google-drive?callback=${encodedCallback}`;

      // Always open in a new tab
      const newTab = window.open(connectUrl, '_blank');
      if (!newTab) {
        reject(new Error('Failed to open new tab. Please check if popups are blocked.'));
        return;
      }

      // Poll to detect when the new tab is closed
      const checkTab = setInterval(() => {
        if (newTab.closed) {
          clearInterval(checkTab);
          clearTimeout(timeout);
          resolve();
        }
      }, 500);

      // Add a timeout (5 minutes)
      const timeout = setTimeout(() => {
        clearInterval(checkTab);
        if (!newTab.closed) {
          newTab.close();
          reject(new Error('Operation timed out after 5 minutes'));
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      reject(error);
    }
  });
}
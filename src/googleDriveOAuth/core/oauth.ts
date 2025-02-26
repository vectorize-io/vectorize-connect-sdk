import { OAuthConfig, OAuthResponse, OAuthError } from '../types';
import { validateConfig, createErrorResponse } from '../utils/validation';
import { exchangeCodeForTokens } from '../utils/token';
import { GoogleDrivePicker } from '../ui/picker';

/**
 * Creates an OAuth popup window for Google authentication
 * @param config The OAuth configuration
 * @returns The popup window instance or null if creation failed
 */
export function createOAuthPopup(config: OAuthConfig): Window | null {
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

/**
 * Creates a response for the OAuth callback page
 * @param code Authorization code from the OAuth redirect
 * @param config The OAuth configuration
 * @param error Optional error from the OAuth process
 * @returns A Response object with the callback page
 */
export async function createCallbackResponse(
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
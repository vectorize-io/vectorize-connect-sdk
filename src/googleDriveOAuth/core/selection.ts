import { OAuthConfig, OAuthError, TokenError } from '../types';
import { validateConfig } from '../utils/validation';
import { refreshAccessToken } from '../utils/token';
import { GoogleDrivePicker } from '../ui/picker';

/**
 * Creates a popup for file selection using an existing refresh token
 * @param config The OAuth configuration
 * @param refreshToken An existing refresh token to use
 * @returns The popup window instance or null if creation failed
 */
export async function createFileSelectionPopup(
  config: OAuthConfig,
  refreshToken: string
): Promise<Window | null> {
  try {
    validateConfig(config);

    const {
      clientId,
      clientSecret,
      apiKey,
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

    try {
      // Refresh the token first
      const tokens = await refreshAccessToken(clientId, clientSecret, refreshToken);
      
      // Create a blank popup window first
      const width = 1200;
      const height = 800;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        'about:blank',
        'File Selection',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      if (!popup) {
        throw new OAuthError('Failed to open popup window. Please check if popups are blocked.', 'POPUP_BLOCKED');
      }
      
      // Generate the file picker content using the central module
      const content = GoogleDrivePicker.createPickerHTML(tokens, config, refreshToken);
      
      // Write the HTML content to the popup
      popup.document.open();
      popup.document.write(content);
      popup.document.close();

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
        throw error;
      }
      throw new TokenError(
        error instanceof Error ? error.message : 'Failed to refresh token or create selection popup',
        {
          originalError: error
        }
      );
    }
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
// dropboxOAuth/core/OAuth.ts

import { BaseOAuth } from '../../baseOAuth/core/oauth';
import { OAuthConfig, OAuthError, OAuthResponse } from '../../baseOAuth/types';
import { DropboxOAuthConfig } from '../types';
import { exchangeDropboxCodeForTokens } from '../utils/token';
import { DropboxPicker } from '../ui/picker';

/**
 * Dropbox specific OAuth implementation
 */
export class DropboxOAuth extends BaseOAuth {
  /**
   * Validates Dropbox specific configuration
   * @param config The OAuth configuration to validate
   * @throws OAuthError if configuration is invalid
   */
  protected static override validateConnectorConfig(config: OAuthConfig): void {
    const dropboxConfig = config as DropboxOAuthConfig;
    
    if (!dropboxConfig.appKey) {
      throw new OAuthError('Missing appKey in configuration', 'CONFIGURATION_ERROR');
    }
    
    if (!dropboxConfig.appSecret) {
      throw new OAuthError('Missing appSecret in configuration', 'CONFIGURATION_ERROR');
    }
  }

  /**
   * Creates an OAuth popup window for Dropbox authentication
   * @param config The OAuth configuration
   * @returns The popup window instance or null if creation failed
   */
  public static override startOAuth(config: DropboxOAuthConfig): Window | null {
    try {
      this.validateConfig(config);

      const {
        appKey,
        redirectUri,
        scopes = ["files.metadata.read", "files.content.read"],
      } = config;

      // Set up the OAuth handler in the window
      this.setupOAuthHandler(config);

      // Build OAuth URL with parameters
      const params = new URLSearchParams({
        client_id: appKey,
        redirect_uri: redirectUri,
        response_type: "code",
        token_access_type: "offline",
        scope: scopes.join(' ')
      });

      const authUrl = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;

      // Create the popup window
      const popup = this.createOAuthPopup(authUrl, 'Dropbox OAuth Login');
      
      // Monitor the popup
      if (popup) {
        this.monitorPopup(popup);
      }

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
   * @param nonce Optional nonce for Content Security Policy
   * @returns A Response object with the callback page
   */
  public static override async createCallbackResponse(
    code: string,
    config: DropboxOAuthConfig,
    error?: string | OAuthError,
    nonce?: string
  ): Promise<Response> {
    if (error) {
      const errorObj = typeof error === 'string' ? new OAuthError(error, 'CALLBACK_ERROR') : error;
      return this.createErrorResponse(errorObj);
    }

    try {
      const tokens = await exchangeDropboxCodeForTokens(
        code,
        config.appKey,
        config.appSecret,
        config.redirectUri
      );

      // Use the Dropbox picker template
      const htmlContent = DropboxPicker.createPickerHTML(tokens, config, tokens.refresh_token, undefined, nonce);

      return new Response(htmlContent, { headers: { 'Content-Type': 'text/html' } });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof OAuthError ? error : new OAuthError(
          error instanceof Error ? error.message : 'Failed to create callback page',
          'CALLBACK_ERROR',
          error
        )
      );
    }
  }

  /**
   * Redirects the user to the Vectorize Dropbox connector authentication flow
   * with a one-time token for security
   *
   * @param oneTimeToken The security token for authentication
   * @param organizationId Organization ID for the connection
   * @param platformUrl Optional URL of the Vectorize platform (primarily used for testing)
   * @returns Promise that resolves when the redirect is ready
   */
  public static override async redirectToVectorizeConnect(
    oneTimeToken: string,
    organizationId: string,
    platformUrl: string = 'https://platform.vectorize.io'
  ): Promise<void> {
    // Build the redirect URL with the token as a query parameter
    const connectUrl = new URL(`${platformUrl}/connect/dropbox`);
    connectUrl.searchParams.append('token', oneTimeToken);
    connectUrl.searchParams.append('organizationId', organizationId);

    // Use the base iframe implementation with Dropbox specific settings
    return this.createConnectIframe(connectUrl.toString(), {
      originPattern: /vectorize\.io$/,
      successMessage: 'vectorize-connect-complete'
    });
  }

  /**
 * Redirects the user to the Vectorize Dropbox connector edit flow
 * with a one-time token for security
 *
 * @param oneTimeToken The security token for authentication
 * @param organizationId Organization ID for the connection
 * @param platformUrl Optional URL of the Vectorize platform (primarily used for testing)
 * @returns Promise that resolves when the redirect is ready
 */
public static override async redirectToVectorizeEdit(
  oneTimeToken: string,
  organizationId: string,
  platformUrl: string = 'https://platform.vectorize.io'
): Promise<void> {
  // Build the redirect URL with the token as a query parameter
  const editUrl = new URL(`${platformUrl}/connect/dropbox/edit`);
  editUrl.searchParams.append('token', oneTimeToken);
  editUrl.searchParams.append('organizationId', organizationId);

  // Use the base iframe implementation with Dropbox specific settings
  return this.createConnectIframe(editUrl.toString(), {
    originPattern: /vectorize\.io$/,
    successMessage: 'vectorize-edit-complete'
  });
}
}
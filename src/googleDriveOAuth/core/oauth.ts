import { OAuthConfig, OAuthError, OAuthResponse } from '../../baseOAuth/types';
import { GoogleDriveOAuthConfig } from '../types';
import { exchangeGDriveCodeForTokens } from '../utils/token';
import { GoogleDrivePicker } from '../ui/picker';
import { BaseOAuth } from '../../baseOAuth/core/oauth';

/**
 * Google Drive specific OAuth implementation
 */
export class GoogleDriveOAuth extends BaseOAuth {
  /**
   * Validates Google Drive specific configuration
   * @param config The OAuth configuration to validate
   * @throws OAuthError if configuration is invalid
   */
  protected static override validateConnectorConfig(config: OAuthConfig): void {
    const gDriveConfig = config as GoogleDriveOAuthConfig;
    
    if (!gDriveConfig.clientId) {
      throw new OAuthError('Missing clientId in configuration', 'CONFIGURATION_ERROR');
    }
    
    if (!gDriveConfig.clientSecret) {
      throw new OAuthError('Missing clientSecret in configuration', 'CONFIGURATION_ERROR');
    }
    
    if (!gDriveConfig.apiKey) {
      throw new OAuthError('Missing apiKey in configuration', 'CONFIGURATION_ERROR');
    }
  }

  /**
   * Creates an OAuth popup window for Google authentication
   * @param config The OAuth configuration
   * @returns The popup window instance or null if creation failed
   */
  public static override startOAuth(config: GoogleDriveOAuthConfig): Window | null {
    try {
      this.validateConfig(config);

      const {
        clientId,
        redirectUri,
        scopes = [
          'https://www.googleapis.com/auth/drive.file',
        ],
      } = config;

      // Set up the OAuth handler in the window
      this.setupOAuthHandler(config);

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

      // Create the popup window
      const popup = this.createOAuthPopup(authUrl, 'Google Drive OAuth Login');
      
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
   * @returns A Response object with the callback page
   */
  public static override async createCallbackResponse(
    code: string,
    config: GoogleDriveOAuthConfig,
    error?: string | OAuthError
  ): Promise<Response> {
    if (error) {
      const errorObj = typeof error === 'string' ? new OAuthError(error, 'CALLBACK_ERROR') : error;
      return this.createErrorResponse(errorObj, nonce);
    }

    try {
      const tokens = await exchangeGDriveCodeForTokens(
        code,
        config.clientId,
        config.clientSecret,
        config.redirectUri
      );

      // Use the Google Drive picker template
      const htmlContent = GoogleDrivePicker.createPickerHTML(tokens, config, tokens.refresh_token);
      
      return new Response(htmlContent, { headers: { 'Content-Type': 'text/html' } });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof OAuthError ? error : new OAuthError(
          error instanceof Error ? error.message : 'Failed to create callback page',
          'CALLBACK_ERROR',
          error
        ),
        nonce
      );
    }
  }

  /**
   * Redirects the user to the Vectorize Google Drive connector authentication flow
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
    const connectUrl = new URL(`${platformUrl}/connect/google-drive`);
    connectUrl.searchParams.append('token', oneTimeToken);
    connectUrl.searchParams.append('organizationId', organizationId);

    // Use the base iframe implementation with Google Drive specific settings
    return this.createConnectIframe(connectUrl.toString(), {
      originPattern: /vectorize\.io$/,
      successMessage: 'vectorize-connect-complete'
    });
  }

  /**
   * Redirects the user to the Vectorize Google Drive connector edit flow
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
    const editUrl = new URL(`${platformUrl}/connect/google-drive/edit`);
    editUrl.searchParams.append('token', oneTimeToken);
    editUrl.searchParams.append('organizationId', organizationId);

    // Use the base iframe implementation with Google Drive specific settings
    return this.createConnectIframe(editUrl.toString(), {
      originPattern: /vectorize\.io$/,
      successMessage: 'vectorize-edit-complete'
    });
  }
}
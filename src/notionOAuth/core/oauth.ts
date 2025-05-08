import { BaseOAuth } from '../../baseOAuth/core/oauth';
import { OAuthConfig, OAuthError, OAuthResponse } from '../../baseOAuth/types';
import { NotionOAuthConfig } from '../types';
import { exchangeNotionCodeForTokens } from '../utils/token';
import { NotionPicker } from '../ui/picker';

/**
 * Notion specific OAuth implementation
 */
export class NotionOAuth extends BaseOAuth {
  /**
   * Validates Notion specific configuration
   * @param config The OAuth configuration to validate
   * @throws OAuthError if configuration is invalid
   */
  protected static override validateConnectorConfig(config: OAuthConfig): void {
    const notionConfig = config as NotionOAuthConfig;
    
    if (!notionConfig.clientId) {
      throw new OAuthError('Missing clientId in configuration', 'CONFIGURATION_ERROR');
    }
    
    if (!notionConfig.clientSecret) {
      throw new OAuthError('Missing clientSecret in configuration', 'CONFIGURATION_ERROR');
    }
  }

  /**
   * Creates an OAuth popup window for Notion authentication
   * @param config The OAuth configuration
   * @returns The popup window instance or null if creation failed
   */
  public static override startOAuth(config: NotionOAuthConfig): Window | null {
    try {
      this.validateConfig(config);

      const {
        clientId,
        redirectUri,
        scopes = ["page:read", "database:read"],
      } = config;

      // Set up the OAuth handler in the window
      this.setupOAuthHandler(config);

      // Build OAuth URL with parameters
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        owner: "user",
        scope: scopes.join(' ')
      });

      const authUrl = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;

      // Create the popup window
      const popup = this.createOAuthPopup(authUrl, 'Notion OAuth Login');
      
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
    config: NotionOAuthConfig,
    error?: string | OAuthError
  ): Promise<Response> {
    if (error) {
      const errorObj = typeof error === 'string' ? new OAuthError(error, 'CALLBACK_ERROR') : error;
      return this.createErrorResponse(errorObj);
    }

    try {
      const tokens = await exchangeNotionCodeForTokens(
        code,
        config.clientId,
        config.clientSecret,
        config.redirectUri
      );

      // Use the Notion picker template
      const htmlContent = NotionPicker.createPickerHTML(tokens, config, tokens.access_token);
      
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
   * Redirects the user to the Vectorize Notion connector authentication flow
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
    const connectUrl = new URL(`${platformUrl}/connect/notion`);
    connectUrl.searchParams.append('token', oneTimeToken);
    connectUrl.searchParams.append('organizationId', organizationId);

    // Use the base iframe implementation with Notion specific settings
    return this.createConnectIframe(connectUrl.toString(), {
      originPattern: /vectorize\.io$/,
      successMessage: 'vectorize-connect-complete'
    });
  }

  /**
   * Redirects the user to the Vectorize Notion connector edit flow
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
    const editUrl = new URL(`${platformUrl}/connect/notion/edit`);
    editUrl.searchParams.append('token', oneTimeToken);
    editUrl.searchParams.append('organizationId', organizationId);

    // Use the base iframe implementation with Notion specific settings
    return this.createConnectIframe(editUrl.toString(), {
      originPattern: /vectorize\.io$/,
      successMessage: 'vectorize-edit-complete'
    });
  }
}
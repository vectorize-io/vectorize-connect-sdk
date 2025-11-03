import { OAuthConfig, OAuthError, OAuthResponse } from '../types';

/**
 * Base OAuth class that provides common functionality for all OAuth connectors
 */
export abstract class BaseOAuth {
  /**
   * Validates the OAuth configuration
   * @param config The OAuth configuration to validate
   * @throws OAuthError if configuration is invalid
   */
  protected static validateConfig(config: OAuthConfig): void {
    // Base validation for common OAuth fields
    if (!config.redirectUri) {
      throw new OAuthError('Missing redirectUri in configuration', 'CONFIGURATION_ERROR');
    }

    // Custom validation for specific connector implementations
    this.validateConnectorConfig(config);
  }

  /**
   * To be implemented by subclasses for connector-specific configuration validation
   * @param config The OAuth configuration to validate
   * @throws OAuthError if configuration is invalid
   */
  protected static validateConnectorConfig(config: OAuthConfig): void {
    // To be implemented by subclasses
  }

  /**
   * Creates an OAuth popup window for authentication
   * @param authUrl The authorization URL to open in the popup
   * @param popupTitle The title for the popup window
   * @returns The popup window instance or null if creation failed
   */
  protected static createOAuthPopup(authUrl: string, popupTitle: string = 'OAuth Login'): Window | null {
    // Create a new popup window with centered positioning
    const width = 1200;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      popupTitle,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (!popup) {
      throw new OAuthError(
        'Failed to open popup window. Please check if popups are blocked.',
        'POPUP_BLOCKED'
      );
    }

    return popup;
  }

  /**
   * Cleans up OAuth handler from window object
   */
  protected static cleanupOAuthHandler(): void {
    delete (window as any).__oauthHandler;
  }

  /**
   * Sets up OAuth handler in window object for callback
   * @param config The OAuth configuration
   */
  protected static setupOAuthHandler(config: OAuthConfig): void {
    const { onSuccess, onError } = config;

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
  }

  /**
   * Monitor popup and cleanup when closed
   * @param popup The popup window to monitor
   */
  protected static monitorPopup(popup: Window): void {
    const checkPopup = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkPopup);
        this.cleanupOAuthHandler();
      }
    }, 500);
  }

  /**
   * Abstract method to start the OAuth flow
   * To be implemented by subclasses
   * @param config The OAuth configuration
   * @returns The popup window instance or null if creation failed
   */
  public static startOAuth(config: OAuthConfig): Window | null {
    throw new Error('Method not implemented');
  }

  /**
   * Create an error response for the OAuth callback
   * @param error The error to include in the response
   * @param nonce Optional nonce for Content Security Policy
   * @returns A Response object with the error
   */
  protected static createErrorResponse(error: OAuthError, nonce?: string): Response {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .error { color: #f44336; }
        </style>
        <script${nonce ? ` nonce="${nonce}"` : ''}>
          window.onload = function() {
            if (window.opener && window.opener.__oauthHandler) {
              const errorObj = ${JSON.stringify({
                message: error.message,
                code: error.code,
                details: error.details
              })};

              window.opener.__oauthHandler.onError(
                new window.opener.__oauthHandler.OAuthError(
                  errorObj.message,
                  errorObj.code,
                  errorObj.details
                )
              );
              window.close();
            }
          };
        </script>
      </head>
      <body>
        <h2 class="error">Authentication Error</h2>
        <p>${error.message}</p>
        <p>This window will close automatically.</p>
      </body>
      </html>
    `;

    return new Response(htmlContent, { headers: { 'Content-Type': 'text/html' } });
  }

  /**
   * Abstract method to create a callback response
   * To be implemented by subclasses
   * @param code Authorization code from the OAuth redirect
   * @param config The OAuth configuration
   * @param error Optional error from the OAuth process
   * @returns A Response object with the callback page
   */
  public static createCallbackResponse(
    code: string,
    config: OAuthConfig,
    error?: string | OAuthError
  ): Promise<Response> {
    throw new Error('Method not implemented');
  }

  /**
   * Creates an iframe for connecting to a platform
   * @param url The URL to load in the iframe
   * @param options Configuration options for the iframe
   * @returns A promise that resolves when the iframe is closed or errors
   */
  protected static createConnectIframe(
    url: string,
    options: {
      width?: string;
      height?: string;
      timeoutMs?: number;
      originPattern?: RegExp;
      successMessage?: string;
    } = {}
  ): Promise<void> {
    const {
      width = '40%',
      height = '40%',
      timeoutMs = 5 * 60 * 1000, // 5 minutes default
      originPattern = /vectorize\.io$/,
      successMessage = 'connect-complete'
    } = options;

    return new Promise<void>((resolve, reject) => {
      try {
        // Create iframe element
        const iframe = document.createElement('iframe');
        iframe.src = url;
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
        container.style.width = width;
        container.style.height = height;
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
        
        // Function to clean up the container and resolve the promise
        const cleanupIframe = () => {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
          
          clearTimeout(timeout);
          resolve();
        };
        
        // Add event listener to close button
        closeButton.addEventListener('click', cleanupIframe);
        
        // Add the container to the document
        document.body.appendChild(container);
        
        // Add a message event listener to detect when the iframe is done
        window.addEventListener('message', function messageHandler(event) {
          // Check if the message is from the expected origin
          if (originPattern.test(event.origin)) {
            if (event.data === successMessage) {
              // Connection process completed
              window.removeEventListener('message', messageHandler);
              cleanupIframe();
            }
          }
        });
        
        // Add a timeout
        const timeout = setTimeout(() => {
          cleanupIframe();
          reject(new Error(`Operation timed out after ${timeoutMs/1000} seconds`));
        }, timeoutMs);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Abstract method to redirect to Vectorize platform connect
   * To be implemented by subclasses
   * @param oneTimeToken The token for authentication
   * @param organizationId The organization ID
   * @param platformUrl The platform URL
   */
  public static redirectToVectorizeConnect(
    oneTimeToken: string,
    organizationId: string,
    platformUrl: string
  ): Promise<void> {
    throw new Error('Method not implemented');
  }

  /**
   * Abstract method to redirect to Vectorize platform for editing files
   * To be implemented by subclasses
   * @param oneTimeToken The token for authentication
   * @param organizationId The organization ID
   * @param platformUrl The platform URL
   */
  public static redirectToVectorizeEdit(
    oneTimeToken: string,
    organizationId: string,
    platformUrl: string
  ): Promise<void> {
    throw new Error('Method not implemented');
  }
}
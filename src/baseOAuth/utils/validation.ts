import { OAuthConfig, OAuthError } from '../types';

/**
 * Validates the basic OAuth configuration
 * @param config The OAuth configuration to validate
 * @throws OAuthError if configuration is invalid
 */
export function validateConfig(config: OAuthConfig): void {
  if (!config) {
    throw new OAuthError('Missing configuration', 'CONFIGURATION_ERROR');
  }

  if (!config.redirectUri) {
    throw new OAuthError('Missing redirectUri in configuration', 'CONFIGURATION_ERROR');
  }

  // Validate callback functions exist
  if (!config.onSuccess) {
    throw new OAuthError('Missing onSuccess callback in configuration', 'CONFIGURATION_ERROR');
  }
  
  if (!config.onError) {
    throw new OAuthError('Missing onError callback in configuration', 'CONFIGURATION_ERROR');
  }
}

/**
 * Creates an error response for OAuth callbacks
 * @param error The error to include in the response
 * @returns A Response object with the error
 */
export function createErrorResponse(error: OAuthError): Response {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Error</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
        .error { color: #f44336; }
      </style>
      <script>
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
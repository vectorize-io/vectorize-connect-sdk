import { OAuthConfig, OAuthError, ConfigurationError } from '../types';

/**
 * Validates the OAuth configuration
 * @param config The OAuth configuration to validate
 * @throws ConfigurationError if the configuration is invalid
 */
export function validateConfig(config: OAuthConfig): void {
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

/**
 * Creates an HTML error response for the OAuth popup
 * @param error The error to embed in the response
 * @returns A Response object with the error handling HTML
 */
export function createErrorResponse(error: OAuthError): Response {
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
import { OAuthResponse, TokenError } from '../types';

/**
 * Exchanges an authorization code for OAuth tokens
 * @param code The authorization code from OAuth redirect
 * @param clientId The OAuth client ID
 * @param clientSecret The OAuth client secret
 * @param redirectUri The redirect URI used in the authorization
 * @returns Promise resolving to the OAuth response
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<OAuthResponse> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new TokenError(
        data.error_description || data.error || 'Failed to exchange code for tokens',
        {
          statusCode: response.status,
          errorCode: data.error,
          errorDetails: data
        }
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TokenError) {
      throw error;
    }
    throw new TokenError(
      'Failed to exchange code for tokens',
      {
        originalError: error instanceof Error ? error.message : error
      }
    );
  }
}

/**
 * Refreshes an OAuth access token using a refresh token
 * @param clientId The OAuth client ID
 * @param clientSecret The OAuth client secret
 * @param refreshToken The refresh token
 * @returns Promise resolving to the OAuth response with new access token
 */
export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<OAuthResponse> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new TokenError(
        data.error_description || data.error || 'Failed to refresh token',
        {
          statusCode: response.status,
          errorCode: data.error,
          errorDetails: data
        }
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TokenError) {
      throw error;
    }
    throw new TokenError(
      'Failed to refresh access token',
      {
        originalError: error instanceof Error ? error.message : error
      }
    );
  }
}
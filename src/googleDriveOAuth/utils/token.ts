import { OAuthResponse } from '../../baseOAuth/types';
import { TokenError } from '../../baseOAuth/types';

/**
 * Exchanges an authorization code for access and refresh tokens
 * @param code The authorization code from OAuth redirect
 * @param clientId The OAuth client ID
 * @param clientSecret The OAuth client secret
 * @param redirectUri The OAuth redirect URI
 * @returns An object containing the tokens
 */
export async function exchangeGDriveCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<OAuthResponse> {
  try {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new TokenError(
        `Token exchange failed: ${errorData.error || response.statusText}`,
        errorData
      );
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type
    };
  } catch (error) {
    if (error instanceof TokenError) {
      throw error;
    }
    throw new TokenError(
      error instanceof Error ? error.message : 'Token exchange failed',
      error
    );
  }
}

/**
 * Refreshes an access token using a refresh token
 * @param refreshToken The refresh token
 * @param clientId The OAuth client ID
 * @param clientSecret The OAuth client secret
 * @returns An object containing the new access token
 */
export async function refreshGDriveToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{
  access_token: string;
  expires_in: number;
  token_type: string;
}> {
  try {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new TokenError(
        `Token refresh failed: ${errorData.error || response.statusText}`,
        errorData
      );
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type
    };
  } catch (error) {
    if (error instanceof TokenError) {
      throw error;
    }
    throw new TokenError(
      error instanceof Error ? error.message : 'Token refresh failed',
      error
    );
  }
}
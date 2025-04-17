// dropboxOAuth/utils/token.ts

import { OAuthResponse } from '../../baseOAuth/types';
import { TokenError } from '../../baseOAuth/types';

/**
 * Exchanges an authorization code for access and refresh tokens
 * @param code The authorization code from OAuth redirect
 * @param appKey The Dropbox app key
 * @param appSecret The Dropbox app secret
 * @param redirectUri The OAuth redirect URI
 * @returns An object containing the tokens
 */
export async function exchangeDropboxCodeForTokens(
  code: string,
  appKey: string,
  appSecret: string,
  redirectUri: string
): Promise<OAuthResponse> {
  try {
    const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
    const params = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: appKey,
      client_secret: appSecret,
      redirect_uri: redirectUri
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
      expires_in: data.expires_in || 14400, // 4 hours default if not provided
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
 * @param appKey The Dropbox app key
 * @param appSecret The Dropbox app secret
 * @returns An object containing the new access token
 */
export async function refreshDropboxToken(
  refreshToken: string,
  appKey: string,
  appSecret: string
): Promise<{
  access_token: string;
  expires_in: number;
  token_type: string;
}> {
  try {
    const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      client_id: appKey,
      client_secret: appSecret
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
      expires_in: data.expires_in || 14400, // 4 hours default if not provided
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
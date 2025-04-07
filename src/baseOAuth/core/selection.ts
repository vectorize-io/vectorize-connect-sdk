import { OAuthConfig, OAuthError, OAuthResponse } from '../types';
import { validateConfig } from '../utils/validation';

/**
 * Abstract base class for file selection functionality
 * Can be extended by connector-specific implementations
 */
export abstract class BaseSelection {
  /**
   * Creates a popup window for file selection
   * 
   * @param width Width of the popup window
   * @param height Height of the popup window
   * @param title Title of the popup window
   * @returns The created popup window or null if creation failed
   */
  protected static createPopupWindow(
    width: number = 1200,
    height: number = 800,
    title: string = 'File Selection'
  ): Window | null {
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      'about:blank',
      title,
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
   * Sets up the OAuth handler in the window object
   * 
   * @param config OAuth configuration with success and error callbacks
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
      OAuthError // Make error constructor available to popup
    };
  }

  /**
   * Monitors a popup window and cleans up when it's closed
   * 
   * @param popup The popup window to monitor
   */
  protected static monitorPopup(popup: Window | null): void {
    if (!popup) {
      return; // Nothing to monitor
    }
    
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        delete (window as any).__oauthHandler;
      }
    }, 500);
  }

  /**
   * Writes content to a popup window
   * 
   * @param popup The popup window to write to
   * @param content The HTML content to write
   */
  protected static writeToPopup(popup: Window | null, content: string): void {
    if (!popup) {
      throw new OAuthError('Cannot write to null popup', 'INVALID_POPUP');
    }
    
    popup.document.open();
    popup.document.write(content);
    popup.document.close();
  }

  /**
   * Abstract method to be implemented by connector-specific classes
   * This is the main entry point for file selection
   */
  abstract startFileSelection(
    config: OAuthConfig,
    refreshToken: string,
    selectedFiles?: Record<string, { name: string; mimeType: string }>,
    targetWindow?: Window
  ): Promise<Window | null>;
}
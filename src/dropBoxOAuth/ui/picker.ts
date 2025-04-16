import { OAuthResponse } from '../../baseOAuth/types';
import { DropboxOAuthConfig, DropboxFile, PickerError } from '../types';
import { BasePicker } from '../../baseOAuth/ui/picker';

/**
 * Dropbox implementation of the file picker
 */
export class DropboxPicker extends BasePicker {
  /**
   * Creates an HTML template specifically for the Dropbox picker
   * 
   * @param tokens OAuth tokens for API access
   * @param config Dropbox specific configuration
   * @param refreshToken Refresh token to include in selection data
   * @param preSelectedFiles Optional map of files to initialize as selected
   * @returns HTML string for the Dropbox picker interface
   */
  createPickerHTML(
    tokens: OAuthResponse, 
    config: DropboxOAuthConfig, 
    refreshToken: string, 
    preSelectedFiles?: Record<string, { name: string; mimeType: string }>
  ): string {
    const ui = this.getCommonUIElements();
    
    // Dropbox specific warning
    const dropboxWarning = `
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              <span class="font-medium">Important:</span> Dropbox Paper documents and other Dropbox-specific formats may have limitations when accessed through the API. Please ensure your files are in compatible formats for best results.
            </p>
          </div>
        </div>
      </div>
    `;

    // Dropbox specific scripts
    const dropboxScripts = `
      ${ui.scripts.basePickerScript(tokens, {
        appKey: config.appKey,
        appSecret: config.appSecret,
        redirectUri: config.redirectUri,
        refreshToken
      }, refreshToken, preSelectedFiles)}

      // Safely check if Dropbox API is loaded
      function isDropboxAvailable() {
        return typeof window.Dropbox !== 'undefined' && window.Dropbox.choose;
      }

      // Function to load Dropbox SDK if not already loaded
      function ensureDropboxLoaded() {
        return new Promise((resolve, reject) => {
          if (isDropboxAvailable()) {
            return resolve(true);
          }
          
          // Check if script is already in the process of loading
          const existingScript = document.getElementById('dropboxjs');
          if (existingScript) {
            // Script is already loading, wait for it
            const checkInterval = setInterval(() => {
              if (isDropboxAvailable()) {
                clearInterval(checkInterval);
                resolve(true);
              }
            }, 100);
            
            // Set a timeout to avoid infinite waiting
            setTimeout(() => {
              clearInterval(checkInterval);
              reject(new Error('Dropbox SDK loading timeout'));
            }, 10000);
            return;
          }
          
          // Load the script if not already loading
          const script = document.createElement('script');
          script.id = 'dropboxjs';
          script.src = 'https://www.dropbox.com/static/api/2/dropins.js';
          script.setAttribute('data-app-key', '${config.appKey}');
          script.onload = () => {
            if (isDropboxAvailable()) {
              resolve(true);
            } else {
              reject(new Error('Dropbox SDK loaded but Chooser not available'));
            }
          };
          script.onerror = () => {
            reject(new Error('Failed to load Dropbox SDK'));
          };
          document.head.appendChild(script);
        });
      }

      async function loadDropboxChooser() {
        try {
          await ensureDropboxLoaded();
          
          // Configure the Dropbox chooser options
          const options = {
            success: handleDropboxSuccess,
            cancel: function() {
              // User canceled the picker
              console.log('Dropbox selection canceled');
            },
            linkType: "preview",  // "preview" works with folder selection
            multiselect: true,
            folderselect: true,
            extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.png', '.jpg', '.jpeg', '.gif'],
          };
          
          // Open the chooser
          window.Dropbox.choose(options);
        } catch (error) {
          console.error('Dropbox chooser error:', error);
          
          handleError({
            message: 'Failed to open Dropbox chooser: ' + (error.message || 'Unknown error'),
            code: 'PICKER_ERROR',
            details: error
          });
        }
      }

      function handleDropboxSuccess(files) {
        try {
          if (!files || !files.length) {
            return;
          }

          const existingIds = new Set(selectedFiles.map(file => file.id));
          
          const newFiles = files.map(file => {
          
            // Get the file ID or generate one if not available
            let fileId = file.id;
            
            return {
              id: fileId,
              name: file.name,
              mimeType: getMimeType(file.name),
              path: file.link ? normalizeDropboxPath(file.link) : undefined,
              isDir: file.isDir || false
            };
          }).filter(file => !existingIds.has(file.id));

          selectedFiles = [...selectedFiles, ...newFiles];
          updateFileList();
          
        } catch (error) {
          console.error('Error processing files:', error);
          
          handleError({
            message: 'Failed to process selected files',
            code: 'PICKER_ERROR',
            details: error
          });
        }
      }

      function generateFileId(link) {
        // Extract a unique ID from the link or generate one
        return link.split('?')[0].split('/').pop() || 
               'dropbox-' + Math.random().toString(36).substring(2, 15);
      }

      function normalizeDropboxPath(link) {
        // Extract the path from the Dropbox link
        try {
          const url = new URL(link);
          const path = url.pathname.replace(/^\\/dl/, '');
          return path;
        } catch (e) {
          return link;
        }
      }

      function getMimeType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const mimeTypeMap = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'ppt': 'application/vnd.ms-powerpoint',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'txt': 'text/plain',
          'csv': 'text/csv',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'zip': 'application/zip',
          'rar': 'application/vnd.rar',
          'mp4': 'video/mp4',
          'mp3': 'audio/mpeg'
        };
        
        return mimeTypeMap[extension] || 'application/octet-stream';
      }

      function handleSelectMore() {
        loadDropboxChooser();
      }

      // Initialize page when it loads
      window.addEventListener('DOMContentLoaded', function() {
        // Preload the Dropbox SDK but don't open the chooser
        ensureDropboxLoaded().catch(err => {
          console.error('Failed to preload Dropbox SDK:', err);
        });
      });
    `;


    // Assemble the complete HTML
    return this.generateHTMLTemplate(
      'Dropbox File Selector',
      '', // No additional styles
      '', // No additional head elements
      `
        ${ui.header}
        ${dropboxWarning}
        ${ui.fileListContainer}
        ${ui.submitButtonContainer}
      `,
      dropboxScripts
    );
  }

  /**
   * Create a static instance for backward compatibility
   */
  static createPickerHTML(
    tokens: OAuthResponse, 
    config: DropboxOAuthConfig, 
    refreshToken: string, 
    preSelectedFiles?: Record<string, { name: string; mimeType: string }>
  ): string {
    const picker = new DropboxPicker();
    return picker.createPickerHTML(tokens, config, refreshToken, preSelectedFiles);
  }
}
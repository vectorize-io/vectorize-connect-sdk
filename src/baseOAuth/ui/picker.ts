import { OAuthResponse, OAuthConfig } from '../types';

/**
 * Base Picker class providing common file selection functionality
 * Can be extended by specific connector implementations
 */
export abstract class BasePicker {
  /**
   * Abstract method to create HTML template for the picker page
   * Must be implemented by subclasses for connector-specific picker UI
   *
   * @param tokens OAuth tokens for API access
   * @param config Configuration with necessary credentials
   * @param refreshToken Refresh token to include in selection data
   * @param preSelectedFiles Optional map of files to initialize as selected
   * @param nonce Optional nonce for Content Security Policy
   * @returns HTML string for the picker interface
   */
  abstract createPickerHTML(
    tokens: OAuthResponse,
    config: OAuthConfig,
    refreshToken: string,
    preSelectedFiles?: Record<string, { name: string; mimeType: string }>,
    nonce?: string
  ): string;

  /**
   * Generates common UI elements for the picker
   * This can be used by subclass implementations to maintain a consistent look
   * 
   * @returns Object containing HTML template strings
   */
  protected getCommonUIElements(): { 
    header: string; 
    warning: string; 
    fileListContainer: string; 
    submitButtonContainer: string; 
    scripts: {
      basePickerScript: (tokens: any, config: any, refreshToken: string, preSelectedFiles: any) => string;
    }
  } {
    return {
      header: `
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold">Selected Files and Folders</h1>
          <button
            id="selectMoreButton"
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Select Files/Folders
          </button>
        </div>
      `,
      warning: `
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-700">
                <span class="font-medium">Important:</span> Some files might have limitations when accessed through the API. Please check the file compatibility with this connector.
              </p>
            </div>
          </div>
        </div>
      `,
      fileListContainer: `
        <div id="fileList" class="space-y-4">
          <p>No files selected</p>
        </div>
      `,
      submitButtonContainer: `
        <div id="submitButton" class="flex justify-end mt-6" style="display: none;">
          <button
            id="finishButton"
            class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Finish Selection
          </button>
        </div>
      `,
      scripts: {
        basePickerScript: (tokens, config, refreshToken, preSelectedFiles) => `
          const tokens = ${JSON.stringify(tokens)};
          const config = ${JSON.stringify(config)};
          const refreshToken = ${JSON.stringify(refreshToken)};
          const preSelectedFiles = ${JSON.stringify(preSelectedFiles || {})};
          let selectedFiles = [];
          
          // Initialize selected files from pre-selected ones if provided
          if (preSelectedFiles && Object.keys(preSelectedFiles).length > 0) {
            selectedFiles = Object.entries(preSelectedFiles).map(([id, details]) => ({
              id,
              name: details.name,
              mimeType: details.mimeType
            }));
          }
  
          function handleError(error) {
            const errorObj = new (window.opener.OAuthError || Error)(
              error.message || 'An error occurred in the picker',
              error.code || 'PICKER_ERROR',
              error.details
            );
            window.opener.__oauthHandler.onError(errorObj);
            window.close();
          }
  
          function updateFileList() {
            const fileList = document.getElementById('fileList');
            const submitButton = document.getElementById('submitButton');
  
            if (selectedFiles.length === 0) {
              fileList.innerHTML = '<p>No files selected</p>';
              submitButton.style.display = 'none';
              return;
            }
  
            fileList.innerHTML = selectedFiles.map(file =>
              \`<div class="group p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p class="font-medium text-gray-800">
                    \${file.name}
                  </p>
                  <p class="text-sm text-gray-500">
                    Type: \${file.mimeType}
                  </p>
                </div>
                <button
                  data-file-id="\${file.id}"
                  class="remove-file-btn p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  aria-label="Remove file"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>\`
            ).join('');

            // Attach event listeners to remove buttons
            document.querySelectorAll('.remove-file-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const fileId = e.currentTarget.getAttribute('data-file-id');
                removeFile(fileId);
              });
            });
  
            submitButton.style.display = 'flex';
          }
  
          function removeFile(fileId) {
            selectedFiles = selectedFiles.filter(file => file.id !== fileId);
            updateFileList();
          }
  
          async function finishSelection() {
            try {
              if (!selectedFiles.length) {
                throw new Error('No files selected');
              }

              // Create a map of fileId -> {name, mimeType}
              const fileMap = {};
              selectedFiles.forEach(file => {
                fileMap[file.id] = {
                  name: file.name,
                  mimeType: file.mimeType
                };
              });

              const bodyData = {
                selectedFiles: fileMap,
                refreshToken: refreshToken
              };

              window.opener.__oauthHandler.onSuccess(bodyData);
              window.close();
            } catch (error) {
              handleError({
                message: error.message || 'Failed to complete file selection',
                code: 'SELECTION_ERROR',
                details: error
              });
            }
          }
  
          // Attach event listeners
          document.getElementById('finishButton')?.addEventListener('click', finishSelection);

          // Initialize file list with pre-selected files if any
          if (selectedFiles.length > 0) {
            updateFileList();
          }
        `
      }
    };
  }

  /**
   * Utility method to generate the base HTML structure
   *
   * @param title Page title
   * @param styles Additional CSS styles to include
   * @param head Additional head content (scripts, meta tags)
   * @param body Body content
   * @param scripts JavaScript to include at the end of body
   * @param nonce Optional nonce for Content Security Policy
   * @returns Complete HTML string
   */
  protected generateHTMLTemplate(
    title: string,
    styles: string = '',
    head: string = '',
    body: string,
    scripts: string,
    nonce?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .p-2 { padding: 0.5rem; }
          .p-4 { padding: 1rem; }
          .p-6 { padding: 1.5rem; }
          .px-4 { padding-left: 1rem; padding-right: 1rem; }
          .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
          .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
          .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
          .mt-6 { margin-top: 1.5rem; }
          .ml-3 { margin-left: 0.75rem; }
          .space-y-4 > * + * { margin-top: 1rem; }
          .space-y-6 > * + * { margin-top: 1.5rem; }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .justify-end { justify-content: flex-end; }
          .flex-shrink-0 { flex-shrink: 0; }
          .border { border: 1px solid #e5e7eb; }
          .border-l-4 { border-left: 4px solid; }
          .border-yellow-400 { border-color: #fbbf24; }
          .rounded-lg { border-radius: 0.5rem; }
          .rounded-full { border-radius: 9999px; }
          .bg-blue-500 { background-color: #3b82f6; }
          .bg-green-500 { background-color: #10b981; }
          .bg-yellow-50 { background-color: #fffbeb; }
          .bg-gray-50 { background-color: #f9fafb; }
          .bg-red-50 { background-color: #fef2f2; }
          .text-white { color: #ffffff; }
          .text-2xl { font-size: 1.5rem; line-height: 2rem; }
          .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-800 { color: #1f2937; }
          .text-yellow-700 { color: #a16207; }
          .text-yellow-400 { color: #fbbf24; }
          .text-red-500 { color: #ef4444; }
          .font-bold { font-weight: 700; }
          .font-medium { font-weight: 500; }
          .hover\\:bg-blue-600:hover { background-color: #2563eb; }
          .hover\\:bg-green-600:hover { background-color: #059669; }
          .hover\\:bg-gray-50:hover { background-color: #f9fafb; }
          .hover\\:bg-red-50:hover { background-color: #fef2f2; }
          .hover\\:text-red-500:hover { color: #ef4444; }
          .transition-colors { transition-property: color, background-color, border-color; transition-duration: 150ms; }
          .group:hover .group-hover\\:bg-gray-50 { background-color: #f9fafb; }
          button { cursor: pointer; border: none; outline: none; }
          button:focus { outline: 2px solid #3b82f6; outline-offset: 2px; }
          .h-5 { height: 1.25rem; }
          .w-5 { width: 1.25rem; }
          ${styles}
        </style>
        ${head}
      </head>
      <body>
        <div class="p-6">
          <div class="space-y-6">
            ${body}
          </div>
        </div>
        <script${nonce ? ` nonce="${nonce}"` : ''}>
          ${scripts}
        </script>
      </body>
      </html>
    `;
  }
}
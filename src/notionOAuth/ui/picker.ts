// notionOAuth/ui/picker.ts

import { NotionOAuthConfig } from '../types';

/**
 * Notion UI picker implementation
 */
export class NotionPicker {
  /**
   * Creates the HTML content for the Notion picker UI
   * 
   * @param tokens The OAuth tokens received from Notion
   * @param config The OAuth configuration
   * @param accessToken The Notion access token to use for API calls
   * @param existingSelection Optional record of already selected pages
   * @returns HTML string for the picker UI
   */
  public static createPickerHTML(
    tokens: any,
    config: NotionOAuthConfig,
    accessToken: string,
    existingSelection?: Record<string, { title: string; pageId: string; parentType?: string }>,
    nonce?: string
  ): string {
    // Convert existing selection to JSON string for embedding in the HTML
    const existingSelectionStr = existingSelection 
      ? JSON.stringify(existingSelection) 
      : '{}';
    
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Select Notion Resources</title>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/inter-ui/3.19.3/inter.css" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #1f2937; /* bg-gray-800 */
          color: #f3f4f6; /* text-gray-100 */
          line-height: 1.5;
        }
        
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 1.5rem;
        }
        
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid #374151; /* border-gray-700 */
          padding-bottom: 0.5rem;
        }
        
        .top-bar h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
          color: #f3f4f6; /* text-gray-100 */
        }
        
        .content-section {
          margin-bottom: 1.5rem;
        }
        
        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .tab-header h2 {
          font-size: 1rem;
          font-weight: 600;
          color: #f3f4f6; /* text-gray-100 */
          margin: 0;
        }
        
        .select-all-btn {
          background-color: #4338ca; /* bg-indigo-700 */
          color: #f3f4f6; /* text-gray-100 */
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.1s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        /* Different color for deselect button */
        #deselect-all-resources {
          background-color: #6B7280; /* bg-gray-500 */
        }
        
        #deselect-all-resources:hover {
          background-color: #4B5563; /* bg-gray-600 */
        }
        
        .select-all-btn:hover {
          background-color: #4f46e5; /* bg-indigo-600 */
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* Smaller cards */
          gap: 0.5rem;
        }
        
        .item-card {
          border: 1px solid #374151; /* border-gray-700 */
          border-radius: 0.375rem;
          padding: 0.5rem;
          background-color: #374151; /* bg-gray-700 */
          cursor: pointer;
          transition: all 0.1s ease;
          display: flex;
          align-items: flex-start;
          box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px, rgba(0, 0, 0, 0.1) 0px 1px 2px;
        }
        
        .item-card:hover {
          background-color: #4B5563; /* bg-gray-600 */
        }
        
        .item-card.selected {
          border-color: #4338ca; /* border-indigo-700 */
          background-color: rgba(79, 70, 229, 0.3); /* More visible background */
          box-shadow: 0 0 0 2px #4338ca; /* Add an outline */
        }
        
        .item-icon {
          margin-right: 0.5rem;
          color: #f3f4f6; /* text-gray-100 */
          background: rgba(79, 70, 229, 0.2); /* bg-indigo-600 with opacity */
          padding: 0.35rem;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .item-icon svg {
          width: 16px;
          height: 16px;
        }
        
        .item-details {
          flex: 1;
          min-width: 0; /* Allow text to truncate properly */
        }
        
        .item-name {
          font-weight: 500;
          margin-bottom: 0.25rem;
          word-break: break-word;
          color: #f3f4f6; /* text-gray-100 */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          position: relative; /* Added for tooltip positioning */
          font-size: 0.8rem; /* Smaller font size */
        }
        
        .tooltip {
          position: absolute;
          background-color: #1f2937;
          border: 1px solid #374151;
          color: #f3f4f6;
          padding: 5px 8px;
          border-radius: 4px;
          font-size: 0.875rem;
          white-space: normal;
          max-width: 300px;
          z-index: 1000;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          word-wrap: break-word;
          top: 100%;
          left: 0;
          margin-top: 5px;
          display: none;
        }
        
        .selected-list {
          margin-top: 1rem;
          border-top: 1px solid #374151; /* border-gray-700 */
          padding-top: 1rem;
        }
        
        .selected-list h2 {
          font-size: 1rem;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 1rem;
          color: #f3f4f6; /* text-gray-100 */
        }
        
        .selected-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background-color: #374151; /* bg-gray-700 */
          border: 1px solid #4B5563; /* border-gray-600 */
          border-radius: 0.375rem;
          margin-bottom: 0.5rem;
        }
        
        .remove-btn {
          background: none;
          border: none;
          color: rgba(243, 244, 246, 0.7); /* text-gray-100 with opacity */
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .remove-btn:hover {
          background-color: rgba(243, 244, 246, 0.1); /* text-gray-100 with more opacity */
          color: #f3f4f6; /* text-gray-100 */
        }
        
        .actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .cancel-btn {
          background-color: #4B5563; /* bg-gray-600 */
          color: #f3f4f6; /* text-gray-100 */
          border: none;
          padding: 0.6rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.1s ease;
        }
        
        .cancel-btn:hover {
          background-color: #6B7280; /* bg-gray-500 */
        }
        
        .submit-btn {
          background-color: #4338ca; /* bg-indigo-700 */
          color: white;
          border: none;
          padding: 0.6rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.1s ease;
        }
        
        .submit-btn:hover {
          background-color: #4f46e5; /* bg-indigo-600 */
        }
        
        .submit-btn:disabled {
          background-color: #6B7280; /* Lighter gray */
          opacity: 0.5;
          cursor: not-allowed;
          color: rgba(255, 255, 255, 0.5);
          border: 1px solid #4B5563;
        }
        
        .empty-message {
          text-align: center;
          color: rgba(243, 244, 246, 0.5); /* text-gray-100 with opacity */
          padding: 1rem 0;
          font-size: 0.875rem;
        }
        
        /* Link icon styles */
        .notion-link {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(243, 244, 246, 0.5); /* text-gray-100 with opacity */
          width: 22px;
          height: 22px;
          border-radius: 0.25rem;
          transition: all 0.1s ease;
          margin-left: auto;
          visibility: hidden; /* Hide by default, show on hover */
        }
        
        .item-card:hover .notion-link {
          visibility: visible; /* Show on hover */
        }
        
        .notion-link:hover {
          background-color: rgba(243, 244, 246, 0.1); /* text-gray-100 with opacity */
          color: #f3f4f6; /* text-gray-100 */
        }
        
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #1f2937;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: #f3f4f6;
        }
        
        .loading-spinner svg {
          animation: spin 1.5s linear infinite;
        }
        
        .button-group {
          display: flex;
          gap: 0.5rem;
        }
        
        .action-btn {
          background-color: #4338ca; /* bg-indigo-700 */
          color: #f3f4f6; /* text-gray-100 */
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.1s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .action-btn:hover {
          background-color: #4f46e5; /* bg-indigo-600 */
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div id="loading-overlay" class="loading-overlay">
        <div class="loading-spinner">
          <svg width="50" height="50" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="#4338ca" stroke-width="5" stroke-dasharray="30 10"></circle>
          </svg>
          <p>Loading resources...</p>
        </div>
      </div>
      
      <div class="container">
        <div class="top-bar">
          <h2>Select Notion Resources</h2>
          <div class="actions">
            <button id="cancel-button" class="cancel-btn">Cancel</button>
            <button id="submit-button" class="submit-btn" disabled>Save Selection</button>
          </div>
        </div>
        
        <div class="content-section">
          <div class="tab-header">
            <h2>Available Resources</h2>
            <div class="button-group">
              <button class="action-btn" id="select-all-resources">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                Select All
              </button>
              <button class="action-btn" id="deselect-all-resources">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 12H5"></path>
                </svg>
                Deselect All
              </button>
            </div>
          </div>
          
          <div class="grid" id="resources-grid">
            <!-- Resources will be loaded here -->
          </div>
        </div>
        
        <div class="selected-list">
          <h2>Selected Items</h2>
          <div id="selected-items-container">
            <div class="empty-message">No items selected</div>
          </div>
        </div>
      </div>
      
      <script${nonce ? ` nonce="${nonce}"` : ''}>
        // Store selected items
        const selectedItems = ${existingSelectionStr};
        let dataLoaded = false;
        const accessToken = "${accessToken}";
        
        // Initialize the UI when the page loads
        document.addEventListener('DOMContentLoaded', function() {
          // First, set up the event handlers
          setupEventHandlers();
          
          // Then fetch resources from Notion
          fetchNotionResources();
          
          // Set a timeout to hide loading screen even if fetch fails
          setTimeout(function() {
            if (!dataLoaded) hideLoadingScreen();
          }, 5000);
        });
        
        // Helper function to escape HTML
        function escapeHtml(unsafe) {
          if (!unsafe) return '';
          return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        }
        
        // Fetch resources from Notion API
        async function fetchNotionResources() {
          try {
            // Fetch databases and pages in parallel
            const [databases, pages] = await Promise.all([
              fetchDatabases(accessToken),
              fetchPages(accessToken)
            ]);
            
            // Render them to the UI
            renderResources(databases, pages);
            
            // Update the selected items list
            updateSelectedItemsList();
            
            // Mark data as loaded and hide loading screen
            dataLoaded = true;
            hideLoadingScreen();
          } catch (error) {
            console.error('Error fetching Notion resources:', error);
            showError('Failed to load resources from Notion. Please try again.');
            hideLoadingScreen();
          }
        }
        
        // Fetch databases from Notion
        async function fetchDatabases(token) {
          const response = await fetch('https://api.notion.com/v1/search', {
            method: 'POST',
            headers: {
              'Authorization': \`Bearer \${token}\`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filter: {
                value: 'database',
                property: 'object'
              },
              page_size: 100
            })
          });
          
          if (!response.ok) {
            throw new Error(\`Failed to fetch databases: \${response.status}\`);
          }
          
          const data = await response.json();
          
          return data.results.map(db => ({
            id: db.id,
            name: db.title?.[0]?.plain_text || 'Untitled Database',
            type: 'database',
            url: db.url || \`https://notion.so/\${db.id.replace(/-/g, '')}\`
          }));
        }
        
        // Fetch pages from Notion
        async function fetchPages(token) {
          const response = await fetch('https://api.notion.com/v1/search', {
            method: 'POST',
            headers: {
              'Authorization': \`Bearer \${token}\`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filter: {
                value: 'page',
                property: 'object'
              },
              page_size: 100
            })
          });
          
          if (!response.ok) {
            throw new Error(\`Failed to fetch pages: \${response.status}\`);
          }
          
          const data = await response.json();
          
          return data.results.map(page => ({
            id: page.id,
            title: getPageTitle(page) || 'Untitled Page',
            type: 'page',
            url: page.url || \`https://notion.so/\${page.id.replace(/-/g, '')}\`
          }));
        }
        
        // Helper to get page title from Notion API response
        function getPageTitle(page) {
          // Try to get title from properties.title (most common case)
          if (page.properties?.title?.title?.[0]?.plain_text) {
            return page.properties.title.title[0].plain_text;
          }
          
          // Try to get title from properties.Name (also common)
          if (page.properties?.Name?.title?.[0]?.plain_text) {
            return page.properties.Name.title[0].plain_text;
          }
          
          // Try to find any property that has a title type
          if (page.properties) {
            for (const [key, value] of Object.entries(page.properties)) {
              if (value.type === 'title' && value.title?.[0]?.plain_text) {
                return value.title[0].plain_text;
              }
            }
          }
          
          // For database pages in the parent format
          if (page.parent?.type === 'database_id' && page.child_page?.title) {
            return page.child_page.title;
          }
          
          // If no title is found
          return '';
        }
        
        // Render databases and pages to the UI
        function renderResources(databases, pages) {
          const grid = document.getElementById('resources-grid');
          grid.innerHTML = '';
          
          // Handle empty case
          if (databases.length === 0 && pages.length === 0) {
            grid.innerHTML = '<div class="empty-message">No resources available</div>';
            return;
          }
          
          // Render databases
          databases.forEach(db => {
            const isSelected = selectedItems[db.id] !== undefined;
            const card = document.createElement('div');
            card.className = \`item-card\${isSelected ? ' selected' : ''}\`;
            card.setAttribute('data-id', db.id);
            card.setAttribute('data-name', db.name);
            card.setAttribute('data-type', 'database');
            
            card.innerHTML = \`
              <div class="item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3h18v18H3z"></path>
                  <path d="M3 9h18"></path>
                  <path d="M3 15h18"></path>
                  <path d="M9 3v18"></path>
                </svg>
              </div>
              <div class="item-details">
                <div class="item-name" title="\${escapeHtml(db.name)}">\${escapeHtml(db.name)}</div>
              </div>
              <a href="\${escapeHtml(db.url)}" target="_blank" class="notion-link" title="Open in Notion">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            \`;

            // Set up click handler for card
            card.addEventListener('click', function() {
              toggleItemSelection(this);
            });

            // Prevent link click from triggering card selection
            const link = card.querySelector('.notion-link');
            if (link) {
              link.addEventListener('click', function(e) {
                e.stopPropagation();
              });
            }
            
            grid.appendChild(card);
          });
          
          // Render pages
          pages.forEach(page => {
            const isSelected = selectedItems[page.id] !== undefined;
            const card = document.createElement('div');
            card.className = \`item-card\${isSelected ? ' selected' : ''}\`;
            card.setAttribute('data-id', page.id);
            card.setAttribute('data-name', page.title);
            card.setAttribute('data-type', 'page');
            
            card.innerHTML = \`
              <div class="item-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div class="item-details">
                <div class="item-name" title="\${escapeHtml(page.title)}">\${escapeHtml(page.title)}</div>
              </div>
              <a href="\${escapeHtml(page.url)}" target="_blank" class="notion-link" title="Open in Notion">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            \`;

            // Set up click handler for card
            card.addEventListener('click', function() {
              toggleItemSelection(this);
            });

            // Prevent link click from triggering card selection
            const pageLink = card.querySelector('.notion-link');
            if (pageLink) {
              pageLink.addEventListener('click', function(e) {
                e.stopPropagation();
              });
            }
            
            grid.appendChild(card);
          });
        }
        
        // Toggle selection state of an item
        function toggleItemSelection(card) {
          const id = card.getAttribute('data-id');
          const name = card.getAttribute('data-name');
          const type = card.getAttribute('data-type');
          
          if (selectedItems[id]) {
            // Item is currently selected, so deselect it
            delete selectedItems[id];
            card.classList.remove('selected');
          } else {
            // Item is not selected, so select it
            selectedItems[id] = {
              id,
              title: name,
              type,
              pageId: id
            };
            card.classList.add('selected');
          }
          
          // Update the UI
          updateSelectedItemsList();
        }
        
        // Update the list of selected items
        function updateSelectedItemsList() {
          const container = document.getElementById('selected-items-container');
          const submitButton = document.getElementById('submit-button');
          const itemCount = Object.keys(selectedItems).length;
          
          if (itemCount === 0) {
            container.innerHTML = '<div class="empty-message">No items selected</div>';
            submitButton.disabled = true;
          } else {
            let html = '';
            Object.values(selectedItems).forEach(item => {
              const name = item.title || item.name;
              html += \`
                <div class="selected-item" data-id="\${item.id}">
                  <div class="item-name" title="\${escapeHtml(name)}">\${escapeHtml(name)}</div>
                  <button class="remove-btn" data-item-id="\${item.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              \`;
            });
            container.innerHTML = html;
            submitButton.disabled = false;
            
            // Add event listeners to remove buttons
            container.querySelectorAll('.remove-btn').forEach(btn => {
              btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-item-id');
                removeItem(itemId);
              });
            });
          }
        }
        
        // Remove an item from selection
        function removeItem(id) {
          delete selectedItems[id];
          
          // Also update the card in the grid if present
          const card = document.querySelector(\`.item-card[data-id="\${id}"]\`);
          if (card) {
            card.classList.remove('selected');
          }
          
          updateSelectedItemsList();
        }
        
        // Hide the loading screen
        function hideLoadingScreen() {
          const loadingOverlay = document.getElementById('loading-overlay');
          if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
              loadingOverlay.style.display = 'none';
            }, 300);
          }
        }
        
        // Show an error message
        function showError(message) {
          const topBar = document.querySelector('.top-bar');
          
          // Create error element if it doesn't exist
          let errorEl = document.getElementById('error-container');
          if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = 'error-container';
            errorEl.className = 'error';
            topBar.insertAdjacentElement('afterend', errorEl);
          }
          
          errorEl.innerHTML = \`
            <div style="background-color: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.2); color: #ef4444; padding: 0.75rem; border-radius: 0.375rem; margin-bottom: 1rem;">
              <p style="margin: 0;">\${escapeHtml(message)}</p>
            </div>
          \`;
        }
        
        // Set up UI event handlers
        function setupEventHandlers() {
          // Select All button
          document.getElementById('select-all-resources').addEventListener('click', function() {
            document.querySelectorAll('#resources-grid .item-card').forEach(card => {
              const id = card.getAttribute('data-id');
              const name = card.getAttribute('data-name');
              const type = card.getAttribute('data-type');
              
              if (!selectedItems[id]) {
                selectedItems[id] = {
                  id,
                  title: name,
                  type,
                  pageId: id
                };
                card.classList.add('selected');
              }
            });
            
            updateSelectedItemsList();
          });
          
          // Deselect All button
          document.getElementById('deselect-all-resources').addEventListener('click', function() {
            document.querySelectorAll('#resources-grid .item-card').forEach(card => {
              const id = card.getAttribute('data-id');
              delete selectedItems[id];
              card.classList.remove('selected');
            });
            
            updateSelectedItemsList();
          });
          
          // Cancel button
          document.getElementById('cancel-button').addEventListener('click', function() {
            // Send cancel message to parent window
            window.parent.postMessage({
              type: 'notion-selection-cancelled'
            }, '*');
            
            // Close the window if possible
            if (window.opener) {
              window.close();
            }
          });
          
          // Submit button
          document.getElementById('submit-button').addEventListener('click', function() {
            if (Object.keys(selectedItems).length === 0) {
              return;
            }
            
            // Format the selected items for the response
            const response = {
              selectedPages: {},
              accessToken
            };
            
            // Add each selected item to the response
            Object.values(selectedItems).forEach(item => {
              response.selectedPages[item.id] = {
                title: item.title,
                pageId: item.id,
                parentType: item.parentType || item.type
              };
            });
            
            // Send the result back to the parent window
            window.parent.postMessage({
              type: 'notion-selection-complete',
              payload: response
            }, '*');
            
            // Close the window if possible
            if (window.opener) {
              setTimeout(() => window.close(), 500);
            }
          });
        }
      </script>
    </body>
    </html>`;
  }
}
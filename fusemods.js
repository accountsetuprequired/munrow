/**
 * main.js
 *
 * This file combines CSS definitions and JavaScript logic for message board
 * formatting and status indicator styling into a single executable script.
 */

// --- CSS Definitions ---
const dynamicStyles = `
/* Color Modifiers */
.message-color-0 { color: #7DDA58; }
.message-color-1 { color: #FFDD36; }
.message-color-2 { color: #FF8636; }
.message-color-3 { color: #FF3636; }
.message-color-4 { color: #9636FD; }
.message-color-5 { color: #3D2DE6; }
.message-color-r { color: inherit; font-weight: normal; font-style: normal; text-decoration: none; }

/* Formatting Styles */
.message-format-bold { font-weight: bold; }
.message-format-strikethrough { text-decoration: line-through; }
.message-format-underline { text-decoration: underline; }
.message-format-italic { font-style: italic; }

/* Reset style (often handled by clearing classes, but can be explicit) */
.message-format-reset {
    color: inherit !important; /* Resets to parent color */
    font-weight: normal !important;
    font-style: normal !important;
    text-decoration: none !important;
}

/* Status Indicator Styles */
.status-value.status-in-production {
    color: green !important;
    font-weight: bold;
}

.status-value.status-ready-for-production {
    color: orange !important;
    font-style: italic;
}

/* Example customer style (if part of this context) */
.customer {
    font-weight: bold;
}
`;

// Inject the CSS into the document head
function injectStyles() {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = dynamicStyles;
    document.head.appendChild(styleSheet);
}

// Call this function once when the script loads
injectStyles();

// --- Message Board Formatting Logic ---

/**
 * Escapes HTML entities to prevent XSS vulnerabilities.
 * @param {string} text - The input string to escape.
 * @returns {string} The HTML-escaped string.
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * Applies color and formatting to message board text based on custom codes.
 * This function processes the text to replace custom codes (e.g., &0, &l) with
 * corresponding HTML `<span>` tags and CSS classes.
 * @param {string} originalTextContent - The raw text content from the message.
 * @returns {string} The HTML string with applied formatting.
 */
function formatMessageBoardText(originalTextContent) {
    const formatMap = {
        // Colors (replace each other)
        '&0': 'message-color-0', '&1': 'message-color-1', '&2': 'message-color-2',
        '&3': 'message-color-3', '&4': 'message-color-4', '&5': 'message-color-5',

        // Formatting (can stack)
        '&k': 'message-format-obfuscated',
        '&l': 'message-format-bold',
        '&m': 'message-format-strikethrough',
        '&n': 'message-format-underline',
        '&i': 'message-format-italic',

        // Custom aliases for bold and italic
        '&b': 'message-format-bold',
        '&i': 'message-format-italic',

        // Reset code (resets all formatting and color)
        '&r': 'message-format-reset'
    };

    let formattedHtml = '';
    let activeClasses = new Set(); // Manages stacking formatting classes
    let activeColorClass = null; // Manages the current color class (only one active)

    // Regex to find any format codes, capturing the character after '&'
    const parts = originalTextContent.split(/&([0-9a-fA-FklmnoBIr])/g);

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i % 2 === 1) { // This part is a captured delimiter (e.g., "4" from "&4")
            const code = '&' + part; // Reconstruct the full code (e.g., "&4")
            const className = formatMap[code];

            if (!className) {
                // If code is not recognized, treat it as literal text and append
                const classesToApply = Array.from(activeClasses);
                if (activeColorClass) {
                    classesToApply.push(activeColorClass);
                }
                if (classesToApply.length > 0) {
                    formattedHtml += `<span class="${classesToApply.join(' ')}">${escapeHtml(code)}</span>`;
                } else {
                    formattedHtml += escapeHtml(code);
                }
                continue;
            }

            if (className === 'message-format-reset') {
                activeClasses.clear(); // Clear all formatting
                activeColorClass = null; // Clear active color
            } else if (className.startsWith('message-color-')) {
                activeColorClass = className; // Set new active color (replaces previous)
            } else if (className.startsWith('message-format-')) {
                activeClasses.add(className); // Add formatting class (stacks)
            }
        } else { // This part is text content
            const text = part;
            if (text.length > 0) {
                const classesToApply = Array.from(activeClasses);
                if (activeColorClass) {
                    classesToApply.push(activeColorClass);
                }

                if (classesToApply.length > 0) {
                    // Apply all current active styles to this segment of text
                    formattedHtml += `<span class="${classesToApply.join(' ')}">${escapeHtml(text)}</span>`;
                } else {
                    // No active styles, just add raw text (escaped)
                    formattedHtml += escapeHtml(text);
                }
            }
        }
    }
    return formattedHtml;
}

/**
 * Iterates through message board elements and applies formatting.
 * This function is designed to run periodically to catch new messages.
 */
const applyMessageBoardFormatting = () => {
    const messageElements = document.querySelectorAll('.message');

    messageElements.forEach(messageBoardElement => {
        // Prevent re-processing already formatted messages
        if (messageBoardElement && !messageBoardElement.classList.contains('formatted-by-js')) {
            const originalTextContent = messageBoardElement.textContent;

            // Only format if the content contains an '&' symbol
            if (originalTextContent.includes('&')) {
                const formattedHtml = formatMessageBoardText(originalTextContent);
                messageBoardElement.innerHTML = formattedHtml;
                messageBoardElement.classList.add('formatted-by-js');
            }
        }
    });
};

// Execute message board formatting periodically
setInterval(applyMessageBoardFormatting, 500);

// --- Status Indicator Styling Logic ---

/**
 * Applies specific CSS classes to status value elements based on their text content.
 * This function is optimized to avoid re-processing elements that already have the classes.
 */
const applyStatusStyles = () => {
    document.querySelectorAll('.status-value').forEach(function(element) {
        // Skip if classes are already applied
        if (element.classList.contains('status-in-production') || element.classList.contains('status-ready-for-production')) {
            return;
        }

        let statusText = '';
        // Iterate child nodes to get text content, ignoring potential child HTML elements
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                statusText = node.textContent.trim();
                break;
            }
        }

        if (statusText === "IN PRODUCTION") {
            element.classList.add('status-in-production');
        } else if (statusText === "READY FOR PRODUCTION") {
            element.classList.add('status-ready-for-production');
        }
    });
};

// --- MutationObserver Setup for Dynamic Content ---

// Create a new MutationObserver instance
const observer = new MutationObserver(mutations => {
    // Re-apply status styles whenever DOM changes occur
    // This ensures new or updated status elements are styled correctly
    applyStatusStyles();
});

// Start observing the document body for changes in its children, subtree, and character data
observer.observe(document.body, {
    childList: true,      // Detect when child nodes are added or removed
    subtree: true,        // Extend observation to all descendants of the target
    characterData: true   // Detect changes to text content within nodes
});

// --- Initial Execution ---
// Run the status styling once immediately when the script loads
// This handles elements already present on the page at load time
applyStatusStyles();

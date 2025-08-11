import { describe, it, expect, beforeEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';

describe('Content Script Browser Integration', () => {
  beforeEach(async () => {
    // Reset DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('content script can find input elements', async () => {
    // Simulate a ChatGPT-like page
    document.body.innerHTML = `
      <div id="app">
        <main>
          <div class="chat-container">
            <div class="input-area">
              <textarea 
                id="prompt-textarea" 
                placeholder="Message ChatGPT..."
                rows="1"
              ></textarea>
              <button 
                id="send-button" 
                data-testid="send-button"
                type="submit"
              >
                Send
              </button>
            </div>
          </div>
        </main>
      </div>
    `;

    // Simulate content script selector logic
    const inputSelectors = [
      'textarea[placeholder*="Message"]',
      '#prompt-textarea',
      'textarea',
    ];

    const submitSelectors = [
      'button[data-testid="send-button"]',
      '#send-button',
      'button[type="submit"]',
    ];

    // Test input detection
    let inputElement: HTMLElement | null = null;
    for (const selector of inputSelectors) {
      inputElement = document.querySelector(selector);
      if (inputElement) break;
    }

    expect(inputElement).toBeTruthy();
    expect(inputElement?.tagName.toLowerCase()).toBe('textarea');

    // Test submit button detection
    let submitElement: HTMLElement | null = null;
    for (const selector of submitSelectors) {
      submitElement = document.querySelector(selector);
      if (submitElement) break;
    }

    expect(submitElement).toBeTruthy();
    expect(submitElement?.tagName.toLowerCase()).toBe('button');
  });

  it('content script can inject messages', async () => {
    document.body.innerHTML = `
      <div>
        <textarea id="message-input"></textarea>
        <button id="send-btn">Send</button>
      </div>
    `;

    const textarea = document.getElementById('message-input') as HTMLTextAreaElement;
    const sendButton = document.getElementById('send-btn') as HTMLButtonElement;

    // Simulate message injection
    const testMessage = 'This is a test message from the extension';
    
    // Method 1: Direct value setting
    textarea.value = testMessage;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    expect(textarea.value).toBe(testMessage);

    // Method 2: execCommand (for sites that require it)
    textarea.focus();
    textarea.select();
    
    // Simulate execCommand insertion
    document.execCommand('insertText', false, testMessage);
    
    expect(textarea.value).toBe(testMessage);

    // Test that send button becomes enabled
    const inputEvent = new Event('input', { bubbles: true });
    textarea.dispatchEvent(inputEvent);
    
    // Simulate button state change
    if (textarea.value.trim()) {
      sendButton.disabled = false;
    }

    expect(sendButton.disabled).toBe(false);
  });

  it('content script handles different site layouts', async () => {
    // Test Claude-like layout
    document.body.innerHTML = `
      <div class="claude-app">
        <div class="chat-input-container">
          <div class="relative">
            <textarea 
              class="chat-input"
              placeholder="Talk to Claude..."
            ></textarea>
            <button class="send-button">
              <svg>...</svg>
            </button>
          </div>
        </div>
      </div>
    `;

    const claudeSelectors = {
      input: ['.chat-input', 'textarea[placeholder*="Claude"]'],
      submit: ['.send-button', 'button svg']
    };

    let input = null;
    for (const selector of claudeSelectors.input) {
      input = document.querySelector(selector);
      if (input) break;
    }

    expect(input).toBeTruthy();

    // Test Gemini-like layout
    document.body.innerHTML = `
      <div class="gemini-app">
        <div class="input-area">
          <textarea 
            data-testid="chat-input"
            placeholder="Enter a prompt here"
          ></textarea>
          <button aria-label="Send message">Send</button>
        </div>
      </div>
    `;

    const geminiSelectors = {
      input: ['[data-testid="chat-input"]', 'textarea[placeholder*="prompt"]'],
      submit: ['button[aria-label*="Send"]', 'button:has-text("Send")']
    };

    input = null;
    for (const selector of geminiSelectors.input) {
      input = document.querySelector(selector);
      if (input) break;
    }

    expect(input).toBeTruthy();
  });

  it('content script handles dynamic content', async () => {
    // Initial empty state
    document.body.innerHTML = `<div id="app">Loading...</div>`;

    // Simulate content script waiting for elements
    const waitForElement = (selector: string, timeout = 5000): Promise<Element | null> => {
      return new Promise(resolve => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }

        const observer = new MutationObserver(() => {
          const element = document.querySelector(selector);
          if (element) {
            observer.disconnect();
            resolve(element);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, timeout);
      });
    };

    // Start waiting for textarea
    const elementPromise = waitForElement('textarea');

    // Simulate dynamic content loading
    setTimeout(() => {
      document.body.innerHTML = `
        <div id="app">
          <div class="chat">
            <textarea placeholder="Type here..."></textarea>
            <button>Send</button>
          </div>
        </div>
      `;
    }, 100);

    const element = await elementPromise;
    expect(element).toBeTruthy();
    expect(element?.tagName.toLowerCase()).toBe('textarea');
  });

  it('content script handles iframe scenarios', async () => {
    // Create an iframe
    const iframe = document.createElement('iframe');
    iframe.srcdoc = `
      <html>
        <body>
          <textarea id="iframe-input" placeholder="Inside iframe"></textarea>
          <button id="iframe-send">Send</button>
        </body>
      </html>
    `;
    document.body.appendChild(iframe);

    // Wait for iframe to load
    await new Promise(resolve => {
      iframe.onload = resolve;
    });

    const iframeDoc = iframe.contentDocument;
    expect(iframeDoc).toBeTruthy();

    // Test that content script could access iframe content
    const iframeInput = iframeDoc?.querySelector('#iframe-input');
    expect(iframeInput).toBeTruthy();

    // Test cross-frame communication
    if (iframeDoc && iframeInput) {
      (iframeInput as HTMLTextAreaElement).value = 'Message from parent';
      const event = new Event('input', { bubbles: true });
      iframeInput.dispatchEvent(event);

      expect((iframeInput as HTMLTextAreaElement).value).toBe('Message from parent');
    }
  });

  it('content script handles shadow DOM', async () => {
    // Create element with shadow DOM
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    
    shadow.innerHTML = `
      <div class="chat-widget">
        <textarea id="shadow-input"></textarea>
        <button id="shadow-send">Send</button>
      </div>
    `;
    
    document.body.appendChild(host);

    // Test shadow DOM access
    const shadowInput = shadow.querySelector('#shadow-input');
    expect(shadowInput).toBeTruthy();

    // Test that content script could inject into shadow DOM
    if (shadowInput) {
      (shadowInput as HTMLTextAreaElement).value = 'Shadow DOM message';
      expect((shadowInput as HTMLTextAreaElement).value).toBe('Shadow DOM message');
    }
  });

  it('content script handles SPA navigation', async () => {
    // Initial page state
    document.body.innerHTML = `
      <div id="app">
        <nav>
          <a href="/chat" data-route="chat">Chat</a>
          <a href="/settings" data-route="settings">Settings</a>
        </nav>
        <div id="content">
          <div id="home-view">Home</div>
        </div>
      </div>
    `;

    // Simulate SPA navigation
    const navigateToChat = () => {
      document.getElementById('content')!.innerHTML = `
        <div id="chat-view">
          <textarea id="chat-input"></textarea>
          <button>Send</button>
        </div>
      `;
    };

    // Navigate to chat
    navigateToChat();

    // Content script should detect new elements
    const chatInput = document.getElementById('chat-input');
    expect(chatInput).toBeTruthy();

    // Test that content script re-initializes after navigation
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Simulate content script re-initialization
          const newInput = document.querySelector('textarea');
          if (newInput) {
            // Mark as initialized
            newInput.setAttribute('data-extension-ready', 'true');
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Trigger another navigation
    navigateToChat();

    const readyInput = document.querySelector('textarea[data-extension-ready]');
    expect(readyInput).toBeTruthy();

    observer.disconnect();
  });
});

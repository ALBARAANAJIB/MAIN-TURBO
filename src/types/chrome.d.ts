
// Type declarations for Chrome extension API
declare namespace chrome {
  namespace runtime {
    function sendMessage(message: any, callback?: (response: any) => void): void;
    function onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void): void;
      removeListener(callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void): void;
    };
    const lastError?: {
      message: string;
    };
    function getURL(path: string): string;
  }

  namespace identity {
    function getRedirectURL(): string;
    function launchWebAuthFlow(options: { url: string; interactive: boolean }, callback: (responseUrl?: string) => void): void;
  }

  namespace storage {
    namespace local {
      function get(keys: string | string[] | object | null, callback: (items: object) => void): void;
      function set(items: object, callback?: () => void): Promise<void>;
      function remove(keys: string | string[], callback?: () => void): Promise<void>;
    }
  }

  namespace tabs {
    function create(createProperties: { url: string }): void;
    function query(queryInfo: any, callback: (result: any[]) => void): void;
    function update(tabId?: number, updateProperties: object, callback?: (tab?: any) => void): void;
  }

  namespace scripting {
    function executeScript(injection: {
      target: { tabId: number };
      files?: string[];
      func?: () => void;
    }): Promise<any[]>;
  }
}

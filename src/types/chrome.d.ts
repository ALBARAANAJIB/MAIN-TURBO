
// Type declarations for Chrome extension API
declare namespace chrome {
  namespace runtime {
    function sendMessage(message: any, callback?: (response: any) => void): void;
    const lastError?: {
      message: string;
    };
  }

  namespace identity {
    function getRedirectURL(): string;
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
  }
}

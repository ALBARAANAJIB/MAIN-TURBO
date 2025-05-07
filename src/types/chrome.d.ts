
// Type declarations for Chrome extension API
interface Chrome {
  runtime: {
    sendMessage: (message: any, callback?: (response: any) => void) => void;
    lastError?: {
      message: string;
    };
  };
  identity: {
    getRedirectURL: () => string;
  };
  storage: {
    local: {
      get: (keys: string | string[] | object | null, callback: (items: object) => void) => void;
      set: (items: object, callback?: () => void) => Promise<void>;
      remove: (keys: string | string[], callback?: () => void) => Promise<void>;
    };
  };
}

declare const chrome: Chrome;

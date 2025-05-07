
// Type declarations for Chrome extension API
interface Chrome {
  runtime: {
    sendMessage: (message: any, callback?: (response: any) => void) => void;
    lastError?: {
      message: string;
    };
  };
}

declare const chrome: Chrome;

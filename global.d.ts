declare global {
  interface Window {
    __yakuVoucherUpload?: () => Promise<string[]>;
  }
}

export {};

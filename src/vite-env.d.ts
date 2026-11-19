/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RESULTS_ENDPOINT?: string;
  readonly VITE_ADMIN_PASSCODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

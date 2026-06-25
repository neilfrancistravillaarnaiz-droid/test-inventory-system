/// <reference types="vite/client" />

declare module "@simplewebauthn/browser" {
  export function startRegistration(
    options: PublicKeyCredentialCreationOptions
  ): Promise<Credential>;

  export function startAuthentication(
    options: PublicKeyCredentialRequestOptions
  ): Promise<Credential>;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_ORIGIN?: string;
  readonly VITE_APP_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

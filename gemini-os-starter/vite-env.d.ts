/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_KEY: string
    readonly GEMINI_API_KEY: string
    readonly FAL_KEY: string
  }
}

interface ImportMetaEnv {
  readonly VITE_FAL_KEY: string
  readonly GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

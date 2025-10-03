// Minimal ambient declarations to satisfy TS in this project.
// Firebase v12 uses modular SDKs with their own types; we do not need global 'firebase' lib.
// This file prevents TS2688 by providing a stub type library that is never used at runtime.
declare module "firebase" {
  export type _Stub = unknown;
}

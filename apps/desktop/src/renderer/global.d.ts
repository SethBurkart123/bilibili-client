import type { BiliBridge } from "@bili/types";

declare global {
  interface Window {
    bili: BiliBridge;
  }
}

export {};

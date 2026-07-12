import type { BiliBridge } from "./bridge";
import { MockBiliService } from "./mock";

export const service: BiliBridge = new MockBiliService();

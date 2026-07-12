import type { BiliBridge } from "./bridge";
import { MockBiliService } from "./mock";
import { RealBiliService } from "./real";

const useMock = process.env.BILI_MOCK === "1";

export const service: BiliBridge = useMock
  ? new MockBiliService()
  : new RealBiliService();

export async function flushService(): Promise<void> {
  if (service instanceof RealBiliService) {
    await service.flush();
  }
}

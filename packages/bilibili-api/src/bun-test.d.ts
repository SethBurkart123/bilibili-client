declare module "bun:test" {
  export function test(name: string, fn: () => unknown | Promise<unknown>): void;
  export function afterEach(fn: () => unknown | Promise<unknown>): void;
  export function expect(value: unknown): any;
}

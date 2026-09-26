import { describe, expect, it } from "vitest";

// Every primitive of the shadcn catalog is in the repository whether the app uses it yet or not, so
// nothing else imports most of them. Loading each module here is what proves they all still resolve
// their dependencies after an update.
const modules = import.meta.glob<Record<string, unknown>>("/src/common/ui/*.tsx", { eager: true });

describe("the UI catalog", () => {
  it.each(Object.entries(modules))("%s loads and exports its components", (_path: string, module: Record<string, unknown>) => {
    expect(Object.keys(module).length).toBeGreaterThan(0);
  });
});

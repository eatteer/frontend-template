import { describe, expect, it, vi } from "vitest";

import { ignoreWebVitals, reportWebVitals, setWebVitalsReporter } from "@/common/lib/web-vitals";

import type { Metric } from "web-vitals";

type Report = (metric: Metric) => void;

function buildMetric(overrides: Partial<Metric> = {}): Metric {
  return {
    name: "LCP",
    value: 1200,
    rating: "good",
    delta: 1200,
    id: "v5-1",
    entries: [],
    navigationType: "navigate",
    navigationId: 1,
    ...overrides,
  };
}

// Stands in for the library: keeps the callback each metric was given, to call it as the browser would.
function fakeListeners(count: number): { listeners: ((report: Report) => void)[]; reports: Report[] } {
  const reports: Report[] = [];

  const listeners = Array.from({ length: count }, (): ((report: Report) => void) => (report: Report): void => {
    reports.push(report);
  });

  return { listeners, reports };
}

describe("reportWebVitals", () => {
  it("listens for every metric the library measures", () => {
    const { listeners, reports } = fakeListeners(5);

    reportWebVitals(listeners);

    expect(reports).toHaveLength(5);
  });

  it("hands each metric to the reporter installed when it is final", () => {
    const report = vi.fn();
    const metric = buildMetric({ name: "CLS", value: 0.02 });
    const { listeners, reports } = fakeListeners(1);

    reportWebVitals(listeners);
    setWebVitalsReporter(report);
    reports[0]?.(metric);

    expect(report).toHaveBeenCalledWith(metric);
  });

  it("sends nothing anywhere when no provider is installed", () => {
    const { listeners, reports } = fakeListeners(1);

    setWebVitalsReporter(ignoreWebVitals);
    reportWebVitals(listeners);

    expect(() => {
      reports[0]?.(buildMetric());
    }).not.toThrow();
  });
});

import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

import type { Metric } from "web-vitals";

// The port the page's field measurements go through: how long the main content took to appear, how
// much the layout moved, how long an interaction waited. A provider (an analytics endpoint, the
// service that already receives the errors) is one implementation of it, installed with
// `setWebVitalsReporter` before the first render.
export type WebVitalsReporter = (metric: Metric) => void;

// No provider: nothing is sent. A measurement nobody collects has no reader, and writing it to the
// console would only be noise.
export const ignoreWebVitals: WebVitalsReporter = (): void => undefined;

let reporter: WebVitalsReporter = ignoreWebVitals;

// What the library offers for each metric: a function that calls back with it once it is known.
type MetricListener = (report: (metric: Metric) => void) => void;

const METRIC_LISTENERS: readonly MetricListener[] = [onCLS, onFCP, onINP, onLCP, onTTFB];

export function setWebVitalsReporter(next: WebVitalsReporter): void {
  reporter = next;
}

// Started once, before the first render, so nothing that happens while the page loads is missed.
// Each metric is handed over when it is final — some only when the reader leaves the page — to
// whichever reporter is installed by then. `listeners` are the library's unless a test passes its own.
export function reportWebVitals(listeners: readonly MetricListener[] = METRIC_LISTENERS): void {
  listeners.forEach((listen: MetricListener): void => {
    listen((metric: Metric): void => {
      reporter(metric);
    });
  });
}

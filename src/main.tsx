import "@/styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");

if (!rootElement) { throw new Error("index.html has no #root element to mount the application into"); }

createRoot(rootElement).render(
  <StrictMode>
    <main className="grid min-h-svh place-items-center">
      <h1 className="text-2xl font-semibold">Frontend template</h1>
    </main>
  </StrictMode>,
);

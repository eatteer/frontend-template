import { z } from "zod";

// Zod probes for `new Function` the first time it parses, to compile its object parsers. The
// Content-Security-Policy refuses that (`script-src 'self'`), so every load would report a violation
// before Zod fell back to the parsers it uses here instead. Imported before anything that parses, the
// validation of the environment included.
z.config({ jitless: true });

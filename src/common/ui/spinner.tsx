import { cn } from "cn";
import { Loader2Icon } from "lucide-react";

import type { JSX } from "react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">): JSX.Element {
  return (
    <Loader2Icon data-slot="spinner" role="status" aria-label="Loading" className={cn(`
      size-4 animate-spin
    `, className)} {...props}
    />
  );
}

export { Spinner };

import { cn } from "cn";
import * as React from "react";

function Label({ className, ...props }: React.ComponentProps<"label">): React.JSX.Element {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control -- a primitive: the control it labels arrives through `htmlFor` in the spread props, which the rule cannot see, and each form field wires it.
    <label
      data-slot="label"
      className={cn(
        `
          flex items-center gap-2 text-sm leading-none font-medium select-none
          group-data-[disabled=true]:pointer-events-none
          group-data-[disabled=true]:opacity-50
          peer-disabled:cursor-not-allowed peer-disabled:opacity-50
        `,
        className,
      )}
      {...props}
    />
  );
}

export { Label };

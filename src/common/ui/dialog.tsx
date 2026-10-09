import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/common/ui/button";

function Dialog({ ...props }: DialogPrimitive.Root.Props): React.JSX.Element {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props): React.JSX.Element {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props): React.JSX.Element {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props): React.JSX.Element {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props): React.JSX.Element {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        `
          fixed inset-0 isolate z-50 bg-black/10 duration-100
          supports-backdrop-filter:backdrop-blur-xs
          data-open:animate-in data-open:fade-in-0
          data-closed:animate-out data-closed:fade-out-0
        `,
        className,
      )}
      {...props}
    />
  );
}

// Changed from the registry: the popup no longer scrolls as a whole. It is a fixed frame around a
// scroller, and inside it the header and the footer are sticky, so a dialog taller than the screen
// keeps its title, its buttons and the close button in view while only its content moves (a form that
// wraps them all scrolls the same way). Each one draws a hairline only while content runs beneath it
// (the `overlay-*` utilities in `styles.css`). The header's bottom padding equals the scroller's gap,
// and its negative margin takes it back, so the space under the title is the same whether content
// rests below it or passes under it. The popup is centred by its margins inside the viewport, not by
// a translate of half its size: a translate lands the frame on a fraction of a pixel whenever its size
// is odd or the display is scaled, and the sticky header is then rounded apart from the frame once it
// sticks, so it seems to shift by a pixel as soon as the content scrolls. A call site that places the
// popup elsewhere sets its own top and `bottom-auto`. `--dialog-gutter` is the frame's padding, which a call site may
// change; nothing else about the frame is set from outside.
// Also changed from the registry: `closeLabel` names the close button in the reader's language (the
// registry hard-codes "Close"), as the toaster's does. It is required whenever the button is shown,
// with no default, so a dialog cannot ship a close button announced in English. Keep both on an
// update of the component.
type DialogCloseButtonProps =
  | { showCloseButton?: boolean; closeLabel: string }
  | { showCloseButton: false; closeLabel?: undefined };

function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeLabel,
  ...props
}: DialogPrimitive.Popup.Props & DialogCloseButtonProps): React.JSX.Element {
  return (
    <DialogPortal>
      <DialogOverlay />

      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          `
            fixed inset-0 z-50 m-auto flex h-fit max-h-[calc(100dvh-2rem)]
            w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-xl
            bg-popover text-sm text-popover-foreground ring-1 ring-foreground/10
            duration-100 outline-none [--dialog-gutter:--spacing(4)]
            has-[>[data-slot=dialog-close]]:**:data-[slot=dialog-header]:pr-12
            sm:max-w-sm
            data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
            data-closed:animate-out data-closed:fade-out-0
            data-closed:zoom-out-95
          `,
          className,
        )}
        {...props}
      >
        <div
          data-slot="dialog-scroller"
          className="
            grid min-h-0 gap-4 overflow-y-auto overscroll-contain
            px-(--dialog-gutter) pb-(--dialog-gutter) overlay-scroller
            not-has-data-[slot=dialog-header]:pt-(--dialog-gutter)
            has-data-[slot=dialog-footer]:pb-0
          "
        >
          {children}
        </div>

        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2 z-20"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">{closeLabel}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        `
          sticky top-0 z-10 -mx-(--dialog-gutter) -mb-4 flex overlay-rule-top
          flex-col gap-2 bg-popover px-(--dialog-gutter) pt-(--dialog-gutter)
          pb-4
        `,
        className,
      )}
      {...props}
    />
  );
}

// Changed from the registry, which offers a footer button that closes the dialog labelled "Close" in
// English: closing is the corner's button, and a footer holds the dialog's own actions. Its top
// padding equals the scroller's gap, as the header's bottom does. Do not bring the prop back on an
// update.
function DialogFooter({ className, children, ...props }: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        `
          sticky bottom-0 z-10 -mx-(--dialog-gutter) -mt-4 flex
          overlay-rule-bottom flex-col-reverse gap-2 bg-popover
          px-(--dialog-gutter) pt-4 pb-(--dialog-gutter)
          sm:flex-row sm:justify-end
        `,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props): React.JSX.Element {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props): React.JSX.Element {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        `
          text-sm text-muted-foreground
          *:[a]:underline *:[a]:underline-offset-3
          *:[a]:hover:text-foreground
        `,
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};

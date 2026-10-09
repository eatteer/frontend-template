import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { cn } from "cn";
import * as React from "react";

import { Button } from "@/common/ui/button";

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props): React.JSX.Element {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

function AlertDialogOverlay({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
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

// Changed from the registry, as the dialog's is: the popup is a fixed frame around a scroller in
// which the header and the footer are sticky, so a long confirmation keeps its title and its buttons
// in view and only what lies between them scrolls (the `overlay-*` utilities in `styles.css`). Its
// header's bottom padding and its footer's top padding equal the scroller's gap, and it is centred by
// its margins rather than a translate, both for the same reasons as the dialog's. Keep these on an
// update of the component.
function AlertDialogContent({
  className,
  size = "default",
  children,
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  size?: "default" | "sm"
}): React.JSX.Element {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />

      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          `
            group/alert-dialog-content fixed inset-0 z-50 m-auto flex h-fit
            max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl
            bg-popover text-popover-foreground ring-1 ring-foreground/10
            duration-100 outline-none [--dialog-gutter:--spacing(4)]
            data-[size=default]:max-w-xs
            data-[size=sm]:max-w-xs
            data-[size=default]:sm:max-w-sm
            data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
            data-closed:animate-out data-closed:fade-out-0
            data-closed:zoom-out-95
          `,
          className,
        )}
        {...props}
      >
        <div
          data-slot="alert-dialog-scroller"
          className="
            grid min-h-0 gap-4 overflow-y-auto overscroll-contain
            px-(--dialog-gutter) pb-(--dialog-gutter) overlay-scroller
            not-has-data-[slot=alert-dialog-header]:pt-(--dialog-gutter)
            has-data-[slot=alert-dialog-footer]:pb-0
          "
        >
          {children}
        </div>
      </AlertDialogPrimitive.Popup>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        `
          sticky top-0 z-10 -mx-(--dialog-gutter) -mb-4 grid overlay-rule-top
          grid-rows-[auto_1fr] place-items-center gap-1.5 bg-popover
          px-(--dialog-gutter) pt-(--dialog-gutter) pb-4 text-center
          has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr]
          has-data-[slot=alert-dialog-media]:gap-x-4
          sm:group-data-[size=default]/alert-dialog-content:place-items-start
          sm:group-data-[size=default]/alert-dialog-content:text-left
          sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]
        `,
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        `
          sticky bottom-0 z-10 -mx-(--dialog-gutter) -mt-4 flex
          overlay-rule-bottom flex-col-reverse gap-2 bg-popover
          px-(--dialog-gutter) pt-4 pb-(--dialog-gutter)
          group-data-[size=sm]/alert-dialog-content:grid
          group-data-[size=sm]/alert-dialog-content:grid-cols-2
          sm:flex-row sm:justify-end
        `,
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        `
          mb-2 inline-flex size-10 items-center justify-center rounded-md
          bg-muted
          sm:group-data-[size=default]/alert-dialog-content:row-span-2
          *:[svg:not([class*='size-'])]:size-6
        `,
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        `
          font-heading text-base font-medium
          sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2
        `,
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        `
          text-sm text-balance text-muted-foreground
          md:text-pretty
          *:[a]:underline *:[a]:underline-offset-3
          *:[a]:hover:text-foreground
        `,
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>): React.JSX.Element {
  return (
    <Button
      data-slot="alert-dialog-action"
      className={cn(className)}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};

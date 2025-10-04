// src/components/ui/dialog.jsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../lib/utils";

export function Dialog({ children, ...props }) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>;
}

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogOverlay = ({ className, ...props }) => (
  <DialogPrimitive.Overlay
    className={cn("fixed inset-0 bg-black/50 backdrop-blur-sm z-50", className)}
    {...props}
  />
);
export const DialogContent = ({ className, ...props }) => (
  <DialogPrimitive.Content
    className={cn(
      "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-md shadow-xl",
      className
    )}
    {...props}
  />
);
export const DialogTitle = ({ className, ...props }) => (
  <DialogPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />
);
export const DialogClose = DialogPrimitive.Close;

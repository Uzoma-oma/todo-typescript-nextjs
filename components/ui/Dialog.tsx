'use client';

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../lib/utils";

export function Dialog({ children, ...props }: DialogPrimitive.DialogProps) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>;
}

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;

interface DialogOverlayProps extends DialogPrimitive.DialogOverlayProps {
  className?: string;
}

export const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn("fixed inset-0 bg-black/50 backdrop-blur-sm z-50", className)}
      {...props}
    />
  )
);
DialogOverlay.displayName = "DialogOverlay";

interface DialogContentProps extends DialogPrimitive.DialogContentProps {
  className?: string;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-md shadow-xl",
        className
      )}
      {...props}
    />
  )
);
DialogContent.displayName = "DialogContent";

interface DialogTitleProps extends DialogPrimitive.DialogTitleProps {
  className?: string;
}

export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Title 
      ref={ref}
      className={cn("text-lg font-semibold", className)} 
      {...props} 
    />
  )
);
DialogTitle.displayName = "DialogTitle";

export const DialogClose = DialogPrimitive.Close;
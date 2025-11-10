import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const dialogOverlayVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center transition-colors pointer-events-auto",
  {
    variants: {
      variant: {
        default: "bg-black/50",
        light: "bg-black/30",
        heavy: "bg-black/70 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const dialogContentVariants = cva(
  "relative bg-background rounded-lg shadow-lg mx-4 transition-all",
  {
    variants: {
      size: {
        sm: "max-w-sm w-full p-4",
        default: "max-w-lg w-full p-6",
        lg: "max-w-2xl w-full p-6",
        xl: "max-w-4xl w-full p-8",
        full: "max-w-[95vw] w-full p-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface DialogProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogOverlayVariants>,
    VariantProps<typeof dialogContentVariants> {
  open?: boolean;
  onClose?: () => void;
}

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ className, children, open, onClose, variant, size, ...props }, ref) => {
    if (!open) return null;

    return (
      <div
        className={dialogOverlayVariants({ variant })}
        onClick={onClose}
        {...props}
      >
        <div
          ref={ref}
          className={cn(dialogContentVariants({ size, className }))}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  },
);
Dialog.displayName = "Dialog";

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-4", className)}
    {...props}
  />
));
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex justify-end gap-2 mt-6", className)}
    {...props}
  />
));
DialogFooter.displayName = "DialogFooter";

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative bg-background rounded-lg shadow-lg", className)}
    {...props}
  >
    {children}
  </div>
));
DialogContent.displayName = "DialogContent";

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  dialogOverlayVariants,
  dialogContentVariants,
};

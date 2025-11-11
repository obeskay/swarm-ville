import * as React from "react";
import { createPortal } from "react-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Dialog overlay variants with proper backdrop
const dialogOverlayVariants = cva(
  "fixed inset-0 flex items-center justify-center transition-all duration-200 pointer-events-auto",
  {
    variants: {
      backdrop: {
        default: "bg-background/80 backdrop-blur-sm",
        dark: "bg-background/90 backdrop-blur-md",
        light: "bg-background/60 backdrop-blur-sm",
        none: "bg-transparent",
      },
      zIndex: {
        modal: "z-[100]",
        popover: "z-50",
        toast: "z-[200]",
      },
    },
    defaultVariants: {
      backdrop: "default",
      zIndex: "modal",
    },
  }
);

// Dialog content variants
const dialogContentVariants = cva(
  "bg-card rounded-2xl shadow-2xl mx-4 flex flex-col max-h-[90vh] w-full transition-all duration-200",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        default: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[95vw]",
      },
      animation: {
        none: "",
        fade: "animate-in fade-in-0",
        scale: "animate-in fade-in-0 zoom-in-95",
        slide: "animate-in fade-in-0 slide-in-from-bottom-4",
      },
    },
    defaultVariants: {
      size: "default",
      animation: "scale",
    },
  }
);

export interface DialogProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogContentVariants>,
    Pick<VariantProps<typeof dialogOverlayVariants>, "backdrop" | "zIndex"> {
  open?: boolean;
  onClose?: () => void;
}

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ className, children, open, onClose, size, animation, backdrop, zIndex, ...props }, ref) => {
    // Don't render if not open
    if (!open) return null;

    // Prevent body scroll when dialog is open
    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = "";
        };
      }
    }, [open]);

    // Render in portal at document.body for proper z-index layering
    return createPortal(
      <div
        className={cn(dialogOverlayVariants({ backdrop, zIndex }))}
        onClick={onClose}
        {...props}
      >
        <div
          ref={ref}
          className={cn(dialogContentVariants({ size, animation, className }))}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }
);
Dialog.displayName = "Dialog";

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 border-b border-border/50 px-6 py-4 flex-shrink-0",
        className
      )}
      {...props}
    />
  )
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-card-foreground",
        className
      )}
      {...props}
    />
  )
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex justify-end gap-2 border-t border-border/50 px-6 py-4 flex-shrink-0",
        className
      )}
      {...props}
    />
  )
);
DialogFooter.displayName = "DialogFooter";

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("overflow-y-auto px-6 py-4 flex-1", className)} {...props}>
      {children}
    </div>
  )
);
DialogContent.displayName = "DialogContent";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };

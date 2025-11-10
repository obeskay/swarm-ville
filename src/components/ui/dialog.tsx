import * as React from "react";
import { cn } from "@/lib/utils";

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onClose?: () => void;
  size?: "sm" | "default" | "lg" | "xl" | "full";
}

const sizeClasses = {
  sm: "max-w-sm",
  default: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw]",
};

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ className, children, open, onClose, size = "default", ...props }, ref) => {
    if (!open) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-colors pointer-events-auto"
        onClick={onClose}
        {...props}
      >
        <div
          ref={ref}
          className={cn(
            "bg-card rounded-2xl shadow-lg mx-4 transition-all flex flex-col max-h-[90vh] w-full",
            sizeClasses[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
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

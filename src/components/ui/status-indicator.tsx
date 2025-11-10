import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusIndicatorVariants = cva(
  "inline-flex items-center gap-1.5 transition-all duration-200",
  {
    variants: {
      variant: {
        online: "text-emerald-500 dark:text-emerald-400",
        offline: "text-amber-500 dark:text-amber-400",
        error: "text-red-500 dark:text-red-400",
        idle: "text-muted-foreground",
      },
      size: {
        sm: "text-[10px]",
        md: "text-xs",
        lg: "text-sm",
      },
      showDot: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "idle",
      size: "md",
      showDot: true,
    },
  }
);

const dotVariants = cva(
  "rounded-full transition-all duration-200",
  {
    variants: {
      variant: {
        online: "bg-emerald-500 dark:bg-emerald-400",
        offline: "bg-amber-500 dark:bg-amber-400 animate-pulse",
        error: "bg-red-500 dark:bg-red-400 animate-pulse",
        idle: "bg-muted-foreground/50",
      },
      size: {
        sm: "h-1.5 w-1.5",
        md: "h-2 w-2",
        lg: "h-2.5 w-2.5",
      },
    },
    defaultVariants: {
      variant: "idle",
      size: "md",
    },
  }
);

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label?: string;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, variant, size, showDot, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusIndicatorVariants({ variant, size, showDot, className }))}
        {...props}
      >
        {showDot && (
          <span className={cn(dotVariants({ variant, size }))} />
        )}
        {label && (
          <span className="font-medium">
            {label}
          </span>
        )}
      </div>
    );
  }
);

StatusIndicator.displayName = "StatusIndicator";

export { StatusIndicator, statusIndicatorVariants };

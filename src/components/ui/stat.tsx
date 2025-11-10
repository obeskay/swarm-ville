import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statVariants = cva(
  "inline-flex items-center gap-1.5 transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        success: "text-emerald-500 dark:text-emerald-400",
        warning: "text-amber-500 dark:text-amber-400",
        error: "text-red-500 dark:text-red-400",
        primary: "text-primary",
      },
      size: {
        sm: "text-[10px]",
        md: "text-xs",
        lg: "text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface StatProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statVariants> {
  icon?: React.ReactNode;
  value: string | number;
  label?: string;
}

const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  ({ className, variant, size, icon, value, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statVariants({ variant, size, className }))}
        {...props}
      >
        {icon && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        <span className="font-medium tabular-nums">
          {value}
        </span>
        {label && (
          <span className="font-medium opacity-50">
            {label}
          </span>
        )}
      </div>
    );
  }
);

Stat.displayName = "Stat";

export { Stat, statVariants };

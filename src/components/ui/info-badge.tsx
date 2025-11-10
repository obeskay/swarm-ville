import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const infoBadgeVariants = cva(
  "inline-flex items-center gap-2 rounded-xl transition-all duration-200 border",
  {
    variants: {
      variant: {
        default: "bg-card border-border/40 hover:border-border/60",
        primary: "bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:border-primary/30",
        success: "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30",
        warning: "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30",
        muted: "bg-muted/50 border-border/30 hover:border-border/50",
      },
      size: {
        sm: "px-2 py-1 text-xs gap-1.5",
        md: "px-3 py-1.5 text-sm gap-2",
        lg: "px-4 py-2 text-base gap-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const infoBadgeIconVariants = cva(
  "flex-shrink-0",
  {
    variants: {
      size: {
        sm: "h-3 w-3",
        md: "h-3.5 w-3.5",
        lg: "h-4 w-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface InfoBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof infoBadgeVariants> {
  icon?: React.ReactNode;
  label?: string;
  value: string | number | React.ReactNode;
}

const InfoBadge = React.forwardRef<HTMLDivElement, InfoBadgeProps>(
  ({ className, variant, size, icon, label, value, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(infoBadgeVariants({ variant, size, className }))}
        {...props}
      >
        {icon && (
          <div className={cn(infoBadgeIconVariants({ size }))}>
            {icon}
          </div>
        )}
        {label && (
          <span className="text-muted-foreground">
            {label}
          </span>
        )}
        <span className="font-semibold tabular-nums">
          {value}
        </span>
      </div>
    );
  }
);

InfoBadge.displayName = "InfoBadge";

export { InfoBadge, infoBadgeVariants };

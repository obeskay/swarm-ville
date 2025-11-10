import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "rounded-[var(--radius)] bg-card text-card-foreground shadow-soft transition-all",
  {
    variants: {
      variant: {
        default: "bg-card border border-border",
        yellow: "bg-[hsl(var(--card-accent))] border-0",
        blue: "bg-[hsl(var(--card-accent-light))] border-0",
        elevated: "shadow-soft-lg border-0",
      },
      innerCorners: {
        none: "",
        topLeft: "inner-corner-tl",
        topRight: "inner-corner-tr",
        bottomLeft: "inner-corner-bl",
        bottomRight: "inner-corner-br",
      },
      spacing: {
        default: "",
        generous: "spacing-generous",
      },
    },
    defaultVariants: {
      variant: "default",
      innerCorners: "none",
      spacing: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, innerCorners, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, innerCorners, spacing, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-3 p-[var(--spacing-base)]", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-tight tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-body-large", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-[var(--spacing-base)] pt-0", className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-4 p-[var(--spacing-base)] pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

import * as React from "react";
import {
  Button as UIButton,
  type ButtonProps as UIButtonProps,
} from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GameVariant =
  | "default"
  | "learning"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type GameButtonProps = Omit<UIButtonProps, "variant"> & {
  variant?: GameVariant;
};

const learningClasses =
  "bg-brand-primary text-white shadow-card transition-colors duration-fast hover:bg-brand-primary/90 focus-visible:ring-brand-primary";

export const Button = React.forwardRef<HTMLButtonElement, GameButtonProps>(
  ({ variant = "default", className, ...props }, ref) => {
    if (variant === "learning") {
      return (
        <UIButton
          ref={ref}
          className={cn(learningClasses, className)}
          {...props}
        />
      );
    }
    return (
      <UIButton
        ref={ref}
        variant={variant}
        className={className}
        {...props}
      />
    );
  },
);
Button.displayName = "GameButton";

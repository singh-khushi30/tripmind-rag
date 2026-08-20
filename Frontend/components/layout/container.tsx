import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className">;

export function Container({
  children,
  className,
  as: Comp = "div",
  ...props
}: ContainerProps) {
  const Element = Comp as ElementType;
  return (
    <Element
      className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}
      {...props}
    >
      {children}
    </Element>
  );
}

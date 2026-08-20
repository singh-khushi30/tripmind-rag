import type { ReactNode } from "react";

type MainProps = {
  children: ReactNode;
};

export function Main({ children }: MainProps) {
  return (
    <main className="animate-in fade-in flex flex-1 flex-col duration-300">
      {children}
    </main>
  );
}

import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

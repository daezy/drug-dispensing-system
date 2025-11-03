import { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default function PharmacistLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

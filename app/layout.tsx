import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lightbase — Estimation",
  description:
    "Outil d'estimation budgétaire pour la mise aux normes et la conversion DEL — éclairage sportif municipal.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

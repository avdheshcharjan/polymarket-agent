import type { Metadata } from "next";
import localFont from "next/font/local";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const carbon = localFont({
  src: [
    {
      path: "../../public/fonts/Carbon-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Carbon-Bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-carbon",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PolyAgent IPL — AI Cricket Trader | Powered by Exa",
  description:
    "Autonomous IPL prediction market trader using Exa.ai's neural search to research cricket markets on Polymarket. Real-time dashboard showing AI-driven analysis and trades.",
  openGraph: {
    title: "PolyAgent IPL — AI Cricket Trader | Powered by Exa",
    description:
      "Autonomous IPL prediction market trader using Exa.ai's neural search for cricket intelligence.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PolyAgent IPL — AI Cricket Trader | Powered by Exa",
    description:
      "Autonomous IPL prediction market trader using Exa.ai's neural search for cricket intelligence.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${carbon.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-0">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}

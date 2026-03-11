import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Telvia CRM — Website Scoring Pipeline",
  description: "Sales prospecting tool for Spanish company websites",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 pl-60">
                <div className="p-6">{children}</div>
              </main>
            </div>
            <KeyboardShortcuts />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata = {
  title: "Bazaar",
  description: "Multi-Tenant Retail POS SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
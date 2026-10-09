import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "../features/ar-crafts/theme.css";
import "../features/legal/legal.css";
import { CookieNotice } from "../features/legal/cookie-notice";
export const metadata: Metadata = {
  title: "AR crafts · Adriana Ravello · Demo visual",
  description:
    "Exploración visual de talleres y materiales de joyería artesanal. Contenido e ilustraciones de demostración.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-PE">
      <body>
        {children}
        <CookieNotice />
      </body>
    </html>
  );
}

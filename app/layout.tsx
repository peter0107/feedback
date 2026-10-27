import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "성창재 네트워킹 | 팀별 익명 피드백",
  description: "성창재 네트워킹 발표팀에 익명으로 의견을 남기고 함께 확인하세요.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next"
import { DM_Sans, Manrope } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { AuthLinkNotice } from "@/features/auth/ui/auth-link-notice"
import "./globals.css"

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" })
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" })

export const metadata: Metadata = {
  title: "Valion",
  icons: {
    icon: "/brand/valion-favicon.png",
  },
  description:
    "Sistema web moderno para receitas, despesas fixas, investimentos e histórico financeiro.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
        <AuthLinkNotice />
      </body>
    </html>
  )
}

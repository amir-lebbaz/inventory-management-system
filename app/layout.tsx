import type React from "react"
import "./globals.css"
import type { Metadata } from "next/metadata"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "نظام إدارة الطلبات والمخزون",
  description: "نظام شامل لإدارة طلبات العمال والمخزون والموارد البشرية",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

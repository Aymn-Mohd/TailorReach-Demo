import type { Metadata } from "next"
import localFont from "next/font/local"
import { ClerkProvider } from '@clerk/nextjs'
import RootLayoutClient from "./layout-client"

// Import both global styles and Tailwind
import "@/app/styles/globals.css"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export async function generateMetadata({ params }: { params: { slug: string[] } }): Promise<Metadata> {
  const page = params.slug ? params.slug[params.slug.length - 1] : ''
  const capitalizedPage = page.charAt(0).toUpperCase() + page.slice(1)

  return {
    title: `TailorReach Demo`,
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClerkProvider>
          <RootLayoutClient>{children}</RootLayoutClient>
        </ClerkProvider>
      </body>
    </html>
  )
}
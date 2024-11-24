import type { Metadata } from "next"
import localFont from "next/font/local"
import "@/app/styles/globals.css"
import RootLayoutClient from "./layout-client"
import { ClerkProvider } from '@clerk/nextjs'

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
      <ClerkProvider>
        <body>
          <RootLayoutClient>{children}</RootLayoutClient>
        </body>
      </ClerkProvider>
    </html>
  )
}
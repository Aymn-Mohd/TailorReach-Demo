'use client'

import { UserButton, useAuth } from '@clerk/nextjs'
import { Home, PersonStanding, Speaker, Star } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import Logo from "@/components/img/logo.svg"
import Image from "next/image"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { GlobalSearch } from "@/components/global-search"

const items = [
  {
    title: "Home",
    icon: Home,
    href: "/",
  },
  {
    title: "Customers",
    icon: PersonStanding,
    href: "/customers",
  },
  {
    title: "Campaigns",
    icon: Speaker,
    href: "/campaigns",
  },
  {
    title: "Products",
    icon: Star,
    href: "/products",
  },
]

function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-center px-4 py-1">
        <Image
          src={Logo}
          alt="TailorReach Logo"
          width={144}
          height={144}
          className="h-36 w-36"
          priority
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
  )
}

function AppBreadcrumb() {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`
          return (
            <BreadcrumbItem key={segment}>
              {index !== 0 && <BreadcrumbSeparator />}
              {index === pathSegments.length - 1 ? (
                <BreadcrumbPage>{segment}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={href}>{segment}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Don't redirect if already on auth pages
      if (!pathname.includes('/sign-in') && !pathname.includes('/sign-up')) {
        router.push('/sign-in')
      }
    }
  }, [isLoaded, isSignedIn, router, pathname])

  // Show nothing while loading
  if (!isLoaded) {
    return null
  }

  // Don't show layout on auth pages
  if (!isSignedIn && (pathname.includes('/sign-in') || pathname.includes('/sign-up'))) {
    return children
  }

  // Show layout only when signed in
  if (isSignedIn) {
    return (
      <div className="flex h-screen overflow-hidden bg-background font-sans antialiased">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 overflow-hidden">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
              <SidebarTrigger />
              <AppBreadcrumb />
              <div className="ml-auto flex items-center gap-4">
                <GlobalSearch />
                <UserButton />
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    )
  }

  return null
}

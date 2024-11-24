"use client"

import { useState } from "react"
import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useUser, useAuth } from "@clerk/nextjs"
import { fetchProducts, fetchCustomers, fetchCampaigns } from "@/app/utils/supabaseRequests"
import { DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

type SearchResult = {
  id: string
  name: string
  type: 'product' | 'customer' | 'campaign'
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const { user: clerkuser } = useUser()
  const { getToken } = useAuth()

  const handleSearch = async (query: string) => {
    if (!clerkuser) return
    const token = await getToken({ template: "supabase" })
    if (!token) return

    const products = await fetchProducts(clerkuser.id, token) || []
    const customers = await fetchCustomers(clerkuser.id, token) || []
    const campaigns = await fetchCampaigns(clerkuser.id, token) || []

    const results: SearchResult[] = [
      ...products.map(p => ({ id: p.id, name: p.name, type: 'product' as const })),
      ...customers.map(c => ({ id: c.id, name: c.name, type: 'customer' as const })),
      ...campaigns.map(c => ({ id: c.uid, name: c.name, type: 'campaign' as const })),
    ].filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    )

    setSearchResults(results)
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle asChild>
          <VisuallyHidden>Search</VisuallyHidden>
        </DialogTitle>
        <CommandInput placeholder="Type to search..." onValueChange={handleSearch} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Products">
            {searchResults.filter(r => r.type === 'product').map(result => (
              <CommandItem key={result.id}>{result.name}</CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Customers">
            {searchResults.filter(r => r.type === 'customer').map(result => (
              <CommandItem key={result.id}>{result.name}</CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Campaigns">
            {searchResults.filter(r => r.type === 'campaign').map(result => (
              <CommandItem key={result.id}>{result.name}</CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}


'use client'

import { useState, useEffect, FormEvent } from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, Plus, CalendarIcon } from 'lucide-react'
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { fetchCampaigns, deleteCampaign, updateCampaign, createCampaign, fetchProducts } from "@/app/utils/supabaseRequests"

interface Campaign {
  uid: string
  name: string
  description: string
  keywords: string
  products: string
  campaign_date: string
}

interface Product {
  id: number
  name: string
}

export default function CampaignsPage() {
  const { user: clerkuser } = useUser()
  const { getToken } = useAuth()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [isNewSheetOpen, setIsNewSheetOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [newCampaignDate, setNewCampaignDate] = useState<Date>()
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [editingProduct, setEditingProduct] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    if (clerkuser) {
      fetchProductsData().then(() => fetchCampaignsData())
    }
  }, [clerkuser])

  const columns: ColumnDef<Campaign>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "keywords",
      header: "Keywords",
    },
    {
      accessorKey: "products",
      header: "Product",
      cell: ({ row }) => {
        const productId = row.getValue("products") as string
        const product = products.find(p => p.id.toString() === productId)
        return <div>{product ? product.name : 'No product selected'}</div>
      },
    },
    {
      accessorKey: "campaign_date",
      header: "Campaign Date",
      cell: ({ row }) => <div>{new Date(row.getValue("campaign_date")).toLocaleDateString()}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const campaign = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openEditSheet(campaign)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteCampaign(campaign.uid)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: campaigns,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  async function fetchCampaignsData() {
    if (!clerkuser) return

    const token = await getToken({ template: "supabase" })
    if (!token) return

    try {
      const data = await fetchCampaigns(clerkuser.id, token)
      if (data) {
        setCampaigns(data)
      } else {
        throw new Error("Failed to fetch campaigns")
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      toast({
        title: "Error",
        description: "Failed to fetch campaigns. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function fetchProductsData() {
    if (!clerkuser) return

    const token = await getToken({ template: "supabase" })
    if (!token) return

    try {
      const data = await fetchProducts(clerkuser.id, token)
      if (data) {
        setProducts(data.map(product => ({
          ...product,
          id: parseInt(product.id)
        })))
      } else {
        throw new Error("Failed to fetch products")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteCampaign(uid: string) {
    if (!clerkuser) {
      console.error("No user found")
      return
    }

    const token = await getToken({ template: "supabase" })
    if (!token) {
      console.error("No token found")
      return
    }

    try {
      const { error } = await deleteCampaign(uid, clerkuser.id, token)
      if (error) {
        throw error
      }
      await fetchCampaignsData()
      toast({
        title: "Success",
        description: "Campaign deleted successfully.",
      })
    } catch (error: any) {
      console.error("Error deleting campaign:", error)
      toast({
        title: "Error",
        description: `Failed to delete campaign: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  function openEditSheet(campaign: Campaign) {
    setEditingCampaign(campaign)
    setEditingProduct(campaign.products || 'no_product')
    setIsEditSheetOpen(true)
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingCampaign || !clerkuser) return

    const token = await getToken({ template: "supabase" })
    if (!token) return

    const formData = new FormData(event.target as HTMLFormElement)
    const updatedCampaign = {
      ...editingCampaign,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      keywords: formData.get("keywords") as string,
      products: editingProduct === "no_product" ? null : editingProduct,
      campaign_date: formData.get("campaign_date") as string,
      userid: clerkuser.id
    }

    try {
      const { error } = await updateCampaign(editingCampaign.uid, updatedCampaign, clerkuser.id, token)
      if (error) throw error
      await fetchCampaignsData()
      setIsEditSheetOpen(false)
      toast({
        title: "Success",
        description: "Campaign updated successfully.",
      })
    } catch (error: any) {
      console.error("Error updating campaign:", error)
      toast({
        title: "Error",
        description: `Failed to update campaign: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  async function handleNewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!clerkuser) return

    const token = await getToken({ template: "supabase" })
    if (!token) return

    const formData = new FormData(event.target as HTMLFormElement)
    const newCampaign = {
      uid: crypto.randomUUID(),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      keywords: formData.get("keywords") as string,
      products: selectedProduct === "no_product" ? null : selectedProduct,
      campaign_date: newCampaignDate ? format(newCampaignDate, 'yyyy-MM-dd') : null,
      userid: clerkuser.id
    }

    try {
      const { error } = await createCampaign(clerkuser.id, newCampaign, token)
      if (error) throw error
      await fetchCampaignsData()
      setIsNewSheetOpen(false)
      setNewCampaignDate(undefined)
      setSelectedProduct("")
      toast({
        title: "Success",
        description: "Campaign created successfully.",
      })
    } catch (error: any) {
      console.error("Error creating campaign:", error)
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Filter by name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Button onClick={() => setIsNewSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </div>
      </div>
      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Campaign</SheetTitle>
            <SheetDescription>
              Make changes to the campaign information here.
            </SheetDescription>
          </SheetHeader>
          {editingCampaign && (
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingCampaign.name}
                />
              </div>
              <div className="space-y-2
">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingCampaign.description}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-keywords">Keywords</Label>
                <Input
                  id="edit-keywords"
                  name="keywords"
                  defaultValue={editingCampaign.keywords}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-product">Product</Label>
                <Select 
                  value={editingProduct} 
                  onValueChange={setEditingProduct}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_product">No product</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-campaign-date">Campaign Date</Label>
                <Input
                  id="edit-campaign-date"
                  name="campaign_date"
                  type="date"
                  defaultValue={editingCampaign.campaign_date}
                />
              </div>
              <Button type="submit" className="w-full">
                Save changes
              </Button>
            </form>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={isNewSheetOpen} onOpenChange={setIsNewSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New Campaign</SheetTitle>
            <SheetDescription>
              Add a new campaign by filling out the information below.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleNewSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name</Label>
              <Input id="new-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-description">Description</Label>
              <Textarea id="new-description" name="description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-keywords">Keywords</Label>
              <Input id="new-keywords" name="keywords" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-product">Product</Label>
              <Select 
                value={selectedProduct} 
                onValueChange={setSelectedProduct}
              >
                <SelectTrigger>
                  <SelectValue>
                    {selectedProduct ? products.find(p => p.id.toString() === selectedProduct)?.name : "Select product"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_product">No product</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-campaign-date">Campaign Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newCampaignDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newCampaignDate ? format(newCampaignDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newCampaignDate}
                    onSelect={setNewCampaignDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button type="submit" className="w-full">
              Create Campaign
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}


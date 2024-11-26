'use client'

import React, { useState, useEffect, FormEvent } from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import { MoreHorizontal, Plus, Activity, CheckSquare, Square, Send, Eye, Pencil, Trash } from 'lucide-react'
import { useRouter } from 'next/navigation'
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

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts'

import { fetchProducts, deleteProduct, updateProduct, createProduct } from "@/app/utils/supabaseRequests"

interface Product {
  id: string
  name: string
  price: string
  description: string
  keywords: string
  userid: string
  customers: CustomerActivity[]
  likeestimate: number
}

interface CustomerActivity {
  customerId: string
  customerName: string
  type: string
  productId: string
  productName: string
  message: string
  status: string
  date: string
}

const ActivitySheet = ({ customers, likeEstimate }: { 
  customers: CustomerActivity[], 
  likeEstimate: number 
}) => {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  
  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredActivities = React.useMemo(() => {
    return customers?.filter(activity => {
      if (!debouncedSearchQuery && statusFilter === "all") return true

      const searchFields = [
        activity.customerName,
        activity.message,
        activity.productName,
        new Date(activity.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      ]

      const matchesSearch = debouncedSearchQuery === "" || searchFields.some(field => 
        field.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
      
      const matchesStatus = 
        statusFilter === "all" || 
        activity.status === statusFilter

      return matchesSearch && matchesStatus
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [customers, debouncedSearchQuery, statusFilter])

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900'
      case 'converting':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200 hover:text-amber-900'
      case 'converted':
        return 'bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const chartData = [
    {
      name: 'Likelihood',
      value: likeEstimate || 0,
      fill: likeEstimate >= 75 ? '#22c55e' : // green
            likeEstimate >= 50 ? '#f59e0b' : // amber
            '#ef4444', // red
    }
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={!customers?.length}
          className={customers?.length ? "text-orange-500 hover:text-orange-600" : "opacity-50 cursor-not-allowed"}
        >
          <Activity className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[600px] flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Customer Activities ({customers?.length})</SheetTitle>
          <SheetDescription>
            Recent activities for this product
          </SheetDescription>
        </SheetHeader>
        
        {/* Fixed Section */}
        <div className="border-b bg-background">
          {/* Radial Chart Card */}
          <div className="py-4">
            <div className="flex items-center gap-4 px-4 border rounded-lg p-4 bg-card">
              <div className="relative flex-shrink-0">
                <RadialBarChart
                  width={150}
                  height={150}
                  cx={75}
                  cy={75}
                  innerRadius="60%"
                  outerRadius="80%"
                  barSize={8}
                  data={chartData}
                  startAngle={180}
                  endAngle={-180}
                >
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={30}
                    max={100}
                    isAnimationActive={false}
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
                    className="cursor-default pointer-events-none"
                  />
                </RadialBarChart>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-2xl font-bold">{likeEstimate}%</div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Likelihood Estimate</h3>
                <p className="text-sm text-muted-foreground">from TailorReach</p>
              </div>
            </div>
          </div>

          {/* Search and Filters without Card */}
          <div className="space-y-4 pb-6 px-4">
            <div className="relative">
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {(searchQuery || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="absolute right-2 top-1.5 h-7 text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                className="rounded-full"
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "sent" ? "default" : "outline"}
                onClick={() => setStatusFilter("sent")}
                className="rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900"
                size="sm"
              >
                Sent
              </Button>
              <Button
                variant={statusFilter === "converting" ? "default" : "outline"}
                onClick={() => setStatusFilter("converting")}
                className="rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 hover:text-amber-900"
                size="sm"
              >
                Converting
              </Button>
              <Button
                variant={statusFilter === "converted" ? "default" : "outline"}
                onClick={() => setStatusFilter("converted")}
                className="rounded-full bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900"
                size="sm"
              >
                Converted
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Activities */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-6 space-y-4">
            {filteredActivities?.length ? (
              <>
                <div className="text-sm text-muted-foreground px-1">
                  Showing {filteredActivities.length} of {customers.length} activities
                </div>
                {filteredActivities.map((activity, index) => (
                  <div 
                    key={index} 
                    className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{activity.customerName}</h4>
                      <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        getStatusStyles(activity.status)
                      }`}>
                        <div className={`h-2 w-2 rounded-full ${
                          activity.status === 'sent' 
                            ? 'bg-gray-500' 
                            : activity.status === 'converting'
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                        }`} />
                        {activity.status}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2">
                      {activity.message.includes('Subject:') ? (
                        <>
                          <div className="font-medium">
                            {activity.message.split('\n\n')[0]}
                          </div>
                          <div className="pt-1">
                            {activity.message
                              .split('\n\n')
                              .slice(1)
                              .join('\n\n')}
                          </div>
                        </>
                      ) : (
                        <div>{activity.message}</div>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{activity.type}</span>
                      <span>
                        {new Date(activity.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No activities found</p>
                {(searchQuery || statusFilter !== "all") && (
                  <p className="text-sm mt-2">Try adjusting your filters</p>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const QuickViewSheet = ({ product }: { product: Product }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">Quick View</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Product Details</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Name</h3>
            <p>{product.name}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Price</h3>
            <p>${product.price}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Description</h3>
            <p className="whitespace-pre-wrap">{product.description}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Keywords</h3>
            <p>{product.keywords}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function ProductsPage() {
  const { user: clerkuser } = useUser()
  const { getToken } = useAuth()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [products, setProducts] = useState<Product[]>([])
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [isNewSheetOpen, setIsNewSheetOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [autoInform, setAutoInform] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  useEffect(() => {
    if (clerkuser) {
      fetchProductsData()
    }
  }, [clerkuser])

  const columns: ColumnDef<Product>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSelectAll}
          aria-label={selectedProducts.length === products.length ? "Deselect all products" : "Select all products"}
        >
          {selectedProducts.length === products.length ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSelectProduct(product.id)}
            aria-label={selectedProducts.includes(product.id) ? "Deselect product" : "Select product"}
          >
            {selectedProducts.includes(product.id) ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </Button>
        )
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => <div>${row.getValue("price")}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string
        return (
          <div className="max-w-[300px] truncate">
            {description}
          </div>
        )
      },
    },
    {
      accessorKey: "keywords",
      header: "Keywords",
      cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue("keywords")}</div>,
    },

    {
      id: "activities",
      header: "Activities",
      cell: ({ row }) => {
        const product = row.original
        return <ActivitySheet 
          customers={product.customers || []} 
          likeEstimate={product.likeestimate || 0}
        />
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/products/new?id=${product.id}`)}
                className="text-blue-600 focus:text-blue-600 focus:bg-blue-50 cursor-pointer"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Messages
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Sheet>
                  <SheetTrigger className="w-full text-left flex items-center text-sm px-2 py-1.5 text-green-600 focus:text-green-600 focus:bg-green-50 cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    Quick View
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Product Details</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Name</h3>
                        <p className="text-sm">{product.name}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Price</h3>
                        <p className="text-sm">${product.price}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Description</h3>
                        <p className="text-sm whitespace-pre-wrap">{product.description}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Keywords</h3>
                        <p className="text-sm">{product.keywords}</p>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openEditSheet(product)}
                className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteProduct(product.id)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: products,
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

  async function fetchProductsData() {
    if (!clerkuser) return

    const token = await getToken({ template: "supabase" })
    if (!token) return

    try {
      const data = await fetchProducts(clerkuser.id, token)
      if (data) {
        setProducts(data)
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

  async function handleDeleteProduct(id: string) {
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
      const { error } = await deleteProduct(id, clerkuser.id, token)
      if (error) {
        throw error
      }
      await fetchProductsData()
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      })
    } catch (error: any) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  function openEditSheet(product: Product) {
    setEditingProduct(product)
    setIsEditSheetOpen(true)
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingProduct || !clerkuser) return

    const token = await getToken({ template: "supabase" })
    if (!token) return

    const formData = new FormData(event.target as HTMLFormElement)
    const updatedProduct = {
      name: formData.get("name") as string,
      price: formData.get("price") as string,
      description: formData.get("description") as string,
      keywords: formData.get("keywords") as string,
      userid: clerkuser.id
    }

    try {
      const { error } = await updateProduct(editingProduct.id, updatedProduct, clerkuser.id, token)
      if (error) throw error
      await fetchProductsData()
      setIsEditSheetOpen(false)
      toast({
        title: "Success",
        description: "Product updated successfully.",
      })
    } catch (error: any) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message || 'Unknown error'}`,
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
    const newProductId = Math.floor(Math.random() * 256).toString()
    const newProduct = {
      id: newProductId,
      name: formData.get("name") as string,
      price: formData.get("price") as string,
      description: formData.get("description") as string,
      keywords: formData.get("keywords") as string,
      userid: clerkuser.id
    }

    try {
      const { error } = await createProduct(clerkuser.id, newProduct, token)
      if (error) throw error
      
      await fetchProductsData()
      setIsNewSheetOpen(false)
      toast({
        title: "Success",
        description: "Product created successfully.",
      })

      if (autoInform) {
        router.push(`/products/new?id=${newProductId}`)
      }
    } catch (error: any) {
      console.error("Error creating product:", error)
      toast({
        title: "Error",
        description: `Failed to create product: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  function handleSelectProduct(productId: string) {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  function handleSelectAll() {
    setSelectedProducts(prev => 
      prev.length === products.length ? [] : products.map(p => p.id)
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Filter products..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Button onClick={() => setIsNewSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Product
          </Button>
          {selectedProducts.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected products?`)) {
                  Promise.all(
                    selectedProducts.map(id => handleDeleteProduct(id))
                  ).then(() => {
                    setSelectedProducts([])
                    toast({
                      title: "Success",
                      description: `${selectedProducts.length} products deleted successfully.`,
                    })
                  }).catch((error) => {
                    toast({
                      title: "Error",
                      description: "Failed to delete some products.",
                      variant: "destructive",
                    })
                  })
                }
              }}
            >
              Delete Selected ({selectedProducts.length})
            </Button>
          )}
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
            <SheetTitle>Edit Product</SheetTitle>
            <SheetDescription>
              Make changes to the product information here.
            </SheetDescription>
          </SheetHeader>
          {editingProduct && (
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingProduct.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  name="price"
                  defaultValue={editingProduct.price}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingProduct.description}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-keywords">Keywords</Label>
                <Input
                  id="edit-keywords"
                  name="keywords"
                  defaultValue={editingProduct.keywords}
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
            <SheetTitle>New Product</SheetTitle>
            <SheetDescription>
              Add a new product by filling out the information below.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleNewSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name</Label>
              <Input id="new-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-price">Price</Label>
              <Input id="new-price" name="price" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-description">Description</Label>
              <Textarea id="new-description" name="description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-keywords">Keywords</Label>
              <Input id="new-keywords" name="keywords" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-inform"
                checked={autoInform}
                onCheckedChange={setAutoInform}
              />
              <Label htmlFor="auto-inform">Auto Inform</Label>
            </div>
            <Button type="submit" className="w-full">
              Create Product
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
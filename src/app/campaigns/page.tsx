'use client'

import { useState, useEffect, FormEvent, useRef, useMemo } from "react"
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
import { MoreHorizontal, Plus, CalendarIcon, Activity, CheckSquare, Square, Eye, Pencil, Trash } from 'lucide-react'
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts'

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
  SheetTrigger,
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
import { Switch } from "@/components/ui/switch"
import { useRouter } from 'next/navigation'
import { Progress } from "@/components/ui/progress"

import { fetchCampaigns, deleteCampaign, updateCampaign, createCampaign, fetchProducts } from "@/app/utils/supabaseRequests"

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

interface Campaign {
  uid: string
  name: string
  description: string
  keywords: string
  products: string
  campaign_date: string
  customers: CustomerActivity[]
  likeestimate: number
}

interface Product {
  id: number
  name: string
  price?: number
  description?: string
  likeestimate?: number
}

const ActivitySheet = ({ customers, likeEstimate }: { 
  customers: CustomerActivity[], 
  likeEstimate: number 
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredActivities = useMemo(() => {
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
            Recent activities for this campaign
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

          {/* Search and Filters */}
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
  const [autoInform, setAutoInform] = useState(false)
  const router = useRouter()
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])

  useEffect(() => {
    if (clerkuser) {
      fetchProductsData().then(() => fetchCampaignsData())
    }
  }, [clerkuser])

  const columns: ColumnDef<Campaign>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSelectAll}
          aria-label={selectedCampaigns.length === campaigns.length ? "Deselect all campaigns" : "Select all campaigns"}
        >
          {selectedCampaigns.length === campaigns.length ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const campaign = row.original
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSelectCampaign(campaign.uid)}
            aria-label={selectedCampaigns.includes(campaign.uid) ? "Deselect campaign" : "Select campaign"}
          >
            {selectedCampaigns.includes(campaign.uid) ? (
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
      id: "activities",
      header: "Activities",
      cell: ({ row }) => {
        const campaign = row.original
        return <ActivitySheet 
          customers={campaign.customers || []} 
          likeEstimate={campaign.likeestimate || 0}
        />
      },
    },
    {
      id: "quickview",
      header: "",
      cell: ({ row }) => {
        const campaign = row.original
        const product = products.find(p => p.id.toString() === campaign.products)
        
        return (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="text-xl">Campaign Details</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="text-base font-medium">{campaign.name}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="text-base font-medium">
                    {new Date(campaign.campaign_date).toLocaleDateString()}
                  </div>
                </div>
                {campaign.description && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="text-base whitespace-pre-wrap">{campaign.description}</div>
                  </div>
                )}
                {product && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Product</div>
                    <div className="rounded-md border p-4 space-y-3">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">${product.price}</div>
                      </div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </div>
                      )}
                      {product.likeestimate !== undefined && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Likelihood Score</span>
                            <span className="font-medium">{product.likeestimate}%</span>
                          </div>
                          <Progress 
                            value={product.likeestimate} 
                            className="h-1.5"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {campaign.keywords && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Keywords</div>
                    <div className="flex flex-wrap gap-2">
                      {campaign.keywords.split(',').map((keyword, index) => (
                        <div 
                          key={index}
                          className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          {keyword.trim()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {campaign.likeestimate !== undefined && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Likelihood Score</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-medium">{campaign.likeestimate}%</span>
                      </div>
                      <Progress 
                        value={campaign.likeestimate} 
                        className="h-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )
      },
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
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => openEditSheet(campaign)}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteCampaign(campaign.uid)}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
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
    const campaignId = crypto.randomUUID()
    const newCampaign = {
      uid: campaignId,
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

      if (autoInform && selectedProduct !== "no_product") {
        const query = new URLSearchParams({
          campaignId: campaignId,
          productId: selectedProduct
        }).toString()
        router.push(`/campaigns/new?${query}`)
      }
    } catch (error: any) {
      console.error("Error creating campaign:", error)
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  function handleSelectCampaign(campaignId: string) {
    setSelectedCampaigns(prev =>
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    )
  }

  function handleSelectAll() {
    setSelectedCampaigns(prev => 
      prev.length === campaigns.length ? [] : campaigns.map(c => c.uid)
    )
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-inform">Auto Inform</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically proceed to customer selection
                </div>
              </div>
              <Switch
                id="auto-inform"
                checked={autoInform}
                onCheckedChange={setAutoInform}
                disabled={selectedProduct === "no_product"}
              />
            </div>
            <Button type="submit" className="w-full">
              Create Campaign
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {selectedCampaigns.length > 0 && (
        <Button 
          variant="destructive" 
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete ${selectedCampaigns.length} selected campaigns?`)) {
              Promise.all(
                selectedCampaigns.map(id => handleDeleteCampaign(id))
              ).then(() => {
                setSelectedCampaigns([])
                toast({
                  title: "Success",
                  description: `${selectedCampaigns.length} campaigns deleted successfully.`,
                })
              }).catch((error) => {
                toast({
                  title: "Error",
                  description: "Failed to delete some campaigns.",
                  variant: "destructive",
                })
              })
            }
          }}
        >
          Delete Selected ({selectedCampaigns.length})
        </Button>
      )}
    </div>
  )
}


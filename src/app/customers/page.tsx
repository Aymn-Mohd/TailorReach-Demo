'use client'

import React, { useState, useEffect, FormEvent } from "react"
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
import { Activity, MoreHorizontal, Plus, CheckSquare, Square } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { fetchCustomers, deleteCustomer, updateCustomer, createCustomer } from "../utils/supabaseRequests"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  likes: string
  dislikes: string
  preferences: string
  activity: Activity[]
  userid: string
}

interface Activity {
  id: number
  type: string
  productId: string
  productName: string
  message: string
  status: 'sent' | 'converting' | 'converted'
  date: string
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

const ActivitySheet = ({ activities }: { activities: CustomerActivity[] }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredActivities = React.useMemo(() => {
    return activities?.filter(activity => {
      if (!debouncedSearchQuery && statusFilter === "all" && typeFilter === "all") return true

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
      
      const matchesStatus = statusFilter === "all" || activity.status === statusFilter
      const matchesType = typeFilter === "all" || activity.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [activities, debouncedSearchQuery, statusFilter, typeFilter])

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setTypeFilter("all")
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-gray-100 text-gray-800'
      case 'converting':
        return 'bg-amber-100 text-amber-800'
      case 'converted':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={!activities?.length}
          className={activities?.length ? "text-orange-500 hover:text-orange-600" : "opacity-50 cursor-not-allowed"}
        >
          <Activity className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Activities ({activities?.length})</SheetTitle>
          <SheetDescription>
            Recent activities for this customer
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div className="space-y-4">
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
              {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
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
                All Status
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

            <div className="flex flex-wrap gap-2">
              <Button
                variant={typeFilter === "all" ? "default" : "outline"}
                onClick={() => setTypeFilter("all")}
                className="rounded-full"
                size="sm"
              >
                All Types
              </Button>
              <Button
                variant={typeFilter === "product" ? "default" : "outline"}
                onClick={() => setTypeFilter("product")}
                className="rounded-full"
                size="sm"
              >
                Products
              </Button>
              <Button
                variant={typeFilter === "campaign" ? "default" : "outline"}
                onClick={() => setTypeFilter("campaign")}
                className="rounded-full"
                size="sm"
              >
                Campaigns
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredActivities?.length ? (
              <>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredActivities.length} of {activities.length} activities
                </div>
                {filteredActivities.map((activity, index) => (
                  <div 
                    key={index} 
                    className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{activity.productName}</h4>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        getStatusStyles(activity.status)
                      }`}>
                        {activity.status}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activity.message}
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
                {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
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

export default function CustomersPage() {
  const { user: clerkuser } = useUser()
  const { getToken } = useAuth()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [isNewSheetOpen, setIsNewSheetOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false)
  const [selectedCustomerActivities, setSelectedCustomerActivities] = useState<Activity[]>([])
  const { toast } = useToast()
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])

  useEffect(() => {
    if (clerkuser) {
      fetchCustomersData()
    }
  }, [clerkuser])

  const columns: ColumnDef<Customer>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSelectAll}
          aria-label={selectedCustomers.length === customers.length ? "Deselect all customers" : "Select all customers"}
        >
          {selectedCustomers.length === customers.length ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const customer = row.original
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSelectCustomer(customer.id)}
            aria-label={selectedCustomers.includes(customer.id) ? "Deselect customer" : "Select customer"}
          >
            {selectedCustomers.includes(customer.id) ? (
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
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "likes",
      header: "Likes",
    },
    {
      accessorKey: "dislikes",
      header: "Dislikes",
    },
    {
      accessorKey: "preferences",
      header: "Preferences",
      cell: ({ row }) => <div className="capitalize">{row.getValue("preferences")}</div>,
    },

    {
      id: "activities",
      header: "Activities",
      cell: ({ row }) => {
        const customer = row.original
        const transformedActivities: CustomerActivity[] = (customer.activity || []).map(activity => ({
          ...activity,
          customerId: customer.id,
          customerName: customer.name
        }))
        return <ActivitySheet activities={transformedActivities} />
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const customer = row.original

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
              <DropdownMenuItem onClick={() => openEditSheet(customer)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteCustomer(customer.id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: customers,
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

  async function fetchCustomersData() {
    if (!clerkuser) return

    const token = await getToken({ template: "supabase" })
    if (!token) return

    try {
      const data = await fetchCustomers(clerkuser.id, token)
      if (data) {
        setCustomers(data)
      } else {
        throw new Error("Failed to fetch customers")
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch customers. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteCustomer(id: string) {
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
      const { error } = await deleteCustomer(id, clerkuser.id, token)
      if (error) {
        throw error
      }
      await fetchCustomersData()
      toast({
        title: "Success",
        description: "Customer deleted successfully.",
      })
    } catch (error: any) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: `Failed to delete customer: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  function openEditSheet(customer: Customer) {
    setEditingCustomer(customer)
    setIsEditSheetOpen(true)
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingCustomer || !clerkuser) return

    const token = await getToken({ template: "supabase" })
    if (!token) return

    const formData = new FormData(event.target as HTMLFormElement)
    const updatedCustomer = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      likes: formData.get("likes") as string,
      dislikes: formData.get("dislikes") as string,
      preferences: formData.get("preferences") as string,
      userid: clerkuser.id
    }

    try {
      const { error } = await updateCustomer(editingCustomer.id, updatedCustomer, clerkuser.id, token)
      if (error) throw error
      await fetchCustomersData()
      setIsEditSheetOpen(false)
      toast({
        title: "Success",
        description: "Customer updated successfully.",
      })
    } catch (error: any) {
      console.error("Error updating customer:", error)
      toast({
        title: "Error",
        description: `Failed to update customer: ${error.message || 'Unknown error'}`,
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
    const newCustomer = {
      id: Math.random().toString(36).substring(7),
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      likes: formData.get("likes") as string,
      dislikes: formData.get("dislikes") as string,
      preferences: formData.get("preferences") as string,
      userid: clerkuser.id
    }

    try {
      const { error } = await createCustomer(clerkuser.id, newCustomer, token)
      if (error) throw error
      await fetchCustomersData()
      setIsNewSheetOpen(false)
      toast({
        title: "Success",
        description: "Customer created successfully.",
      })
    } catch (error: any) {
      console.error("Error creating customer:", error)
      toast({
        title: "Error",
        description: `Failed to create customer: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  const handleActivityClick = (customer: Customer) => {
    setSelectedCustomerActivities(customer.activity || [])
    setIsActivitySheetOpen(true)
  }

  function handleSelectCustomer(customerId: string) {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  function handleSelectAll() {
    setSelectedCustomers(prev => 
      prev.length === customers.length ? [] : customers.map(c => c.id)
    )
  }

  return (
    <div className="container mx-auto py-2">
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
            <Plus className="mr-2 h-4 w-4" /> New Customer
          </Button>
          {selectedCustomers.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedCustomers.length} selected customers?`)) {
                  Promise.all(
                    selectedCustomers.map(id => handleDeleteCustomer(id))
                  ).then(() => {
                    setSelectedCustomers([])
                    toast({
                      title: "Success",
                      description: `${selectedCustomers.length} customers deleted successfully.`,
                    })
                  }).catch((error) => {
                    toast({
                      title: "Error",
                      description: "Failed to delete some customers.",
                      variant: "destructive",
                    })
                  })
                }
              }}
            >
              Delete Selected ({selectedCustomers.length})
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
            <SheetTitle>Edit Customer</SheetTitle>
            <SheetDescription>
              Make changes to the customer information here.
            </SheetDescription>
          </SheetHeader>
          {editingCustomer && (
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingCustomer.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={editingCustomer.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  defaultValue={editingCustomer.phone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-likes">Likes</Label>
                <Textarea
                  id="edit-likes"
                  name="likes"
                  defaultValue={editingCustomer.likes}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dislikes">Dislikes</Label>
                <Textarea
                  id="edit-dislikes"
                  name="
dislikes"
                  defaultValue={editingCustomer.dislikes}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-preferences">Preferences</Label>
                <Select name="preferences" defaultValue={editingCustomer.preferences}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="mail">Mail</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
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
            <SheetTitle>New Customer</SheetTitle>
            <SheetDescription>
              Add a new customer by filling out the information below.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleNewSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name</Label>
              <Input id="new-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input id="new-email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-phone">Phone</Label>
              <Input id="new-phone" name="phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-likes">Likes</Label>
              <Textarea id="new-likes" name="likes" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-dislikes">Dislikes</Label>
              <Textarea id="new-dislikes" name="dislikes" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-preferences">Preferences</Label>
              <Select name="preferences">
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="mail">Mail</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Create Customer
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={isActivitySheetOpen} onOpenChange={setIsActivitySheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
          <SheetHeader>
            <SheetTitle>Customer Activity</SheetTitle>
            <SheetDescription>
              View all activities and interactions with this customer.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4 pr-6">
              {selectedCustomerActivities && selectedCustomerActivities.length > 0 ? (
                selectedCustomerActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-sm font-medium">{activity.productName}</span>
                        <p className="text-xs text-muted-foreground capitalize">{activity.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "flex items-center gap-2 text-xs px-2 py-1 rounded-full",
                          {
                            'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100': activity.status === 'converted',
                            'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100': activity.status === 'converting',
                            'bg-muted text-muted-foreground': activity.status === 'sent'
                          }
                        )}>
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            {
                              'bg-green-500': activity.status === 'converted',
                              'bg-yellow-500': activity.status === 'converting',
                              'bg-gray-500': activity.status === 'sent'
                            }
                          )} />
                          {activity.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No activities found for this customer.
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}


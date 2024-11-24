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
import { Activity, MoreHorizontal, Plus } from 'lucide-react'

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

  useEffect(() => {
    if (clerkuser) {
      fetchCustomersData()
    }
  }, [clerkuser])

  const columns: ColumnDef<Customer>[] = [
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
      id: "activity",
      header: "Activity",
      cell: ({ row }) => {
        const customer = row.original
        
        return (
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={() => handleActivityClick(customer)}
            disabled={!customer.activity?.length}
          >
            <span className="sr-only">View activity</span>
            <Activity className={cn(
              "h-4 w-4",
              customer.activity?.length ? "text-primary" : "text-muted-foreground"
            )} />
          </Button>
        )
      }
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


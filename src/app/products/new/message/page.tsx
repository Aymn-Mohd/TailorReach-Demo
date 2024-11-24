"use client"

import * as React from "react"
import { useSearchParams, useRouter } from 'next/navigation'
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
import { MoreHorizontal, Copy, Send } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createProduct } from "@/app/utils/supabaseRequests"

interface Customer {
  user_id: string
  name: string
  email: string
  phone: string
  likes: string
  dislikes: string
  preferences: string
  message?: {
    subject?: string
    content: string
  } | string
}

interface Product {
  id: string
  name: string
  price: string
  description: string
  keywords: string
  userid: string
}

export default function CustomerMessagesPage() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [product, setProduct] = React.useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null)
  const [editMessage, setEditMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const { userId, getToken } = useAuth()
  const router = useRouter()

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "likes",
      header: "Likes",
      cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue("likes")}</div>,
    },
    {
      accessorKey: "message",
      header: "Personalized Message",
      cell: ({ row }) => {
        const message = row.getValue("message") as Customer['message'];
        if (!message) return <div>No message generated</div>;
        
        return (
          <div className="max-w-[400px]">
            {typeof message === 'string' ? (
              <div>{message}</div>
            ) : (
              <>
                {message.subject && <div className="font-bold">{message.subject}</div>}
                <div>{message.content}</div>
              </>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
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
              <DropdownMenuItem onClick={() => generateMessage(customer)}>
                Generate Message
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                Edit Message
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => sendMessage(customer)}>
                Send Message
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => copyMessageToClipboard(customer.message)}>
                Copy Message
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

  React.useEffect(() => {
    const customersParam = searchParams.get('customers')
    const productParam = searchParams.get('product')

    if (customersParam && productParam) {
      const parsedCustomers = JSON.parse(customersParam)
      const parsedProduct = JSON.parse(productParam)
      setCustomers(parsedCustomers)
      setProduct(parsedProduct)
      generateAllMessages(parsedCustomers, parsedProduct)
    } else {
      toast({
        title: "Error",
        description: "Failed to load customer and product data",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }, [searchParams, toast])

  async function generateAllMessages(customers: Customer[], product: Product) {
    setIsLoading(true)
    const updatedCustomers = await Promise.all(
      customers.map(async (customer) => {
        if (!customer.message) {
          const message = await generateMessageForCustomer(customer, product)
          return { ...customer, message }
        }
        return customer
      })
    )
    setCustomers(updatedCustomers)
    setIsLoading(false)
  }

  async function generateMessageForCustomer(customer: Customer, product: Product): Promise<Customer['message']> {
    try {
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer, product }),
      })

      if (!response.ok) throw new Error('Failed to generate message')

      const data = await response.json()
      return data.message
    } catch (error) {
      console.error('Error generating message:', error)
      return "Failed to generate message"
    }
  }

  async function generateMessage(customer: Customer) {
    if (!product) {
      toast({
        title: "Error",
        description: "No product available",
        variant: "destructive",
      })
      return
    }

    try {
      const message = await generateMessageForCustomer(customer, product)
      
      setCustomers(prev =>
        prev.map(c =>
          c.user_id === customer.user_id
            ? { ...c, message }
            : c
        )
      )

      toast({
        title: "Success",
        description: "Message generated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate message",
        variant: "destructive",
      })
    }
  }

  function openEditDialog(customer: Customer) {
    setEditingCustomer(customer)
    setEditMessage(typeof customer.message === 'string' ? customer.message : 
      (customer.message ? `${customer.message.subject || ''}\n\n${customer.message.content}` : ''))
    setIsEditDialogOpen(true)
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!editingCustomer) return

    let updatedMessage: Customer['message'];
    if (editingCustomer.preferences === 'email') {
      const [subject, ...contentArr] = editMessage.split('\n\n');
      updatedMessage = {
        subject,
        content: contentArr.join('\n\n')
      };
    } else {
      updatedMessage = editMessage;
    }

    const updatedCustomer = {
      ...editingCustomer,
      message: updatedMessage,
    }

    setCustomers(prev =>
      prev.map(c =>
        c.user_id === editingCustomer.user_id
          ? updatedCustomer
          : c
      )
    )

    setIsEditDialogOpen(false)
    toast({
      title: "Success",
      description: "Message updated successfully",
    })
  }

  async function sendMessage(customer: Customer) {
    if (!customer.message) {
      toast({
        title: "Error",
        description: "No message to send. Please generate or edit a message first.",
        variant: "destructive",
      })
      return
    }

    try {
      // Here you would typically call an API to send the message
      // For this example, we'll just simulate sending
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Success",
        description: `Message sent to ${customer.name}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  async function sendAllMessages() {
    setIsSaving(true)
    try {
      for (const customer of customers) {
        if (customer.message) {
          await sendMessage(customer)
        }
      }

   
          router.push('/products')
       
    } catch (error) {
      console.error('Error in sendAllMessages:', error)
      toast({
        title: "Error",
        description: "An error occurred while sending messages or adding product",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  function copyMessageToClipboard(message: Customer['message']) {
    if (!message) {
      toast({
        title: "Error",
        description: "No message to copy",
        variant: "destructive",
      })
      return
    }

    let textToCopy = typeof message === 'string' ? message : 
      (message.subject ? `Subject: ${message.subject}\n\n${message.content}` : message.content);
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      })
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      })
    });
  }

  if (isLoading || isSaving) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold mb-2">
            {isLoading ? "Loading..." : "Sending messages and saving product..."}
          </h2>
          <p className="text-gray-600">
            {isLoading ? "Please wait while we prepare your data." : "This may take a moment. Please don't close the page."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      
      <div className="flex items-center justify-between py-4">
      
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button onClick={sendAllMessages} className="ml-4" disabled={isLoading || isSaving}>
          <Send className="mr-2 h-4 w-4" /> {isLoading || isSaving ? "Processing..." : "Send All Messages"}
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
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

      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent className="sm:max-w-[625px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Message</AlertDialogTitle>
            <AlertDialogDescription>
              Make changes to the personalized message below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Textarea
                  id="message"
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="h-[300px] resize-none"
                  placeholder="Enter the personalized message here..."
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction type="submit">Save changes</AlertDialogAction>
              <Button onClick={() => {
                if (editingCustomer) {
                  sendMessage({...editingCustomer, message: editMessage})
                  setIsEditDialogOpen(false)
                }
              }}>
                Send Message
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckSquare, Square } from 'lucide-react'
import { useUser, useAuth } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { useToast } from "@/hooks/use-toast"
import { fetchProducts, fetchCustomers } from '@/app/utils/supabaseRequests'

interface Customer {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  likes: string
  dislikes: string
  preferences: string
  activities: string[]  
}

interface Product {
  id: number
  name: string
  price: string
  description: string
  keywords: string
  category: string
}

interface AnalysisResult {
  customerId: string
  customerName: string
  likelihood: number
  reason: string
}

export default function Component() {
  const [product, setProduct] = useState<Product | null>(null)
  const [customers, setCustomers] = useState<(Customer & AnalysisResult)[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStep, setLoadingStep] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const { getToken } = useAuth()

  useEffect(() => {
    const productId = searchParams.get('id')
    if (productId && user) {
      fetchProductAndCustomers(parseInt(productId))
    }
  }, [searchParams, user])

  async function fetchProductAndCustomers(id: number) {
    setIsLoading(true)
    setLoadingStep("Fetching product data...")
    try {
      if (!user) throw new Error("No user found")
      const token = await getToken({ template: "supabase" })
      if (!token) throw new Error("No token found")

      const [productData, customersData] = await Promise.all([
        fetchProduct(id, user.id, token),
        fetchCustomers(user.id, token)
      ])

      if (!productData) throw new Error("Product not found")
      setProduct(productData)

      if (!customersData || customersData.length === 0) {
        setCustomers([])
        throw new Error("No customers found")
      }

      setLoadingStep("Analyzing customer interest...")
      const analysisResults = await analyzeCustomerInterest(productData, user.id, token)
      const analyzedCustomers = customersData.map(customer => {
        const analysis = analysisResults.find(result => result.customerId === customer.id)
        return {
          ...customer,
          likelihood: analysis?.likelihood || 0,
          reason: analysis?.reason || 'Analysis not available',
        }
      })
      setCustomers(analyzedCustomers)

      // Auto-select customers with green and yellow likelihoods
      const autoSelectedCustomers = analyzedCustomers
        .filter(customer => customer.likelihood >= 50)
        .map(customer => customer.id)
      setSelectedCustomers(autoSelectedCustomers)

    } catch (error) {
      console.error('Error fetching product and analyzing customers:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoadingStep(null)
      setIsLoading(false)
    }
  }

  async function fetchProduct(id: number, userId: string, token: string): Promise<Product | null> {
    const products = await fetchProducts(userId, token)
    return products ? products.find(p => p.id === id) || null : null
  }

  async function analyzeCustomerInterest(product: Product, userId: string, token: string): Promise<AnalysisResult[]> {
    const response = await fetch('/api/analyze-customer-interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, userId, supabaseToken: token }),
    })

    if (!response.ok) {
      throw new Error('Failed to analyze customer interest')
    }

    return response.json()
  }

  function getLikelihoodColor(likelihood: number) {
    if (likelihood >= 75) return 'bg-green-500'
    if (likelihood >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  function handleCheckboxChange(customerId: string) {
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

  function handleContinue() {
    if (selectedCustomers.length === 0) {
      toast({
        title: "No customers selected",
        description: "Please select at least one customer to continue.",
        variant: "destructive",
      })
      return
    }

    const selectedCustomerData = customers.filter(c => 
      selectedCustomers.includes(c.id)
    )

    const query = new URLSearchParams({
      customers: JSON.stringify(selectedCustomerData),
      product: JSON.stringify(product)
    }).toString()
    router.push(`/products/new/message?${query}`)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-xl font-semibold">{loadingStep || 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-5">
      <h2 className="text-3xl font-bold mb-6">Customer Analysis for New Product</h2>

      <div className="space-y-6">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px] p-4">
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
                </TableHead>
                <TableHead className="p-4">Name</TableHead>
                <TableHead className="p-4">Email</TableHead>
                <TableHead className="p-4">Likes</TableHead>
                <TableHead className="p-4 w-[100px]">Likelihood</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/50">
                  <TableCell className="p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCheckboxChange(customer.id)}
                      aria-label={selectedCustomers.includes(customer.id) ? "Deselect customer" : "Select customer"}
                    >
                      {selectedCustomers.includes(customer.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="p-4 font-medium">{customer.name}</TableCell>
                  <TableCell className="p-4">{customer.email}</TableCell>
                  <TableCell className="p-4">{customer.likes || 'None'}</TableCell>
                  <TableCell className="p-4">
                    <HoverCard>
                      <HoverCardTrigger>
                        <div
                          className={`w-6 h-6 rounded-sm ${getLikelihoodColor(customer.likelihood)}`}
                          aria-label={`Likelihood: ${customer.likelihood.toFixed(0)}%`}
                        />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <p className="font-semibold">
                            Likelihood: {customer.likelihood.toFixed(0)}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {customer.reason}
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleContinue} 
            size="lg" 
            disabled={selectedCustomers.length === 0}
          >
            Continue with Selected Customers
          </Button>
        </div>
      </div>
    </div>
  )
}


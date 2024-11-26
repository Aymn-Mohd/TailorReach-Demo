'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { MoreHorizontal, Plus, Users, Package, Megaphone, ArrowRight, Eye, Send, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  likes?: string
  dislikes?: string
  preferences?: string
  activity?: string[]
}

interface Product {
  id: number
  name: string
  price: string
  description?: string
  keywords?: string
  likeestimate?: number
}

interface Campaign {
  uid: string
  name: string
  campaign_date: string
  description?: string
  keywords?: string
  products?: string
  likeestimate?: number
}

export default function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Add new state for statistics
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalProducts: 0,
    activeCampaigns: 0,
    recentConversions: 0,
    customerGrowth: 0
  })

  useEffect(() => {
    fetchCustomers()
    fetchProducts()
    fetchCampaigns()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [customers, products, campaigns])

  async function fetchCustomers() {
    const { data, error } = await supabase
      .from('customers-' + user?.id)
      .select('*')
    if (error) {
      console.error('Error fetching customers:', error)
      toast({
        title: "Error",
        description: "Failed to fetch customers. Please try again.",
        variant: "destructive",
      })
    } else {
      setCustomers(data || [])
    }
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products-' + user?.id)
      .select('*')
      .limit(5)
    if (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Error",
        description: "Failed to fetch products. Please try again.",
        variant: "destructive",
      })
    } else {
      setProducts(data || [])
    }
  }

  async function fetchCampaigns() {
    const { data, error } = await supabase
      .from('campaigns-' + user?.id)
      .select('*')
      .limit(5)
    if (error) {
      console.error('Error fetching campaigns:', error)
      toast({
        title: "Error",
        description: "Failed to fetch campaigns. Please try again.",
        variant: "destructive",
      })
    } else {
      setCampaigns(data || [])
    }
  }

  // Add function to calculate statistics
  async function calculateStats() {
    const customerGrowth = ((customers.length - 10) / 10) * 100
    const recentConversions = campaigns.filter(c => 
      new Date(c.campaign_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length

    setStats({
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.activity && c.activity.length > 0).length,
      totalProducts: products.length,
      activeCampaigns: campaigns.length,
      recentConversions,
      customerGrowth
    })
  }

  function showDetails(item: any, type: 'customer' | 'product' | 'campaign') {
    setSelectedItem({ ...item, type })
    setIsDetailsOpen(true)
  }
  const { isSignedIn, user, isLoaded } = useUser()

  const getBestProduct = () => {
    return products.reduce((best, current) => {
      return (current.likeestimate ?? 0) > (best?.likeestimate ?? 0) ? current : best
    }, products[0])
  }

  const getBestCampaign = () => {
    return campaigns.reduce((best, current) => {
      return (current.likeestimate ?? 0) > (best?.likeestimate ?? 0) ? current : best
    }, campaigns[0])
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.fullName} 👋🏼</h1>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <div className="text-xs text-muted-foreground">
                {stats.customerGrowth > 0 ? '+' : ''}{stats.customerGrowth.toFixed(1)}% from last month
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, stats.customerGrowth))} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <div className="text-xs text-muted-foreground">
                {products.filter(p => (p.likeestimate ?? 0) > 75).length} high-potential products
              </div>
              <Progress 
                value={products.filter(p => (p.likeestimate ?? 0) > 75).length / stats.totalProducts * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
              <div className="text-xs text-muted-foreground">
                {stats.recentConversions} conversions this week
              </div>
              <Progress 
                value={stats.recentConversions / stats.activeCampaigns * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Best Performers Carousel */}
        <div className="mb-8">
          <Carousel className="w-full">
            <CarouselContent>
              <CarouselItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Best Performing Campaign</span>
                      <Megaphone className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getBestCampaign() ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold">{getBestCampaign()?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(getBestCampaign()?.campaign_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Likelihood Score</span>
                            <span className="font-medium">{getBestCampaign()?.likeestimate}%</span>
                          </div>
                          <Progress 
                            value={getBestCampaign()?.likeestimate} 
                            className="h-2"
                          />
                        </div>
                        {getBestCampaign()?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {getBestCampaign()?.description}
                          </p>
                        )}
                        {getBestCampaign()?.products && (
                          <div className="rounded-md border p-3">
                            <div className="text-sm text-muted-foreground mb-2">Associated Product</div>
                            <div className="font-medium">
                              {products.find(p => p.id.toString() === getBestCampaign()?.products)?.name}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No campaigns available</p>
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
              <CarouselItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Best Performing Product</span>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getBestProduct() ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold">{getBestProduct()?.name}</h3>
                          <p className="text-sm text-muted-foreground">${getBestProduct()?.price}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Likelihood Score</span>
                            <span className="font-medium">{getBestProduct()?.likeestimate}%</span>
                          </div>
                          <Progress 
                            value={getBestProduct()?.likeestimate} 
                            className="h-2"
                          />
                        </div>
                        {getBestProduct()?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {getBestProduct()?.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No products available</p>
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="customers" className="mt-6">
          <TabsList>
            <TabsTrigger value="customers">Recent Customers</TabsTrigger>
            <TabsTrigger value="products">Recent Products</TabsTrigger>
            <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          </TabsList>
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Recent Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.slice(0, 5).map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => showDetails(customer, 'customer')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/customers/${customer.id}`)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/customers">
                    View All Customers <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Recent Products</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => showDetails(product, 'product')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/products">
                    View All Products <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.uid}>
                        <TableCell>{campaign.name}</TableCell>
                        <TableCell>{new Date(campaign.campaign_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => showDetails(campaign, 'campaign')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/campaigns">
                    View All Campaigns <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick View Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.type === 'customer' && 'Customer Details'}
              {selectedItem?.type === 'product' && 'Product Details'}
              {selectedItem?.type === 'campaign' && 'Campaign Details'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedItem?.type === 'customer' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <div id="name" className="col-span-3">{selectedItem.name}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <div id="email" className="col-span-3">{selectedItem.email}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone</Label>
                  <div id="phone" className="col-span-3">{selectedItem.phone}</div>
                </div>
                {selectedItem.preferences && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="preferences" className="text-right">Preferences</Label>
                    <div id="preferences" className="col-span-3">{selectedItem.preferences}</div>
                  </div>
                )}
              </>
            )}
            {selectedItem?.type === 'product' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <div id="name" className="col-span-3">{selectedItem.name}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Price</Label>
                  <div id="price" className="col-span-3">${selectedItem.price}</div>
                </div>
                {selectedItem.description && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <div id="description" className="col-span-3">{selectedItem.description}</div>
                  </div>
                )}
                {selectedItem.keywords && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="keywords" className="text-right">Keywords</Label>
                    <div id="keywords" className="col-span-3">{selectedItem.keywords}</div>
                  </div>
                )}
              </>
            )}
            {selectedItem?.type === 'campaign' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <div id="name" className="col-span-3">{selectedItem.name}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <div id="date" className="col-span-3">
                    {new Date(selectedItem.campaign_date).toLocaleDateString()}
                  </div>
                </div>
                {selectedItem.description && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <div id="description" className="col-span-3">{selectedItem.description}</div>
                  </div>
                )}
                {selectedItem.products && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="products" className="text-right">Products</Label>
                    <div id="products" className="col-span-3">{selectedItem.products}</div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Products | TailorReach Demo",
  description: "Manage your customers",
}

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto py-1">
      <h2 className="text-3xl font-bold mb-2">Products</h2>
      {children}
    </div>
  )
}

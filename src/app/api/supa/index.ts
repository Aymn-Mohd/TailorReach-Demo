import { auth } from "@clerk/nextjs/server"

const { userId }: { userId: string | null } = await auth()
const products = "products" + userId
const customers = "customers" + userId
const campaigns = "campaigns" + userId



export { products, customers,campaigns}

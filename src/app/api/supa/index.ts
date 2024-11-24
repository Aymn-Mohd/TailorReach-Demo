import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { env } from "process"

const { userId }: { userId: string | null } = await auth()
const products = "products" + userId
const customers = "customers" + userId
const campaigns = "campaigns" + userId



export { products, customers,campaigns}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseClient = (supabaseToken: string) => 
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
  })

// Customer functions
export const fetchCustomers = async (userid: string, supabaseToken: string) => {
  const supabase = supabaseClient(supabaseToken)
  const { data, error } = await supabase
    .from('customers-'+userid)
    .select('*')
    .eq('userid', userid)
  
  if (error) {
    console.error("Error fetching customers:", error)
    return null
  }
  
  return data
}

export const deleteCustomer = async (id: string, userid: string, supabaseToken: string) => {
  const supabase = supabaseClient(supabaseToken)
  const { error } = await supabase
    .from("customers-"+userid)
    .delete()
    .eq("id", id)
    .eq("userid", userid)
  return { error }
}

export const updateCustomer = async (id: string, updatedCustomer: any, userid: string, supabaseToken: string) => {
  const supabase = supabaseClient(supabaseToken)
  const { data, error } = await supabase
    .from("customers-" + userid)
    .update(updatedCustomer)
    .eq("id", id)
    .eq("userid", userid)
  if (error) {
    console.error("Error updating customer:", error)
  }
  return { data, error }
}

export const createCustomer = async (userid:any ,newCustomer: any, supabaseToken: string) => {
  const supabase = supabaseClient(supabaseToken)
  const { data, error } = await supabase
    .from("customers-" + userid)
    .insert([newCustomer])
  if (error) {
    console.error("Error creating customer:", error)
  }
  return { data, error }
}

// Add this new function to create customer activities
export const createCustomerActivity = async (
  userid: string,
  customerId: string,
  activity: {
    type: string
    productId: string
    productName: string
    message: string
    status: 'sent' | 'converting' | 'converted'
    date: string
  },
  supabaseToken: string
) => {
  const supabase = supabaseClient(supabaseToken)
  
  // First get the current customer
  const { data: customer, error: fetchError } = await supabase
    .from('customers-' + userid)
    .select('activity')
    .eq('id', customerId)
    .eq('userid', userid)
    .single()

  if (fetchError) {
    console.error("Error fetching customer:", fetchError)
    throw fetchError
  }

  // Create new activity with unique id
  const newActivity = {
    id: Date.now(),  // Use timestamp as unique id
    ...activity
  }

  // Append new activity to existing activities array
  const updatedActivities = customer?.activity 
    ? [...customer.activity, newActivity]
    : [newActivity]

  // Update the customer with new activities
  const { error: updateError } = await supabase
    .from('customers-' + userid)
    .update({ activity: updatedActivities })
    .eq('id', customerId,).eq('userid', userid)

  if (updateError) {
    console.error("Error updating customer activities:", updateError)
    throw updateError
  }

  return newActivity
}

// Campaign functions
export const fetchCampaigns = async (userid: string, supabaseToken: string) => {
  const supabase = supabaseClient(supabaseToken)
  console.log("userid", userid)
  const { data, error } = await supabase
    .from('campaigns-'+userid)
    .select('*')
    .eq('userid', userid)
  if (error) {
    console.error("Error fetching campaigns:", error)
    return null
  }
  return data
}

export const deleteCampaign = async (uid: string, userid: string, supabaseToken: string) => {
  const supabase = supabaseClient(supabaseToken)
  const { error } = await supabase
    .from("campaigns-"+userid)
    .delete()
    .eq("uid", uid)
    .eq("userid", userid)
  return { error }
}

export const updateCampaign = async (uid: string, updatedCampaign: any, userid: string, supabaseToken: string) => {
  const supabase = supabaseClient(supabaseToken)
  const { data, error } = await supabase
    .from("campaigns-"+userid)
    .update(updatedCampaign)
    .eq("uid", uid)
    .eq("userid", userid)
  if (error) {
    console.error("Error updating campaign:", error)
  }
  return { data, error }
}

export const createCampaign = async (userid:any,newCampaign: any, supabaseToken: string) => {
  const supabase = supabaseClient(supabaseToken)
  const { data, error } = await supabase
    .from("campaigns-"+userid)
    .insert([newCampaign])
  if (error) {
    console.error("Error creating campaign:", error)
  }
  return { data, error }
}

// Product functions
export const fetchProducts = async (userid: string, supabaseToken: string) => {
  const supabase = supabaseClient(supabaseToken)
  
  const { data, error } = await supabase
    .from('products-'+userid)
    .select('*')
    .eq('userid', userid)
  if (error) {
    console.error("Error fetching products:", error)
    return null
  }
  return data
}

export const deleteProduct = async (id: string, userid: string, supabaseToken: string) => {
  const supabase = supabaseClient(supabaseToken)
  const { error } = await supabase
    .from("products-"+userid)
    .delete()
    .eq("id", id)
    .eq("userid", userid)
  return { error }
}

export const updateProduct = async (id: string, updatedProduct: any, userid: string, supabaseToken: string) => {
  const supabase = supabaseClient(supabaseToken)
  const { data, error } = await supabase
    .from("products-"+userid)
    .update(updatedProduct)
    .eq("id", id)
    .eq("userid", userid)
  if (error) {
    console.error("Error updating product:", error)
  }
  return { data, error }
}

export const createProduct = async (userid: any, newProduct: any, supabaseToken: string) => {
  const supabase = supabaseClient(supabaseToken)
  const { data, error } = await supabase
    .from("products-"+userid)
    .insert([newProduct])
  if (error) {
    console.error("Error creating product:", error)
  }
  return { data, error }
}

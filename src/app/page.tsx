'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useUser } from '@clerk/nextjs'
import OnboardingDialog from '@/components/onboarding-dialog'
import Dashboard from '@/components/dashboard'
import { useOnboarding } from '@/hooks/useOnboarding'
import { useToast } from '@/hooks/use-toast'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const { isComplete: onboardingComplete } = useOnboarding()
  const { toast } = useToast()

  useEffect(() => {
    async function checkUserInDatabase() {
      if (isLoaded && isSignedIn && user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('userid')
            .eq('userid', user.id)
            .single()

          if (error) {
            if (error.code === 'PGRST116') {
              // No matching row found, user needs onboarding
              setShowOnboarding(true)
            } else {
              // Other database errors
              throw error
            }
          } else {
            // User found in database
            setShowOnboarding(false)
          }
        } catch (error) {
          console.error('Error checking user:', error)
          toast({
            title: "Error",
            description: "Failed to check user status. Please try again later.",
            variant: "destructive",
          })
          // Set showOnboarding to false to prevent infinite loop of errors
          setShowOnboarding(false)
        } finally {
          setIsChecking(false)
        }
      } else if (isLoaded && !isSignedIn) {
        // User is not signed in
        setIsChecking(false)
      }
    }

    checkUserInDatabase()
  }, [isLoaded, isSignedIn, user, toast])

  useEffect(() => {
    if (onboardingComplete) {
      setShowOnboarding(false)
    }
  }, [onboardingComplete])

  if (!isLoaded || isChecking) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <div>Please sign in to access this page.</div>
  }

  return (
    <>
      {showOnboarding ? (
        <OnboardingDialog />
      ) : (
        <Dashboard />
      )}
    </>
  )
}
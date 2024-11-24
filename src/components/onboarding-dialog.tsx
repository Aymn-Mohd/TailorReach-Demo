'use client'

import { useState } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useChat } from 'ai/react'
import { Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'

export default function OnboardingDialog() {
  const [isOpen, setIsOpen] = useState(true)
  const { user } = useUser()
  const name = user?.fullName || ''
  const [profession, setProfession] = useState('')
  const [step, setStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'system',
        content: `You are THE CUSTOMER. The user's profession is: ${profession}. Engage in brief conversations as if you are the customer trying to buy a product related to their profession. Inquire about the product, ask for a demo, and ask about the price.`
      },
    ],
  })

  const handleProfessionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
    setMessages([
      {
        id: 'profession',
        role: 'system',
        content: `You are THE CUSTOMER. The user's name is ${name} and their profession is: ${profession}. Engage in brief conversations as if you are the customer trying to buy a product related to their profession. Inquire about the product, ask for a demo, and ask about the price.`
      }
    ])
  }

  const handleChatComplete = async () => {
    try {
      setIsSaving(true)

      // Analyze user's communication style
      const styleResponse = await fetch('/api/analyze-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      })

      if (!styleResponse.ok) {
        throw new Error(`Failed to analyze style: ${styleResponse.statusText}`)
      }

      const style = await styleResponse.json()

      // Save all user data
      const saveResponse = await fetch('/api/save-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          profession,
          style,
          chatHistory: messages
        })
      })

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json()
        throw new Error(`Failed to save user data: ${errorData.error || saveResponse.statusText}`)
      }

      const savedData = await saveResponse.json()

      toast({
        title: "Onboarding Complete!",
        description: "Your profile has been saved successfully.",
      })

      setIsOpen(false)
    } catch (error) {
      console.error('Error in handleChatComplete:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-primary">Welcome to TailorReach 😁</AlertDialogTitle>
          <AlertDialogDescription className="text-base text-secondary-foreground">
            {step === 1 ? "Now, tell us about your profession." : 
             "Let's have a quick chat to understand your communication style. Start by saying hi!"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {step === 1 && (
          <form onSubmit={handleProfessionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profession" className="text-sm font-medium text-primary">What's your profession?</Label>
              <Input
                id="profession"
                placeholder="Enter your profession"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                required
                className="w-full border-input bg-background text-foreground shadow-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <AlertDialogFooter>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Next</Button>
            </AlertDialogFooter>
          </form>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-4 max-h-[300px] overflow-y-auto p-4 bg-secondary rounded-md">
              {messages.slice(1).map(m => (
                <div key={m.id} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'}`}>
                  <p className="text-sm font-medium">{m.role === 'user' ? 'You' : 'TailorReach'}</p>
                  <p className="mt-1 text-sm">{m.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message here..."
                  disabled={isLoading || isSaving}
                  className="flex-1 border-input bg-background text-foreground shadow-sm focus:ring-2 focus:ring-primary"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || isSaving} 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                </Button>
              </div>
            </form>
            <AlertDialogFooter>
              <Button 
                onClick={handleChatComplete} 
                disabled={isSaving}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finish Chat'}
              </Button>
            </AlertDialogFooter>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
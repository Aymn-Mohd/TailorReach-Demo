import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "mx-auto w-full",
          card: "shadow-none",
          footer: "hidden"
        }
      }}
    />
  )
}
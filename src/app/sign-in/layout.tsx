import Image from "next/image"
import Logo from "@/components/img/logo.svg"
import Link from "next/link"

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-gradient-to-b from-orange-50 to-orange-100 p-10 text-black lg:flex">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(30deg,#ffd4b8_0%,rgba(255,255,255,0)_70%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-100 to-transparent" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-top [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>
        <div className="relative z-20">
          <Image
            src={Logo}
            alt="TailorReach Logo"
            width={144}
            height={144}
            className="h-36 w-36"
            priority
          />
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "TailorReach has transformed how we connect with our customers. The personalized approach and data-driven insights have significantly improved our engagement rates."
            </p>
            <footer className="text-sm">Sofia Davis, Marketing Director</footer>
          </blockquote>
        </div>
        <div className="absolute bottom-0 right-0 mr-10 mb-10">
          <div className="flex items-center space-x-4">
            <div className="h-2 w-2 rounded-full bg-orange-400" />
            <div className="h-2 w-2 rounded-full bg-orange-300" />
            <div className="h-2 w-2 rounded-full bg-orange-200" />
          </div>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email to sign in to your account
            </p>
          </div>
          {children}
          <p className="px-8 text-center text-sm text-muted-foreground">
            <span>New to TailorReach? </span>
            <Link 
              href="/sign-up" 
              className="underline underline-offset-4 hover:text-primary"
            >
              Create an account
            </Link>
          </p>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
} 
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { BarChart3 } from "lucide-react";
import Link from "next/link";

function LoginFormFallback() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <div className="h-10 bg-muted animate-pulse rounded-md" />
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="h-10 bg-muted animate-pulse rounded-md" />
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="size-4" />
          </div>
          Mini CRM
        </Link>
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

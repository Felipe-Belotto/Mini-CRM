import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

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
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
          <CardDescription>
            Entre com sua conta para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

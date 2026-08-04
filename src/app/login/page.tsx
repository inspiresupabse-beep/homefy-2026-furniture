import { Suspense } from "react";
import LoginPageClient from "./login-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-stone-400">Loading...</div>}>
      <LoginPageClient />
    </Suspense>
  );
}

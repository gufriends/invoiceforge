import { Suspense } from "react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Reset password" subtitle="Masukkan password baru kamu">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}

import { AuthLayout } from "@/components/layouts/auth-layout";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Lupa password?" subtitle="Masukkan email untuk reset password">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}

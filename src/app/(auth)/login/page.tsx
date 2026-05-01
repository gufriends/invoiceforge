import { AuthLayout } from "@/components/layouts/auth-layout";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <AuthLayout title="Selamat datang kembali" subtitle="Masuk ke akun InvoiceForge kamu">
      <LoginForm />
    </AuthLayout>
  );
}
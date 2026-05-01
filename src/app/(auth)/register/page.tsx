import { AuthLayout } from "@/components/layouts/auth-layout";
import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout title="Buat akun baru" subtitle="Mulai kelola invoice & klien dengan mudah">
      <RegisterForm />
    </AuthLayout>
  );
}
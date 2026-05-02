"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { registerSchema } from "@/lib/validations";
import type { RegisterFormValues } from "@/types/forms";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", acceptTerms: false as any },
  });

  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.message ?? "Pendaftaran gagal");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    toast.success("Pendaftaran berhasil");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input
          id="name"
          placeholder="Nama kamu"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" className="text-xs text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Min. 8 karakter"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Ulangi password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="acceptTerms"
          checked={acceptTerms}
          onCheckedChange={(c) => setValue("acceptTerms", (c === true) as any, { shouldValidate: true })}
        />
        <Label htmlFor="acceptTerms" className="text-sm font-normal leading-snug">
          Saya setuju dengan syarat & ketentuan dan kebijakan privasi InvoiceForge
        </Label>
      </div>
      {errors.acceptTerms && <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Daftar
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Masuk di sini
        </Link>
      </p>
    </form>
  );
}
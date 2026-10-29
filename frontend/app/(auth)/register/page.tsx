import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free Orbit account and try the full template flow.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}

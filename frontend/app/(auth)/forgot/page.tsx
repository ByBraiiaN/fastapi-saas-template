import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a link to reset your Orbit account password.",
};

export default function ForgotPage() {
  return <ForgotForm />;
}

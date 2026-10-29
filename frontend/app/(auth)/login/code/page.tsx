import type { Metadata } from "next";
import { CodeForm } from "@/components/auth/code-form";

export const metadata: Metadata = {
  title: "Sign in with a code",
  description: "Sign in to Orbit with a one-time code sent to your email.",
};

export default function LoginCodePage() {
  return <CodeForm />;
}

import { redirect } from "next/navigation";

export default function Home() {
  // Server-side redirect to avoid hydration issues
  redirect("/kyc");
}

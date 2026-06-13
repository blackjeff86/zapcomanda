import { redirect } from "next/navigation";

export default function PlanPageRedirect() {
  redirect("/dashboard/settings#plano");
}

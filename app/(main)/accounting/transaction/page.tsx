import { redirect } from "next/navigation"

export default function TransactionRedirectPage() {
  redirect("/accounting/transactions")
}
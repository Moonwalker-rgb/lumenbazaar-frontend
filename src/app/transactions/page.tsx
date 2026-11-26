import { Suspense } from "react";

import { TransactionDashboard } from "@/components/transactions/transaction-dashboard";

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionDashboard />
    </Suspense>
  );
}

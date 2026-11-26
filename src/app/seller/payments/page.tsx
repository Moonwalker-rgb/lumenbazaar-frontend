import { Suspense } from "react";

import { SellerPayments } from "@/components/seller/seller-payments";

export default function SellerPaymentsPage() {
  return (
    <Suspense fallback={null}>
      <SellerPayments />
    </Suspense>
  );
}

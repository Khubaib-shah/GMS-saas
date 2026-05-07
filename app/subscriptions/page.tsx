import { Suspense } from "react";
import SubscriptionsClient from "./SubscriptionsClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-primary font-black animate-pulse tracking-widest uppercase text-xs">Loading Subscriptions...</div>}>
      <SubscriptionsClient />
    </Suspense>
  );
}

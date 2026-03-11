import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="mt-2 text-muted-foreground">Page not found</p>
      <Link href="/dashboard" className="mt-4">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}

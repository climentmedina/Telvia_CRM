import { getOutreachBoard } from "@/lib/queries";
import { OutreachClient } from "@/components/outreach/outreach-client";

export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  const board = await getOutreachBoard();
  return <OutreachClient board={board} />;
}

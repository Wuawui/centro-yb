import { TableSkeleton } from "@/components/ui/Skeletons";

export default function Loading() {
  return <TableSkeleton rows={5} cols={3} />;
}

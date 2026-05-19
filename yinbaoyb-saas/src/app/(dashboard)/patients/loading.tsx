import { TableSkeleton } from "@/components/ui/Skeletons";

export default function Loading() {
  return <TableSkeleton rows={8} cols={5} />;
}

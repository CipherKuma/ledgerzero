import {
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CircleX,
  Info,
  LoaderCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  CheckIcon: Check,
  ChevronDownIcon: ChevronDown,
  ChevronRightIcon: ChevronRight,
  ChevronUpIcon: ChevronUp,
  CircleCheckIcon: CircleCheck,
  InfoIcon: Info,
  Loader2Icon: LoaderCircle,
  OctagonXIcon: CircleX,
  TriangleAlertIcon: CircleAlert,
  XIcon: X,
};

export function IconPlaceholder({
  lucide,
  className,
}: {
  lucide: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
  className?: string;
}) {
  const Icon = icons[lucide] ?? CheckCircle;
  return <Icon aria-hidden="true" className={cn("size-4", className)} />;
}

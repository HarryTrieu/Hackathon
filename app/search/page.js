import { Search } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata = { title: "Search — Sodu" };

export default function SearchPage() {
  return (
    <div className="px-4 py-12 pb-16 md:pb-0">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>Search is coming in build step 5</EmptyTitle>
          <EmptyDescription>
            You'll be able to find people by skill or keyword and see what they
            studied and where they ended up.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

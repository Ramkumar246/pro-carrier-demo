import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const filters = ["Sea Freight", "Air Freight", "Road Freight", "All"];

const FilterButtons = () => {
  const [activeFilter, setActiveFilter] = useState("Sea Freight");

  return (
    <div className="flex gap-3">
      {filters.map((filter) => (
        <Button
          key={filter}
          variant={activeFilter === filter ? "default" : "outline"}
          className={cn(
            "rounded-full px-6",
            activeFilter === filter
              ? "bg-primary text-primary-foreground shadow-lg"
              : "border-border hover:bg-muted"
          )}
          onClick={() => setActiveFilter(filter)}
        >
          {filter}
        </Button>
      ))}
    </div>
  );
};

export default FilterButtons;

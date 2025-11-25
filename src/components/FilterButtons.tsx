import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { transportFilterOptions, type TransportFilter } from "@/data/shipments";

interface FilterButtonsProps {
  activeFilter: TransportFilter;
  onFilterChange: (filter: TransportFilter) => void;
}

const FilterButtons = ({ activeFilter, onFilterChange }: FilterButtonsProps) => {
  return (
    <div className="flex gap-3 custom-button-container">
      {transportFilterOptions.map(({ label, value }) => (
        <Button
          key={value}
          variant={activeFilter === value ? "default" : "outline"}
          className={cn(
            "rounded-full px-6",
            activeFilter === value
              ? "bg-primary text-primary-foreground shadow-lg"
              : "border-border hover:bg-primary hover:text-primary-foreground",
          )}
          onClick={() => onFilterChange(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
};

export default FilterButtons;

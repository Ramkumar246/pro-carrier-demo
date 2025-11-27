import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const DashboardCard = ({ title, children, className }: DashboardCardProps) => {
  return (
    <Card className={`p-3 sm:p-4 lg:p-6 ${className}`}>
      <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </h3>
      {children}
    </Card>
  );
};

export default DashboardCard;

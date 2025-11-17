import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const DashboardCard = ({ title, children, className }: DashboardCardProps) => {
  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </Card>
  );
};

export default DashboardCard;

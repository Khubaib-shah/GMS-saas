import { Card } from "@/components/ui/card";

interface ChartPlaceholderProps {
  title: string;
  description?: string;
}

export function ChartPlaceholder({
  title,
  description,
}: ChartPlaceholderProps) {
  return (
    <Card className="p-6 bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
      )}

      <div className="h-80 bg-gradient-to-br from-muted/50 to-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-muted-foreground text-sm">Chart visualization</p>
        </div>
      </div>
    </Card>
  );
}

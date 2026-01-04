import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface RatingDistributionChartProps {
  professionalId: string;
}

const chartConfig = {
  count: {
    label: "Avaliações",
    color: "hsl(var(--primary))",
  },
};

const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

export function RatingDistributionChart({ professionalId }: RatingDistributionChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["professional-rating-distribution", professionalId],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from("booking_reviews")
        .select("rating")
        .eq("professional_id", professionalId)
        .not("reviewed_at", "is", null);

      if (error) throw error;

      // Contagem por estrela
      const distribution = [1, 2, 3, 4, 5].map(rating => ({
        rating: `${rating}★`,
        count: reviews?.filter(r => r.rating === rating).length || 0,
        ratingNum: rating,
      }));

      const totalReviews = reviews?.length || 0;
      const avgRating = totalReviews > 0
        ? reviews!.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
        : 0;

      return { distribution, totalReviews, avgRating };
    },
    enabled: !!professionalId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Distribuição de Notas</CardTitle>
          {data?.totalReviews ? (
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-5 w-5 fill-current" />
              <span className="font-bold">{data.avgRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({data.totalReviews} avaliações)
              </span>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {data?.totalReviews === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Star className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhuma avaliação recebida ainda</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data?.distribution} 
                layout="vertical"
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="rating" 
                  width={40}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data?.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.ratingNum - 1]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

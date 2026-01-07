import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProposalMetrics {
  summary: {
    total: number;
    sent: number;
    viewed: number;
    accepted: number;
    rejected: number;
    expired: number;
    draft: number;
    conversionRate: number;
    viewRate: number;
    totalConvertedValue: number;
    averageTicket: number;
    pendingCount: number;
  };
  funnel: {
    name: string;
    value: number;
    percentage: number;
    color: string;
  }[];
  bySalesperson: {
    id: string;
    name: string;
    sent: number;
    accepted: number;
    rejected: number;
    conversionRate: number;
    totalValue: number;
  }[];
  byMonth: {
    month: string;
    sent: number;
    accepted: number;
  }[];
  timeMetrics: {
    avgViewTimeHours: number | null;
    avgAcceptTimeHours: number | null;
  };
}

export function useProposalMetrics(filters?: {
  salesperson_id?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ["proposal-metrics", filters],
    queryFn: async (): Promise<ProposalMetrics> => {
      let query = supabase
        .from("commercial_proposals")
        .select(`
          id,
          status,
          final_monthly_price,
          created_at,
          sent_at,
          viewed_at,
          accepted_at,
          rejected_at,
          valid_until,
          salesperson_id,
          salespeople (
            id,
            full_name
          )
        `);

      if (filters?.salesperson_id) {
        query = query.eq("salesperson_id", filters.salesperson_id);
      }

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString());
      }

      const { data: proposals, error } = await query;

      if (error) throw error;

      // Calculate summary metrics
      const total = proposals?.length || 0;
      const sent = proposals?.filter(p => p.status === "sent").length || 0;
      const viewed = proposals?.filter(p => p.status === "viewed").length || 0;
      const accepted = proposals?.filter(p => p.status === "accepted").length || 0;
      const rejected = proposals?.filter(p => p.status === "rejected").length || 0;
      const expired = proposals?.filter(p => p.status === "expired").length || 0;
      const draft = proposals?.filter(p => p.status === "draft").length || 0;

      const sentOrBeyond = sent + viewed + accepted + rejected + expired;
      const conversionRate = sentOrBeyond > 0 ? (accepted / sentOrBeyond) * 100 : 0;
      const viewRate = sentOrBeyond > 0 ? ((viewed + accepted + rejected) / sentOrBeyond) * 100 : 0;

      const acceptedProposals = proposals?.filter(p => p.status === "accepted") || [];
      const totalConvertedValue = acceptedProposals.reduce((sum, p) => sum + (p.final_monthly_price || 0), 0);
      const averageTicket = acceptedProposals.length > 0 ? totalConvertedValue / acceptedProposals.length : 0;
      const pendingCount = sent + viewed;

      // Funnel data
      const funnel = [
        { name: "Enviadas", value: sentOrBeyond, percentage: 100, color: "hsl(var(--primary))" },
        { name: "Visualizadas", value: viewed + accepted + rejected, percentage: sentOrBeyond > 0 ? ((viewed + accepted + rejected) / sentOrBeyond) * 100 : 0, color: "hsl(var(--warning))" },
        { name: "Aceitas", value: accepted, percentage: sentOrBeyond > 0 ? (accepted / sentOrBeyond) * 100 : 0, color: "hsl(var(--success))" },
        { name: "Rejeitadas", value: rejected, percentage: sentOrBeyond > 0 ? (rejected / sentOrBeyond) * 100 : 0, color: "hsl(var(--destructive))" },
      ];

      // Group by salesperson
      const salespersonMap = new Map<string, {
        id: string;
        name: string;
        sent: number;
        accepted: number;
        rejected: number;
        totalValue: number;
      }>();

      proposals?.forEach(p => {
        if (p.salesperson_id && p.salespeople) {
          const sp = p.salespeople as { id: string; full_name: string };
          const existing = salespersonMap.get(p.salesperson_id) || {
            id: p.salesperson_id,
            name: sp.full_name || "Sem nome",
            sent: 0,
            accepted: 0,
            rejected: 0,
            totalValue: 0,
          };

          if (["sent", "viewed", "accepted", "rejected", "expired"].includes(p.status || "")) {
            existing.sent++;
          }
          if (p.status === "accepted") {
            existing.accepted++;
            existing.totalValue += p.final_monthly_price || 0;
          }
          if (p.status === "rejected") {
            existing.rejected++;
          }

          salespersonMap.set(p.salesperson_id, existing);
        }
      });

      const bySalesperson = Array.from(salespersonMap.values())
        .map(sp => ({
          ...sp,
          conversionRate: sp.sent > 0 ? (sp.accepted / sp.sent) * 100 : 0,
        }))
        .sort((a, b) => b.conversionRate - a.conversionRate);

      // Group by month (last 6 months)
      const monthsAgo = 6;
      const now = new Date();
      const byMonth: { month: string; sent: number; accepted: number }[] = [];

      for (let i = monthsAgo - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        const monthLabel = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

        const monthProposals = proposals?.filter(p => {
          const createdAt = new Date(p.created_at || "");
          return createdAt.toISOString().slice(0, 7) === monthKey;
        }) || [];

        byMonth.push({
          month: monthLabel,
          sent: monthProposals.filter(p => ["sent", "viewed", "accepted", "rejected", "expired"].includes(p.status || "")).length,
          accepted: monthProposals.filter(p => p.status === "accepted").length,
        });
      }

      // Time metrics
      let totalViewTime = 0;
      let viewCount = 0;
      let totalAcceptTime = 0;
      let acceptCount = 0;

      proposals?.forEach(p => {
        if (p.sent_at && p.viewed_at) {
          const diff = new Date(p.viewed_at).getTime() - new Date(p.sent_at).getTime();
          totalViewTime += diff;
          viewCount++;
        }
        if (p.sent_at && p.accepted_at) {
          const diff = new Date(p.accepted_at).getTime() - new Date(p.sent_at).getTime();
          totalAcceptTime += diff;
          acceptCount++;
        }
      });

      const avgViewTimeHours = viewCount > 0 ? totalViewTime / viewCount / (1000 * 60 * 60) : null;
      const avgAcceptTimeHours = acceptCount > 0 ? totalAcceptTime / acceptCount / (1000 * 60 * 60) : null;

      return {
        summary: {
          total,
          sent,
          viewed,
          accepted,
          rejected,
          expired,
          draft,
          conversionRate,
          viewRate,
          totalConvertedValue,
          averageTicket,
          pendingCount,
        },
        funnel,
        bySalesperson,
        byMonth,
        timeMetrics: {
          avgViewTimeHours,
          avgAcceptTimeHours,
        },
      };
    },
  });
}

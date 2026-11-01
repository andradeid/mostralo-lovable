// Card de um cupom na lista: nome, selos de status/duração/público, código copiável,
// desconto, datas, barra de usos e ações (editar, duplicar, excluir).
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Edit, Trash2, Copy, Calendar, Eye, Clock, Repeat, Infinity, CopyPlus } from 'lucide-react';
import { formatPrice, getComputedStatus, getStatusConfig, type Coupon } from '@/lib/coupons/adminCoupons';

const getDurationBadge = (coupon: Coupon) => {
  const dt = coupon.duration_type || 'once';
  if (dt === 'once') return { label: '1ª mensalidade', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20', icon: Clock };
  if (dt === 'multiple') return { label: `${coupon.duration_months}m recorrente`, className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20', icon: Repeat };
  return { label: 'Permanente', className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20', icon: Infinity };
};

interface Props {
  coupon: Coupon;
  copyCode: (code: string) => void;
  handleEdit: (coupon: Coupon) => void;
  handleDuplicate: (coupon: Coupon) => void;
  handleDelete: (id: string) => void;
}

export function CouponCard({ coupon, copyCode, handleEdit, handleDuplicate, handleDelete }: Props) {
          const computedStatus = getComputedStatus(coupon);
          const statusConfig = getStatusConfig(computedStatus);
          const durationBadge = getDurationBadge(coupon);
          const DurationIcon = durationBadge.icon;
          const usagePercentage = coupon.max_uses
            ? (coupon.used_count / coupon.max_uses) * 100
            : 0;
          const usageColor = usagePercentage >= 90 ? 'bg-red-500' : usagePercentage >= 60 ? 'bg-amber-500' : 'bg-primary';

          return (
            <Card className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Row 1: Name + Status + Duration badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm truncate max-w-[280px]">{coupon.name}</h3>
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${statusConfig.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${statusConfig.dot}`} />
                        {statusConfig.label}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${durationBadge.className}`}>
                        <DurationIcon className="w-3 h-3 mr-1" />
                        {durationBadge.label}
                      </Badge>
                      {coupon.is_public && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
                          <Eye className="w-3 h-3 mr-1" />
                          Público
                        </Badge>
                      )}
                    </div>

                    {/* Row 2: Description */}
                    {coupon.description && (
                      <p className="text-xs text-muted-foreground">{coupon.description}</p>
                    )}

                    {/* Row 3: Code + Metrics inline */}
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Code pill */}
                      <button
                        onClick={() => copyCode(coupon.code)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md hover:bg-muted/80 transition-colors group"
                      >
                        <Ticket className="w-3 h-3 text-muted-foreground" />
                        <code className="text-xs font-bold">{coupon.code}</code>
                        <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      {/* Discount */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Desconto:</span>
                        <span className="text-sm font-bold text-primary">
                          {coupon.discount_type === 'percentage'
                            ? `${coupon.discount_value}%`
                            : formatPrice(coupon.discount_value)
                          }
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {coupon.start_date
                          ? new Date(coupon.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                          : 'Início imediato'
                        }
                        {' → '}
                        {coupon.end_date
                          ? new Date(coupon.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                          : '∞'
                        }
                      </div>
                    </div>

                    {/* Row 4: Usage bar */}
                    <div className="flex items-center gap-3 max-w-sm">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-muted-foreground">Usos</span>
                          <span className="text-[10px] font-medium">{coupon.used_count}/{coupon.max_uses || '∞'}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={`${usageColor} h-full rounded-full transition-all`}
                            style={{ width: coupon.max_uses ? `${Math.min(usagePercentage, 100)}%` : '0%' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(coupon)}
                      className="h-8 w-8 p-0"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(coupon)}
                      className="h-8 w-8 p-0"
                      title="Duplicar"
                    >
                      <CopyPlus className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(coupon.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
}

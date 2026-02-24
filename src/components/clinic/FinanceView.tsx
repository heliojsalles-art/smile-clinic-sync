import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClinic } from '@/contexts/ClinicContext';

export default function FinanceView() {
  const { patients } = useClinic();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthPayments = useMemo(() => {
    const items: { patientName: string; date: string; amount: number; description: string }[] = [];

    for (const patient of patients) {
      if (!patient.payments) continue;
      for (const payment of patient.payments) {
        const paymentDate = new Date(payment.date);
        if (paymentDate >= monthStart && paymentDate <= monthEnd) {
          items.push({
            patientName: patient.name,
            date: payment.date,
            amount: payment.amount,
            description: payment.description,
          });
        }
      }
    }

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [patients, monthStart, monthEnd]);

  const total = monthPayments.reduce((sum, p) => sum + p.amount, 0);

  const prevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-display text-lg font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Total card */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
        <div className="bg-primary/20 rounded-full p-2">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total do mês</p>
          <p className="text-xl font-bold text-foreground">R$ {total.toFixed(2)}</p>
        </div>
      </div>

      {/* Payment list */}
      {monthPayments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg">Nenhum pagamento neste mês</p>
        </div>
      ) : (
        <div className="space-y-2">
          {monthPayments.map((p, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{p.patientName}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(p.date), 'dd/MM/yyyy')}
                  {p.description ? ` — ${p.description}` : ''}
                </p>
              </div>
              <span className="text-sm font-bold text-foreground shrink-0">
                R$ {p.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

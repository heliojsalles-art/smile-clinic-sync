import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Cake, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClinic } from '@/contexts/ClinicContext';
import WhatsAppDialog from './WhatsAppDialog';

export default function BirthdayList() {
  const { patients, templates } = useClinic();
  const [whatsApp, setWhatsApp] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('clinic_birthday_notified');
      if (!saved) return new Set();
      const { month, ids } = JSON.parse(saved);
      // Reset if stored month differs from current month
      const currentKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;
      return month === currentKey ? new Set(ids) : new Set();
    } catch { return new Set(); }
  });

  const currentMonth = new Date().getMonth() + 1; // 1-12

  const birthdayPatients = useMemo(() => {
    return patients
      .filter(p => {
        if (!p.birthDate || notifiedIds.has(p.id)) return false;
        const month = parseInt(p.birthDate.split('-')[1], 10);
        return month === currentMonth;
      })
      .map(p => {
        const day = parseInt(p.birthDate!.split('-')[2], 10);
        return { patient: p, day };
      })
      .sort((a, b) => a.day - b.day);
  }, [patients, currentMonth, notifiedIds]);

  const handleNotified = (patientId: string) => {
    setNotifiedIds(prev => {
      const next = new Set(prev);
      next.add(patientId);
      const currentKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;
      localStorage.setItem('clinic_birthday_notified', JSON.stringify({ month: currentKey, ids: [...next] }));
      return next;
    });
  };

  const monthName = format(new Date(), 'MMMM', { locale: ptBR });

  if (birthdayPatients.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Cake className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-lg">Nenhum aniversariante pendente</p>
        <p className="text-sm mt-1 capitalize">Todos já foram parabenizados em {monthName}! 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-3 capitalize">
        <Cake className="h-4 w-4 inline mr-1 text-accent" />
        Aniversariantes de {monthName}
      </p>

      {birthdayPatients.map(({ patient, day }) => (
        <div key={patient.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{patient.name}</p>
            <p className="text-sm text-muted-foreground">
              {String(day).padStart(2, '0')}/{String(currentMonth).padStart(2, '0')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => setWhatsApp({ id: patient.id, name: patient.name, phone: patient.phone })}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Parabenizar
          </Button>
        </div>
      ))}

      {whatsApp && (
        <WhatsAppDialog
          open={!!whatsApp}
          onOpenChange={open => { if (!open) setWhatsApp(null); }}
          patientName={whatsApp.name}
          patientPhone={whatsApp.phone}
          defaultMessage={templates.birthdayGreeting}
          onSent={() => handleNotified(whatsApp.id)}
        />
      )}
    </div>
  );
}

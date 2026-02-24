import { useMemo, useState } from 'react';
import { differenceInMonths } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClinic } from '@/contexts/ClinicContext';
import WhatsAppDialog from './WhatsAppDialog';

export default function RecallList() {
  const { patients, getLastAppointment, templates } = useClinic();
  const [whatsApp, setWhatsApp] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('clinic_recall_notified');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const recallPatients = useMemo(() => {
    const now = new Date();
    return patients
      .map(p => {
        const last = getLastAppointment(p.id);
        const lastDate = last ? new Date(`${last.date}T${last.time}`) : null;
        const months = lastDate ? differenceInMonths(now, lastDate) : null;
        return { patient: p, lastDate, months };
      })
      .filter(r => (r.months === null || r.months >= 6) && !notifiedIds.has(r.patient.id))
      .sort((a, b) => (b.months ?? 999) - (a.months ?? 999));
  }, [patients, getLastAppointment, notifiedIds]);

  const handleNotified = (patientId: string) => {
    setNotifiedIds(prev => {
      const next = new Set(prev);
      next.add(patientId);
      localStorage.setItem('clinic_recall_notified', JSON.stringify([...next]));
      return next;
    });
  };

  if (recallPatients.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-lg">Nenhum paciente para retorno</p>
        <p className="text-sm mt-1">Todos os pacientes estão em dia! 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-3">
        <AlertTriangle className="h-4 w-4 inline mr-1 text-accent" />
        Pacientes com mais de 6 meses sem consulta
      </p>

      {recallPatients.map(({ patient, lastDate, months }) => (
        <div key={patient.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{patient.name}</p>
            <p className="text-sm text-muted-foreground">
              {lastDate
                ? `Última consulta: ${format(lastDate, "dd/MM/yyyy", { locale: ptBR })} (${months} meses)`
                : 'Nenhuma consulta registrada'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => setWhatsApp({ id: patient.id, name: patient.name, phone: patient.phone })}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Lembrar
          </Button>
        </div>
      ))}

      {whatsApp && (
        <WhatsAppDialog
          open={!!whatsApp}
          onOpenChange={open => { if (!open) setWhatsApp(null); }}
          patientName={whatsApp.name}
          patientPhone={whatsApp.phone}
          defaultMessage={templates.recallReminder}
          onSent={() => handleNotified(whatsApp.id)}
        />
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, MessageCircle, X, UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClinic } from '@/contexts/ClinicContext';
import { Patient } from '@/types/clinic';
import PatientFormDialog from './PatientFormDialog';
import WhatsAppDialog from './WhatsAppDialog';

const TIME_SLOTS: string[] = [];
for (let h = 8; h < 18; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

export default function AgendaView() {
  const { patients, getAppointmentsForDate, addAppointment, deleteAppointment, getPatientById, templates } = useClinic();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [whatsApp, setWhatsApp] = useState<{ name: string; phone: string; time: string } | null>(null);

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const dayAppointments = getAppointmentsForDate(dateStr);

  const appointmentMap = useMemo(() => {
    const map: Record<string, typeof dayAppointments[0]> = {};
    dayAppointments.forEach(a => { map[a.time] = a; });
    return map;
  }, [dayAppointments]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q)).slice(0, 10);
  }, [patients, searchQuery]);

  const handleBookPatient = (patient: Patient) => {
    if (!bookingSlot) return;
    addAppointment({ patientId: patient.id, date: dateStr, time: bookingSlot });
    setBookingSlot(null);
    setSearchQuery('');
  };

  const handleNewPatientSaved = (patient: Patient) => {
    if (bookingSlot) {
      addAppointment({ patientId: patient.id, date: dateStr, time: bookingSlot });
      setBookingSlot(null);
    }
    setShowNewPatient(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-card rounded-xl p-3 shadow-sm border border-border">
        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => subDays(d, 1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground capitalize">
            {format(currentDate, 'EEEE', { locale: ptBR })}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
          {isToday(currentDate) && (
            <span className="text-xs font-medium text-primary">Hoje</span>
          )}
        </button>
        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => addDays(d, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Time Slots */}
      <div className="space-y-1.5">
        {TIME_SLOTS.map(time => {
          const appt = appointmentMap[time];
          const patient = appt ? getPatientById(appt.patientId) : undefined;

          return (
            <div
              key={time}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                appt
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-card border-border hover:border-primary/30 cursor-pointer'
              }`}
              onClick={() => !appt && setBookingSlot(time)}
            >
              <span className="text-sm font-mono font-medium text-muted-foreground w-12 shrink-0">
                {time}
              </span>

              {appt && patient ? (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">{patient.phone}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={e => {
                        e.stopPropagation();
                        setWhatsApp({ name: patient.name, phone: patient.phone, time });
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={e => { e.stopPropagation(); deleteAppointment(appt.id); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">Disponível</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Booking Dialog */}
      <Dialog open={!!bookingSlot} onOpenChange={open => { if (!open) { setBookingSlot(null); setSearchQuery(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Agendar - {bookingSlot}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredPatients.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleBookPatient(p)}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <p className="font-medium text-sm text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.phone}</p>
                </button>
              ))}
              {filteredPatients.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum paciente encontrado</p>
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setShowNewPatient(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Paciente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PatientFormDialog
        open={showNewPatient}
        onOpenChange={setShowNewPatient}
        onSaved={handleNewPatientSaved}
      />

      {whatsApp && (
        <WhatsAppDialog
          open={!!whatsApp}
          onOpenChange={open => { if (!open) setWhatsApp(null); }}
          patientName={whatsApp.name}
          patientPhone={whatsApp.phone}
          defaultMessage={templates.appointmentReminder}
          replacements={{
            data: format(currentDate, "dd/MM/yyyy"),
            horario: whatsApp.time,
          }}
        />
      )}
    </div>
  );
}

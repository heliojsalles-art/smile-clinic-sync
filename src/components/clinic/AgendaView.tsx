import { useState, useMemo } from 'react';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, MessageCircle, X, UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClinic } from '@/contexts/ClinicContext';
import { Patient } from '@/types/clinic';
import PatientFormDialog from './PatientFormDialog';
import WhatsAppDialog from './WhatsAppDialog';

type ViewMode = 'day' | 'week' | 'month';

const TIME_SLOTS: string[] = [];
for (let h = 8; h < 18; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

export default function AgendaView() {
  const { patients, getAppointmentsForDate, getAppointmentsForDateRange, addAppointment, deleteAppointment, getPatientById, templates } = useClinic();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [bookingSlot, setBookingSlot] = useState<{ date: string; time: string } | null>(null);
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
    addAppointment({ patientId: patient.id, date: bookingSlot.date, time: bookingSlot.time });
    setBookingSlot(null);
    setSearchQuery('');
  };

  const handleNewPatientSaved = (patient: Patient) => {
    if (bookingSlot) {
      addAppointment({ patientId: patient.id, date: bookingSlot.date, time: bookingSlot.time });
      setBookingSlot(null);
    }
    setShowNewPatient(false);
    setSearchQuery('');
  };

  const navigatePrev = () => {
    if (viewMode === 'day') setCurrentDate(d => subDays(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => subWeeks(d, 1));
    else setCurrentDate(d => subMonths(d, 1));
  };

  const navigateNext = () => {
    if (viewMode === 'day') setCurrentDate(d => addDays(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => addWeeks(d, 1));
    else setCurrentDate(d => addMonths(d, 1));
  };

  const getDateLabel = () => {
    if (viewMode === 'day') {
      return (
        <>
          <p className="text-sm text-muted-foreground capitalize">
            {format(currentDate, 'EEEE', { locale: ptBR })}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
          {isToday(currentDate) && <span className="text-xs font-medium text-primary">Hoje</span>}
        </>
      );
    }
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { locale: ptBR });
      const end = endOfWeek(currentDate, { locale: ptBR });
      return (
        <p className="text-lg font-semibold text-foreground">
          {format(start, 'dd/MM')} – {format(end, 'dd/MM/yyyy')}
        </p>
      );
    }
    return (
      <p className="text-lg font-semibold text-foreground capitalize">
        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
      </p>
    );
  };

  // Week view data
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    const start = startOfWeek(currentDate, { locale: ptBR });
    const end = endOfWeek(currentDate, { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [currentDate, viewMode]);

  const weekAppointments = useMemo(() => {
    if (viewMode !== 'week') return {};
    const start = format(startOfWeek(currentDate, { locale: ptBR }), 'yyyy-MM-dd');
    const end = format(endOfWeek(currentDate, { locale: ptBR }), 'yyyy-MM-dd');
    const appts = getAppointmentsForDateRange(start, end);
    const map: Record<string, typeof appts> = {};
    appts.forEach(a => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [currentDate, viewMode, getAppointmentsForDateRange]);

  // Month view data
  const monthDays = useMemo(() => {
    if (viewMode !== 'month') return [];
    const start = startOfWeek(startOfMonth(currentDate), { locale: ptBR });
    const end = endOfWeek(endOfMonth(currentDate), { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [currentDate, viewMode]);

  const monthAppointments = useMemo(() => {
    if (viewMode !== 'month') return {};
    const start = format(startOfWeek(startOfMonth(currentDate), { locale: ptBR }), 'yyyy-MM-dd');
    const end = format(endOfWeek(endOfMonth(currentDate), { locale: ptBR }), 'yyyy-MM-dd');
    const appts = getAppointmentsForDateRange(start, end);
    const map: Record<string, number> = {};
    appts.forEach(a => { map[a.date] = (map[a.date] || 0) + 1; });
    return map;
  }, [currentDate, viewMode, getAppointmentsForDateRange]);

  return (
    <div className="space-y-4">
      {/* View Mode Selector */}
      <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
        {([['day', 'Dia'], ['week', 'Semana'], ['month', 'Mês']] as const).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              viewMode === mode
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-card rounded-xl p-3 shadow-sm border border-border">
        <Button variant="ghost" size="icon" onClick={navigatePrev}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <button onClick={() => setCurrentDate(new Date())} className="text-center">
          {getDateLabel()}
        </button>
        <Button variant="ghost" size="icon" onClick={navigateNext}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* DAY VIEW */}
      {viewMode === 'day' && (
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
                onClick={() => !appt && setBookingSlot({ date: dateStr, time })}
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
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="space-y-2">
          {weekDays.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const appts = weekAppointments[dayStr] || [];
            const today = isToday(day);

            return (
              <div
                key={dayStr}
                className={`bg-card rounded-lg border p-3 ${today ? 'border-primary/40 bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold capitalize text-foreground">
                      {format(day, 'EEE', { locale: ptBR })}
                    </span>
                    <span className="text-sm text-muted-foreground">{format(day, 'dd/MM')}</span>
                    {today && <span className="text-xs font-medium text-primary">Hoje</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{appts.length} consulta{appts.length !== 1 ? 's' : ''}</span>
                </div>
                {appts.length > 0 ? (
                  <div className="space-y-1">
                    {appts.map(a => {
                      const p = getPatientById(a.patientId);
                      return (
                        <div key={a.id} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-muted-foreground w-12 shrink-0">{a.time}</span>
                          <span className="text-foreground truncate">{p?.name || 'Paciente'}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto text-destructive hover:bg-destructive/10"
                            onClick={() => deleteAppointment(a.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Sem consultas</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const count = monthAppointments[dayStr] || 0;
              const today = isToday(day);
              const sameMonth = isSameMonth(day, currentDate);

              return (
                <button
                  key={dayStr}
                  onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                    today
                      ? 'bg-primary text-primary-foreground font-bold'
                      : sameMonth
                        ? 'bg-card border border-border hover:border-primary/30 text-foreground'
                        : 'text-muted-foreground/50'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-medium ${today ? 'text-primary-foreground/80' : 'text-primary'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={!!bookingSlot} onOpenChange={open => { if (!open) { setBookingSlot(null); setSearchQuery(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Agendar - {bookingSlot?.time}
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

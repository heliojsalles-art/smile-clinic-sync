import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Patient, Appointment, WhatsAppTemplate } from '@/types/clinic';

interface ClinicContextType {
  patients: Patient[];
  appointments: Appointment[];
  templates: WhatsAppTemplate;
  addPatient: (data: Omit<Patient, 'id' | 'createdAt'>) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addAppointment: (data: Omit<Appointment, 'id' | 'createdAt'>) => void;
  deleteAppointment: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;
  getAppointmentsForDate: (date: string) => Appointment[];
  getLastAppointment: (patientId: string) => Appointment | undefined;
  updateTemplates: (templates: WhatsAppTemplate) => void;
}

const ClinicContext = createContext<ClinicContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

const DEFAULT_TEMPLATES: WhatsAppTemplate = {
  appointmentReminder: 'Olá {nome}! 😊 Lembramos que sua consulta na Salles Ateliê Odontológico está marcada para o dia {data} às {horario}. Aguardamos você! 🦷',
  recallReminder: 'Olá {nome}! 😊 Faz tempo que não nos visitamos! Que tal agendar uma avaliação e limpeza na Salles Ateliê Odontológico? Entre em contato conosco! 🦷✨',
};

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(() => loadFromStorage('clinic_patients', []));
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadFromStorage('clinic_appointments', []));
  const [templates, setTemplates] = useState<WhatsAppTemplate>(() => loadFromStorage('clinic_templates', DEFAULT_TEMPLATES));

  useEffect(() => { localStorage.setItem('clinic_patients', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('clinic_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('clinic_templates', JSON.stringify(templates)); }, [templates]);

  const addPatient = useCallback((data: Omit<Patient, 'id' | 'createdAt'>) => {
    const patient: Patient = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setPatients(prev => [...prev, patient]);
    return patient;
  }, []);

  const updatePatient = useCallback((id: string, data: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deletePatient = useCallback((id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    setAppointments(prev => prev.filter(a => a.patientId !== id));
  }, []);

  const addAppointment = useCallback((data: Omit<Appointment, 'id' | 'createdAt'>) => {
    setAppointments(prev => [...prev, { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  }, []);

  const getPatientById = useCallback((id: string) => patients.find(p => p.id === id), [patients]);

  const getAppointmentsForDate = useCallback((date: string) =>
    appointments.filter(a => a.date === date).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments]
  );

  const getLastAppointment = useCallback((patientId: string) => {
    const patientAppts = appointments
      .filter(a => a.patientId === patientId)
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    return patientAppts[0];
  }, [appointments]);

  const updateTemplates = useCallback((t: WhatsAppTemplate) => setTemplates(t), []);

  return (
    <ClinicContext.Provider value={{
      patients, appointments, templates,
      addPatient, updatePatient, deletePatient,
      addAppointment, deleteAppointment,
      getPatientById, getAppointmentsForDate, getLastAppointment,
      updateTemplates,
    }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error('useClinic must be used within ClinicProvider');
  return ctx;
}

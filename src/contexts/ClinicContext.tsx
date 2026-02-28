import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Patient, Appointment, WhatsAppTemplate, ClinicSettings } from '@/types/clinic';
import { schedulePush, pullData, onSyncStatus } from '@/lib/syncService';

interface ClinicContextType {
  patients: Patient[];
  appointments: Appointment[];
  templates: WhatsAppTemplate;
  settings: ClinicSettings;
  addPatient: (data: Omit<Patient, 'id' | 'createdAt'>) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addAppointment: (data: Omit<Appointment, 'id' | 'createdAt'>) => void;
  deleteAppointment: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;
  getAppointmentsForDate: (date: string) => Appointment[];
  getAppointmentsForDateRange: (startDate: string, endDate: string) => Appointment[];
  getLastAppointment: (patientId: string) => Appointment | undefined;
  updateTemplates: (templates: WhatsAppTemplate) => void;
  updateSettings: (settings: ClinicSettings) => void;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncMessage: string;
  forcePull: () => Promise<void>;
  forcePush: () => Promise<void>;
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

const DEFAULT_SETTINGS: ClinicSettings = {
  clinicName: 'Salles Ateliê Odontológico',
  dentistName: '',
};

const DEFAULT_TEMPLATES: WhatsAppTemplate = {
  appointmentReminder: 'Olá {nome}! 😊 Lembramos que sua consulta na Salles Ateliê Odontológico está marcada para o dia {data} às {horario}. Aguardamos você! 🦷',
  recallReminder: 'Olá {nome}! 😊 Sabia que é muito importante retornar ao dentista a cada 6 meses para uma avaliação completa? Além disso, realizar uma limpeza profissional a cada 6 meses ajuda a prevenir cáries, doenças na gengiva e manter seu sorriso sempre saudável! 🦷✨ Se quiser marcar sua consulta na Salles Ateliê Odontológico, é só nos enviar uma mensagem por aqui mesmo! Estamos à disposição! 😊',
  birthdayGreeting: 'Olá {nome}! 🎂🎉 A equipe da Salles Ateliê Odontológico deseja um Feliz Aniversário! Que seu dia seja repleto de alegria e sorrisos! 😊🦷✨',
};

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(() => loadFromStorage('clinic_patients', []));
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadFromStorage('clinic_appointments', []));
  const [templates, setTemplates] = useState<WhatsAppTemplate>(() => loadFromStorage('clinic_templates', DEFAULT_TEMPLATES));
  const [settings, setSettings] = useState<ClinicSettings>(() => loadFromStorage('clinic_settings', DEFAULT_SETTINGS));
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const isInitialLoad = useRef(true);

  // Listen to sync status changes
  useEffect(() => {
    return onSyncStatus((status, message) => {
      setSyncStatus(status);
      setSyncMessage(message || '');
      if (status === 'success') {
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    });
  }, []);

  useEffect(() => { localStorage.setItem('clinic_patients', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('clinic_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('clinic_templates', JSON.stringify(templates)); }, [templates]);
  useEffect(() => { localStorage.setItem('clinic_settings', JSON.stringify(settings)); }, [settings]);

  // Auto-sync on data changes (skip initial load)
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    schedulePush({ patients, appointments, templates, settings });
  }, [patients, appointments, templates, settings]);

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

  const getAppointmentsForDateRange = useCallback((startDate: string, endDate: string) =>
    appointments.filter(a => a.date >= startDate && a.date <= endDate).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [appointments]
  );

  const getLastAppointment = useCallback((patientId: string) => {
    const patientAppts = appointments
      .filter(a => a.patientId === patientId)
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    return patientAppts[0];
  }, [appointments]);

  const updateTemplates = useCallback((t: WhatsAppTemplate) => setTemplates(t), []);
  const updateSettings = useCallback((s: ClinicSettings) => setSettings(s), []);

  const forcePull = useCallback(async () => {
    const data = await pullData();
    if (data) {
      setPatients(data.patients as Patient[]);
      setAppointments(data.appointments as Appointment[]);
      setTemplates(data.templates as WhatsAppTemplate);
      setSettings(data.settings as ClinicSettings);
      localStorage.setItem('clinic_patients', JSON.stringify(data.patients));
      localStorage.setItem('clinic_appointments', JSON.stringify(data.appointments));
      localStorage.setItem('clinic_templates', JSON.stringify(data.templates));
      localStorage.setItem('clinic_settings', JSON.stringify(data.settings));
    }
  }, []);

  const forcePush = useCallback(async () => {
    const { pushData } = await import('@/lib/syncService');
    await pushData({ patients, appointments, templates, settings });
  }, [patients, appointments, templates, settings]);

  return (
    <ClinicContext.Provider value={{
      patients, appointments, templates, settings,
      addPatient, updatePatient, deletePatient,
      addAppointment, deleteAppointment,
      getPatientById, getAppointmentsForDate, getAppointmentsForDateRange, getLastAppointment,
      updateTemplates, updateSettings,
      syncStatus, syncMessage, forcePull, forcePush,
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

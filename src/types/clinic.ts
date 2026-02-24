export interface Payment {
  id: string;
  date: string;
  amount: number;
  description: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  isInsurance: boolean;
  insuranceNumber?: string;
  treatment?: string;
  payments?: Payment[];
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  createdAt: string;
}

export interface WhatsAppTemplate {
  appointmentReminder: string;
  recallReminder: string;
}

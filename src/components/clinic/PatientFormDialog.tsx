import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useClinic } from '@/contexts/ClinicContext';
import { Patient, Payment } from '@/types/clinic';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editPatient?: Patient;
  onSaved?: (patient: Patient) => void;
}

export default function PatientFormDialog({ open, onOpenChange, editPatient, onSaved }: Props) {
  const { addPatient, updatePatient } = useClinic();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isInsurance, setIsInsurance] = useState(false);
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [treatment, setTreatment] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (editPatient) {
      setName(editPatient.name);
      setPhone(editPatient.phone);
      setBirthDate(editPatient.birthDate || '');
      setIsInsurance(editPatient.isInsurance);
      setInsuranceNumber(editPatient.insuranceNumber || '');
      setTreatment(editPatient.treatment || '');
      setPayments(editPatient.payments || []);
    } else {
      setName(''); setPhone(''); setBirthDate(''); setIsInsurance(false); setInsuranceNumber('');
      setTreatment(''); setPayments([]);
    }
  }, [editPatient, open]);

  const addPayment = () => {
    setPayments(prev => [...prev, {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      description: '',
    }]);
  };

  const updatePayment = (id: string, field: keyof Payment, value: string | number) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) return;
    const data = {
      name: name.trim(),
      phone: phone.trim(),
      birthDate: birthDate || undefined,
      isInsurance,
      insuranceNumber: isInsurance ? insuranceNumber.trim() : undefined,
      treatment: treatment.trim() || undefined,
      payments: payments.length > 0 ? payments : undefined,
    };

    if (editPatient) {
      updatePatient(editPatient.id, data);
      onSaved?.({ ...editPatient, ...data });
    } else {
      const p = addPatient(data);
      onSaved?.(p);
    }
    onOpenChange(false);
  };

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {editPatient ? 'Editar Paciente' : 'Novo Paciente'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do paciente" />
          </div>
          <div>
            <Label htmlFor="phone">Telefone (WhatsApp)</Label>
            <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <Label htmlFor="birthDate">Data de Nascimento</Label>
            <Input id="birthDate" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isInsurance} onCheckedChange={setIsInsurance} />
            <Label>Convênio</Label>
          </div>
          {isInsurance && (
            <div>
              <Label htmlFor="insurance">Nº do Convênio</Label>
              <Input id="insurance" value={insuranceNumber} onChange={e => setInsuranceNumber(e.target.value)} placeholder="Número do convênio" />
            </div>
          )}

          {/* Treatment */}
          <div>
            <Label htmlFor="treatment">Tratamento</Label>
            <Textarea
              id="treatment"
              value={treatment}
              onChange={e => setTreatment(e.target.value)}
              placeholder="Descreva o tratamento do paciente..."
              className="min-h-[80px]"
            />
          </div>

          {/* Payments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Pagamentos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPayment}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar
              </Button>
            </div>

            {payments.map(payment => (
              <div key={payment.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="date"
                      value={payment.date}
                      onChange={e => updatePayment(payment.id, 'date', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      value={payment.amount || ''}
                      onChange={e => updatePayment(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="R$ 0,00"
                      className="text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => removePayment(payment.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Input
                  value={payment.description}
                  onChange={e => updatePayment(payment.id, 'description', e.target.value)}
                  placeholder="Descrição do pagamento"
                  className="text-sm"
                />
              </div>
            ))}

            {payments.length > 0 && (
              <div className="text-sm font-semibold text-right text-foreground">
                Total: R$ {totalPaid.toFixed(2)}
              </div>
            )}
          </div>

          <Button onClick={handleSave} className="w-full" disabled={!name.trim() || !phone.trim()}>
            {editPatient ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useClinic } from '@/contexts/ClinicContext';
import { Patient } from '@/types/clinic';

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
  const [isInsurance, setIsInsurance] = useState(false);
  const [insuranceNumber, setInsuranceNumber] = useState('');

  useEffect(() => {
    if (editPatient) {
      setName(editPatient.name);
      setPhone(editPatient.phone);
      setIsInsurance(editPatient.isInsurance);
      setInsuranceNumber(editPatient.insuranceNumber || '');
    } else {
      setName(''); setPhone(''); setIsInsurance(false); setInsuranceNumber('');
    }
  }, [editPatient, open]);

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) return;
    const data = { name: name.trim(), phone: phone.trim(), isInsurance, insuranceNumber: isInsurance ? insuranceNumber.trim() : undefined };

    if (editPatient) {
      updatePatient(editPatient.id, data);
      onSaved?.({ ...editPatient, ...data });
    } else {
      const p = addPatient(data);
      onSaved?.(p);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
          <Button onClick={handleSave} className="w-full" disabled={!name.trim() || !phone.trim()}>
            {editPatient ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

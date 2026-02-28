import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useClinic } from '@/contexts/ClinicContext';
import { Patient, Payment, Treatment } from '@/types/clinic';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editPatient?: Patient;
  onSaved?: (patient: Patient) => void;
}

/** Migrate legacy single treatment+payments to treatments array */
function migrateLegacyTreatments(patient: Patient): Treatment[] {
  if (patient.treatments && patient.treatments.length > 0) {
    return patient.treatments;
  }
  // migrate old format
  if (patient.treatment || (patient.payments && patient.payments.length > 0)) {
    return [{
      id: crypto.randomUUID(),
      description: patient.treatment || '',
      payments: patient.payments || [],
      createdAt: patient.createdAt,
    }];
  }
  return [];
}

export default function PatientFormDialog({ open, onOpenChange, editPatient, onSaved }: Props) {
  const { addPatient, updatePatient } = useClinic();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isInsurance, setIsInsurance] = useState(false);
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [openTreatments, setOpenTreatments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (editPatient) {
      setName(editPatient.name);
      setPhone(editPatient.phone);
      setBirthDate(editPatient.birthDate || '');
      setIsInsurance(editPatient.isInsurance);
      setInsuranceNumber(editPatient.insuranceNumber || '');
      const migrated = migrateLegacyTreatments(editPatient);
      setTreatments(migrated);
      // open the last treatment by default
      if (migrated.length > 0) {
        setOpenTreatments(new Set([migrated[migrated.length - 1].id]));
      }
    } else {
      setName(''); setPhone(''); setBirthDate(''); setIsInsurance(false); setInsuranceNumber('');
      setTreatments([]); setOpenTreatments(new Set());
    }
  }, [editPatient, open]);

  const addTreatment = () => {
    const id = crypto.randomUUID();
    setTreatments(prev => [...prev, {
      id,
      description: '',
      payments: [],
      createdAt: new Date().toISOString(),
    }]);
    setOpenTreatments(prev => new Set(prev).add(id));
  };

  const updateTreatmentDescription = (id: string, description: string) => {
    setTreatments(prev => prev.map(t => t.id === id ? { ...t, description } : t));
  };

  const removeTreatment = (id: string) => {
    setTreatments(prev => prev.filter(t => t.id !== id));
    setOpenTreatments(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const addPaymentToTreatment = (treatmentId: string) => {
    setTreatments(prev => prev.map(t => t.id === treatmentId ? {
      ...t,
      payments: [...t.payments, {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        description: '',
      }]
    } : t));
  };

  const updatePayment = (treatmentId: string, paymentId: string, field: keyof Payment, value: string | number) => {
    setTreatments(prev => prev.map(t => t.id === treatmentId ? {
      ...t,
      payments: t.payments.map(p => p.id === paymentId ? { ...p, [field]: value } : p)
    } : t));
  };

  const removePayment = (treatmentId: string, paymentId: string) => {
    setTreatments(prev => prev.map(t => t.id === treatmentId ? {
      ...t,
      payments: t.payments.filter(p => p.id !== paymentId)
    } : t));
  };

  const toggleTreatment = (id: string) => {
    setOpenTreatments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) return;
    const data = {
      name: name.trim(),
      phone: phone.trim(),
      birthDate: birthDate || undefined,
      isInsurance,
      insuranceNumber: isInsurance ? insuranceNumber.trim() : undefined,
      treatments: treatments.length > 0 ? treatments : undefined,
      // clear legacy fields
      treatment: undefined,
      payments: undefined,
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

  const grandTotal = treatments.reduce((sum, t) => sum + t.payments.reduce((s, p) => s + (p.amount || 0), 0), 0);

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

          {/* Treatments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Tratamentos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTreatment}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Novo Tratamento
              </Button>
            </div>

            {treatments.map((treatment, index) => {
              const treatmentTotal = treatment.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
              const isOpen = openTreatments.has(treatment.id);

              return (
                <Collapsible key={treatment.id} open={isOpen} onOpenChange={() => toggleTreatment(treatment.id)}>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          <span className="font-medium text-sm truncate">
                            {treatment.description?.trim() || `Tratamento ${index + 1}`}
                          </span>
                        </div>
                        {treatmentTotal > 0 && (
                          <span className="text-xs font-semibold text-muted-foreground shrink-0 ml-2">
                            R$ {treatmentTotal.toFixed(2)}
                          </span>
                        )}
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="p-3 space-y-3 border-t border-border">
                        <div className="flex items-start gap-2">
                          <Textarea
                            value={treatment.description}
                            onChange={e => updateTreatmentDescription(treatment.id, e.target.value)}
                            placeholder="Descreva o tratamento..."
                            className="min-h-[60px] text-sm flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => removeTreatment(treatment.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Payments for this treatment */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Pagamentos</Label>
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addPaymentToTreatment(treatment.id)}>
                              <Plus className="h-3 w-3 mr-1" />
                              Pagamento
                            </Button>
                          </div>

                          {treatment.payments.map(payment => (
                            <div key={payment.id} className="bg-muted/50 rounded-lg p-2.5 space-y-1.5">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Input
                                    type="date"
                                    value={payment.date}
                                    onChange={e => updatePayment(treatment.id, payment.id, 'date', e.target.value)}
                                    className="text-xs h-8"
                                  />
                                </div>
                                <div className="w-24">
                                  <Input
                                    type="number"
                                    value={payment.amount || ''}
                                    onChange={e => updatePayment(treatment.id, payment.id, 'amount', parseFloat(e.target.value) || 0)}
                                    placeholder="R$ 0,00"
                                    className="text-xs h-8"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                                  onClick={() => removePayment(treatment.id, payment.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <Input
                                value={payment.description}
                                onChange={e => updatePayment(treatment.id, payment.id, 'description', e.target.value)}
                                placeholder="Descrição do pagamento"
                                className="text-xs h-8"
                              />
                            </div>
                          ))}

                          {treatment.payments.length > 0 && (
                            <div className="text-xs font-semibold text-right text-foreground">
                              Subtotal: R$ {treatmentTotal.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}

            {treatments.length > 1 && grandTotal > 0 && (
              <div className="text-sm font-bold text-right text-foreground">
                Total geral: R$ {grandTotal.toFixed(2)}
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

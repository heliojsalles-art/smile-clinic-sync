import { useState, useMemo } from 'react';
import { Search, UserPlus, Pencil, Trash2, Phone, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClinic } from '@/contexts/ClinicContext';
import PatientFormDialog from './PatientFormDialog';
import { Patient } from '@/types/clinic';

export default function PatientList() {
  const { patients, deletePatient } = useClinic();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | undefined>();

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q));
  }, [patients, search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { setEditPatient(undefined); setFormOpen(true); }}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Nenhum paciente encontrado</p>
            <p className="text-sm mt-1">Cadastre seu primeiro paciente</p>
          </div>
        )}
        {filtered.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground truncate">{p.name}</p>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{p.phone}</span>
              </div>
              {p.isInsurance && p.insuranceNumber && (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-accent-foreground">
                  <Shield className="h-3.5 w-3.5 text-accent" />
                  <span>Convênio: {p.insuranceNumber}</span>
                </div>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditPatient(p); setFormOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deletePatient(p.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <PatientFormDialog open={formOpen} onOpenChange={setFormOpen} editPatient={editPatient} />
    </div>
  );
}

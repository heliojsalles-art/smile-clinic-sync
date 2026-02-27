import { useState } from 'react';
import { Settings, Save, CloudUpload, CloudDownload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useClinic } from '@/contexts/ClinicContext';
import { toast } from '@/hooks/use-toast';

export default function SettingsView() {
  const { settings, updateSettings, patients, appointments, templates } = useClinic();
  const [clinicName, setClinicName] = useState(settings.clinicName);
  const [dentistName, setDentistName] = useState(settings.dentistName);

  const handleSaveSettings = () => {
    updateSettings({ clinicName: clinicName.trim() || 'Minha Clínica', dentistName: dentistName.trim() });
    toast({ title: 'Configurações salvas', description: 'As informações da clínica foram atualizadas.' });
  };

  const handleExportBackup = () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      patients: JSON.parse(localStorage.getItem('clinic_patients') || '[]'),
      appointments: JSON.parse(localStorage.getItem('clinic_appointments') || '[]'),
      templates: JSON.parse(localStorage.getItem('clinic_templates') || '{}'),
      settings: JSON.parse(localStorage.getItem('clinic_settings') || '{}'),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-clinica-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Backup exportado', description: 'Faça upload deste arquivo no seu Google Drive para manter seguro.' });
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (!data.version || !data.patients) {
            toast({ title: 'Erro', description: 'Arquivo de backup inválido.', variant: 'destructive' });
            return;
          }
          localStorage.setItem('clinic_patients', JSON.stringify(data.patients));
          localStorage.setItem('clinic_appointments', JSON.stringify(data.appointments || []));
          localStorage.setItem('clinic_templates', JSON.stringify(data.templates || {}));
          if (data.settings) localStorage.setItem('clinic_settings', JSON.stringify(data.settings));
          toast({ title: 'Backup importado', description: 'Recarregando a página para aplicar...' });
          setTimeout(() => window.location.reload(), 1500);
        } catch {
          toast({ title: 'Erro', description: 'Não foi possível ler o arquivo de backup.', variant: 'destructive' });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      {/* Clinic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Informações da Clínica
          </CardTitle>
          <CardDescription>Defina o nome da clínica e do dentista que aparecerão na tela inicial.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinicName">Nome da Clínica</Label>
            <Input
              id="clinicName"
              value={clinicName}
              onChange={e => setClinicName(e.target.value)}
              placeholder="Nome da clínica"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dentistName">Nome do Dentista</Label>
            <Input
              id="dentistName"
              value={dentistName}
              onChange={e => setDentistName(e.target.value)}
              placeholder="Dr(a). Nome"
            />
          </div>
          <Button onClick={handleSaveSettings} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CloudUpload className="h-5 w-5 text-primary" />
            Backup / Google Drive
          </CardTitle>
          <CardDescription>
            Exporte seus dados para salvar no Google Drive, ou importe um backup salvo anteriormente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full" onClick={handleExportBackup}>
            <CloudUpload className="h-4 w-4 mr-2" />
            Exportar Backup (baixar arquivo)
          </Button>
          <Button variant="outline" className="w-full" onClick={handleImportBackup}>
            <CloudDownload className="h-4 w-4 mr-2" />
            Importar Backup (do arquivo)
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Salve o arquivo exportado no seu Google Drive para manter seus dados seguros e acessíveis de qualquer dispositivo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

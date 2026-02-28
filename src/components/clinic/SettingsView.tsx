import { useState } from 'react';
import { Settings, Save, CloudUpload, CloudDownload, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useClinic } from '@/contexts/ClinicContext';
import { toast } from '@/hooks/use-toast';

export default function SettingsView() {
  const { settings, updateSettings, syncStatus, syncMessage, forcePull, forcePush } = useClinic();
  const [clinicName, setClinicName] = useState(settings.clinicName);
  const [dentistName, setDentistName] = useState(settings.dentistName);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  const handleSaveSettings = () => {
    updateSettings({ clinicName: clinicName.trim() || 'Minha Clínica', dentistName: dentistName.trim() });
    toast({ title: 'Configurações salvas', description: 'As informações da clínica foram atualizadas.' });
  };

  const handlePull = async () => {
    setIsPulling(true);
    await forcePull();
    setIsPulling(false);
    toast({ title: 'Dados baixados', description: 'Os dados foram baixados do servidor.' });
  };

  const handlePush = async () => {
    setIsPushing(true);
    await forcePush();
    setIsPushing(false);
    toast({ title: 'Dados enviados', description: 'Os dados foram enviados ao servidor.' });
  };

  const statusIcon = {
    idle: null,
    syncing: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const statusVariant = {
    idle: 'secondary' as const,
    syncing: 'default' as const,
    success: 'default' as const,
    error: 'destructive' as const,
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

      {/* Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sincronização com Servidor
          </CardTitle>
          <CardDescription>
            Seus dados são sincronizados automaticamente com o servidor ganesha.vip a cada alteração.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant={statusVariant[syncStatus]} className="gap-1">
              {statusIcon[syncStatus]}
              {syncStatus === 'idle' && 'Pronto'}
              {syncStatus === 'syncing' && 'Sincronizando...'}
              {syncStatus === 'success' && 'Sincronizado'}
              {syncStatus === 'error' && 'Erro'}
            </Badge>
            {syncMessage && syncStatus === 'error' && (
              <span className="text-xs text-destructive">{syncMessage}</span>
            )}
          </div>

          <Button variant="outline" className="w-full" onClick={handlePush} disabled={isPushing}>
            {isPushing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CloudUpload className="h-4 w-4 mr-2" />}
            Enviar dados para o servidor
          </Button>
          <Button variant="outline" className="w-full" onClick={handlePull} disabled={isPulling}>
            {isPulling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CloudDownload className="h-4 w-4 mr-2" />}
            Baixar dados do servidor
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            A sincronização automática envia os dados 2 segundos após cada alteração.
            Use os botões acima para forçar manualmente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

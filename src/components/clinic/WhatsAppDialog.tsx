import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientPhone: string;
  defaultMessage: string;
  replacements?: Record<string, string>;
  onSent?: () => void;
}

function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function applyReplacements(msg: string, replacements: Record<string, string>): string {
  let result = msg;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(`{${key}}`).join(value);
  }
  return result;
}

export default function WhatsAppDialog({ open, onOpenChange, patientName, patientPhone, defaultMessage, replacements = {}, onSent }: Props) {
  const allReplacements = { nome: patientName, ...replacements };
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(applyReplacements(defaultMessage, allReplacements));
  }, [defaultMessage, patientName, open]);

  const handleSend = () => {
    const phone = cleanPhone(patientPhone);
    const fullPhone = phone.length <= 11 ? `55${phone}` : phone;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
    onSent?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            WhatsApp - {patientName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Mensagem</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} />
          </div>
          <Button onClick={handleSend} className="w-full bg-green-600 hover:bg-green-700 text-white">
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

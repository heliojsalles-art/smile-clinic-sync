import { CalendarDays, Users, Clock, DollarSign, Cake } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClinicProvider } from '@/contexts/ClinicContext';
import AgendaView from '@/components/clinic/AgendaView';
import PatientList from '@/components/clinic/PatientList';
import RecallList from '@/components/clinic/RecallList';
import FinanceView from '@/components/clinic/FinanceView';
import BirthdayList from '@/components/clinic/BirthdayList';

export default function Index() {
  return (
    <ClinicProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-primary-foreground px-4 py-5">
          <h1 className="font-display text-xl font-bold tracking-tight">
            Salles Ateliê Odontológico
          </h1>
          <p className="text-sm opacity-80 mt-0.5">Sistema de gestão</p>
        </header>

        {/* Main Content */}
        <Tabs defaultValue="agenda" className="px-4 py-4">
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="agenda" className="gap-1.5 text-xs sm:text-sm">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="pacientes" className="gap-1.5 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Pacientes</span>
            </TabsTrigger>
            <TabsTrigger value="retorno" className="gap-1.5 text-xs sm:text-sm">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Retorno</span>
            </TabsTrigger>
            <TabsTrigger value="aniversario" className="gap-1.5 text-xs sm:text-sm">
              <Cake className="h-4 w-4" />
              <span className="hidden sm:inline">Aniversário</span>
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-1.5 text-xs sm:text-sm">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agenda">
            <AgendaView />
          </TabsContent>
          <TabsContent value="pacientes">
            <PatientList />
          </TabsContent>
          <TabsContent value="retorno">
            <RecallList />
          </TabsContent>
          <TabsContent value="aniversario">
            <BirthdayList />
          </TabsContent>
          <TabsContent value="financeiro">
            <FinanceView />
          </TabsContent>
        </Tabs>
      </div>
    </ClinicProvider>
  );
}

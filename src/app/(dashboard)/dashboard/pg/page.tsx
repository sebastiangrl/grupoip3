import { Metadata } from 'next';
import { PGDashboard } from '@/components/dashboard/PGDashboard';

export const metadata: Metadata = {
  title: 'Pérdidas y Ganancias | GrupoIP3 Dashboard',
  description: 'Estado de Pérdidas y Ganancias con datos en tiempo real desde SIIGO',
};

export default function PGPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PGDashboard />
    </div>
  );
}

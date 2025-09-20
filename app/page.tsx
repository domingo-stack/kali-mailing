// app/page.tsx
'use client'

import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link';

// 1. Definimos la estructura de los datos que mostraremos
type CampaignMetric = {
  id: number;
  name: string;
  status: 'sent' | 'draft';
  sent_at: string;
  recipient_count: number;
  open_rate: number;
  click_rate: number;
};

// 2. Creamos un array de datos de prueba
const mockCampaigns: CampaignMetric[] = [
  {
    id: 1,
    name: 'Newsletter Septiembre',
    status: 'sent',
    sent_at: '2025-09-18',
    recipient_count: 150234,
    open_rate: 22.5,
    click_rate: 3.1
  },
  {
    id: 2,
    name: 'Promoción Fin de Verano',
    status: 'sent',
    sent_at: '2025-09-12',
    recipient_count: 280112,
    open_rate: 18.9,
    click_rate: 2.5
  },
  {
    id: 3,
    name: 'Lanzamiento Nueva Feature',
    status: 'draft',
    sent_at: '',
    recipient_count: 0,
    open_rate: 0,
    click_rate: 0
  },
];


export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#383838]">
            Dashboard de Campañas
          </h1>
          <Link 
            href="/campaigns/create"
            className="bg-[#ff8080] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
          >
            Crear Nueva Campaña
          </Link>
        </div>

        {/* 3. Creamos la tabla para mostrar las métricas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaña</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enviados</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa de Apertura</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa de Clics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{campaign.name}</div>
                    <div className="text-xs text-gray-500">
                      {campaign.status === 'sent' 
                        ? `Enviada el ${new Date(campaign.sent_at).toLocaleDateString()}` 
                        : 'Borrador'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{campaign.recipient_count.toLocaleString('es-CL')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{campaign.open_rate.toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{campaign.click_rate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGuard>
  );
}
// En: app/campaigns/stats/[campaignId]/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Definimos nuestros tipos de datos ---
type CampaignDetails = {
  name: string;
  subject: string;
  sent_at: string;
};
type Stats = {
  opens: number;
  clicks: number;
  bounces: number;
  complaints: number;
};
type ClickReport = {
  link_url: string;
  total_clicks: number;
};

// --- Un componente más estilizado para las tarjetas de estadísticas ---
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function CampaignStatsPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const { supabase } = useAuth();

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<CampaignDetails | null>(null);
  const [stats, setStats] = useState<Stats>({ opens: 0, clicks: 0, bounces: 0, complaints: 0 });
  const [clickReport, setClickReport] = useState<ClickReport[]>([]);

  // Reemplaza tu useEffect completo en page.tsx con esto:

useEffect(() => {
    const fetchData = async () => {
      if (!supabase || !campaignId) return;

      setLoading(true);

      // 1. Definimos todas nuestras tareas de búsqueda de datos
      const detailsQuery = supabase.from('campaigns').select('name, subject, sent_at').eq('id', campaignId).single();
      const opensQuery = supabase.from('campaign_opens').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId);
      const clicksQuery = supabase.from('campaign_clicks').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId);
      const bouncesQuery = supabase.from('campaign_bounces').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId);
      const complaintsQuery = supabase.from('campaign_complaints').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId);
      const clickReportQuery = supabase.rpc('get_click_report', { campaign_id_param: parseInt(campaignId) });

      // 2. Ejecutamos todas las tareas en paralelo
      const [
        detailsResult, 
        opensResult, 
        clicksResult, // El resultado
        bouncesResult, 
        complaintsResult, 
        clickReportResult
      ] = await Promise.all([
          detailsQuery, 
          opensQuery, 
          clicksQuery, // La tarea (Query) - ¡CORREGIDO!
          bouncesQuery, 
          complaintsQuery, 
          clickReportQuery
      ]);

      // 3. Actualizamos los estados con los resultados
      if (detailsResult.data) setDetails(detailsResult.data);
      setStats({
        opens: opensResult.count ?? 0,
        clicks: clicksResult.count ?? 0,
        bounces: bouncesResult.count ?? 0,
        complaints: complaintsResult.count ?? 0
      });
      if (clickReportResult.data) setClickReport(clickReportResult.data);
      
      setLoading(false);
    };

    fetchData();
  }, [supabase, campaignId]);
  if (loading) {
    return <div className="p-8 text-center">Cargando estadísticas...</div>;
  }
  if (!details) {
    return <div className="p-8 text-center text-red-500">No se pudo encontrar la campaña.</div>;
  }

  // --- JSX inspirado en tus capturas ---
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Cabecera */}
      <header className="mb-8">
        <p className="text-sm text-gray-500">Reporte de Campaña</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900">{details.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">Enviada</span>
            <span className="text-xs text-gray-500">
              {format(new Date(details.sent_at), "d 'de' LLLL, yyyy 'a las' p", { locale: es })}
            </span>
          </div>
        </div>
        <p className="text-gray-600 mt-1">Asunto: {details.subject}</p>
      </header>

      {/* Tarjetas de Estadísticas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Aperturas" value={stats.opens} />
        <StatCard label="Clics" value={stats.clicks} />
        <StatCard label="Tasa de Apertura" value={`${stats.opens > 0 ? ((stats.opens / (stats.opens + stats.bounces)) * 100).toFixed(2) : 0}%`} />
        <StatCard label="Tasa de Clics" value={`${stats.clicks > 0 ? ((stats.clicks / stats.opens) * 100).toFixed(2) : 0}%`} />
        <StatCard label="Rebotes" value={stats.bounces} />
        <StatCard label="Quejas" value={stats.complaints} />
      </div>
      
      {/* PRÓXIMAMENTE: Aquí irá el gráfico de rendimiento. */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8 text-center text-gray-400">
          Gráfico de Actividad (Próximamente)
                </div>

      {/* Reporte de Clics */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Reporte de Clics</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enlace (URL)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clics Totales</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clickReport.length > 0 ? (
                clickReport.map((link, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 max-w-lg">
                      <a href={link.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">
                        {link.link_url}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-semibold">{link.total_clicks}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-500">Aún no se han registrado clics para esta campaña.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
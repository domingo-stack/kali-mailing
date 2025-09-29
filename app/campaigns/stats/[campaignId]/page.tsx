// En: app/campaigns/stats/[campaignId]/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CampaignActivityChart from '../../../../components/CampaignActivityChart';

// --- NUEVA FUNCIÓN HELPER PARA LOS PORCENTAJES ---
const formatPercentage = (value: number) => {
  if (isNaN(value) || !isFinite(value)) return '0';
  if (value === 100) return '100';
  return value.toFixed(2);
};

// --- Tipos de datos ---
type CampaignDetails = { name: string; subject: string; sent_at: string; recipients_count: number };
type Stats = { opens: number; clicks: number; bounces: number; complaints: number; delivered: number; };
type ClickReport = { url: string; total_clicks: number; }; // Corregido a 'url'
type ChartData = { day: string; opens: number; clicks: number; };

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
      {/* Tamaño de fuente ajustado en las tarjetas */}
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function CampaignStatsPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const { supabase } = useAuth();

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<CampaignDetails | null>(null);
  const [stats, setStats] = useState<Stats>({ opens: 0, clicks: 0, bounces: 0, complaints: 0, delivered: 0 });
  const [clickReport, setClickReport] = useState<ClickReport[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [error, setError] = useState<string | null>(null); // Estado de error que faltaba

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase || !campaignId) return;
      setLoading(true);
      setError(null);

      try {
        const detailsQuery = supabase.from('campaigns').select('name, subject, sent_at, recipients_count').eq('id', campaignId).single();
        const opensQuery = supabase.from('campaign_opens').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId);
        const clicksQuery = supabase.from('campaign_clicks').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId);
        const bouncesQuery = supabase.from('campaign_bounces').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId);
        const complaintsQuery = supabase.from('campaign_complaints').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId);
        const clickReportQuery = supabase.rpc('get_click_report', { campaign_id_param: parseInt(campaignId) });
        const chartDataQuery = supabase.rpc('get_daily_stats', { campaign_id_param: parseInt(campaignId) });

        const results = await Promise.all([
          detailsQuery, opensQuery, clicksQuery, bouncesQuery, complaintsQuery, clickReportQuery, chartDataQuery
        ]);

        for (const result of results) {
          // Ignorar el error específico que Supabase devuelve cuando una RPC no encuentra filas
          if (result.error && (result.error as any).code !== 'PGRST116') {
             throw new Error(`Error en la consulta: ${result.error.message}`);
          }
        }
        
        const [
          detailsResult, opensResult, clicksResult, bouncesResult, complaintsResult, clickReportResult, chartResult
        ] = results;

        if (detailsResult.data) setDetails(detailsResult.data);
        
        // CORRECCIÓN: 'delivered' debe calcularse correctamente
        const deliveredCount = (opensResult.count ?? 0) + (bouncesResult.count ?? 0); // Una aproximación inicial

        setStats({
          opens: opensResult.count ?? 0,
          clicks: clicksResult.count ?? 0,
          bounces: bouncesResult.count ?? 0,
          complaints: complaintsResult.count ?? 0,
          delivered: deliveredCount
        });

        if (clickReportResult.data) setClickReport(clickReportResult.data);
        if (chartResult.data) setChartData(chartResult.data);
      } catch (e) {
        const errorMessage = (e as Error).message;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase, campaignId]);

  if (loading) { return <div className="p-8 text-center">Cargando estadísticas...</div>; }
  if (error) { return <div className="p-8 text-center text-red-500"><h2 className="text-xl font-bold">¡Oops! Hubo un error</h2><p className="mt-2">{error}</p></div>; }
  if (!details) { return <div className="p-8 text-center text-red-500">No se pudo encontrar la campaña.</div>; }

  // CORRECCIÓN: La tasa de apertura se calcula sobre los entregados, la de clics sobre las aperturas.
  const openRate = stats.delivered > 0 ? (stats.opens / stats.delivered) * 100 : 0;
  const clickRate = stats.opens > 0 ? (stats.clicks / stats.opens) * 100 : 0;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
  <div className="flex flex-wrap items-center justify-between gap-2">
    <div>
      <p className="text-sm text-gray-500">Reporte de Campaña</p>
      <h1 className="text-2xl font-bold text-gray-900 mt-1">{details.name}</h1>
      <p className="text-sm text-gray-600 mt-1">Asunto: {details.subject}</p>
    </div>
    <div className="text-xs text-gray-500 text-right">
      <span className="font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">Enviada</span>
      <p className="mt-1">{format(new Date(details.sent_at), "d MMM, yyyy 'a las' p", { locale: es })}</p>
    </div>
  </div>
  
  <div className="border-t border-gray-200 mt-4 pt-4 flex items-center space-x-6 md:space-x-8">
    <div className="text-center">
      <p className="text-2xl font-semibold text-[#3c527a]">{details.recipients_count ?? 0}</p>
      <p className="text-xs text-gray-500 uppercase">Destinatarios</p>
    </div>
    <div className="text-center">
      <p className="text-2xl font-semibold text-[#3c527a]">{stats.opens}</p>
      <p className="text-xs text-gray-500 uppercase">Aperturas</p>
    </div>
    <div className="text-center">
      <p className="text-2xl font-semibold text-[#3c527a]">{stats.clicks}</p>
      <p className="text-xs text-gray-500 uppercase">Clics</p>
    </div>
  </div>
</header>

<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
  <StatCard label="Tasa de Apertura" value={`${formatPercentage(openRate)}%`} />
  <StatCard label="Tasa de Clics" value={`${formatPercentage(clickRate)}%`} />
  <StatCard label="Rebotes" value={stats.bounces} />
  <StatCard label="Quejas" value={stats.complaints} />
</div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Actividad de la Campaña</h2>
          <CampaignActivityChart data={chartData} />
      </div>

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
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">
                        {link.url}
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
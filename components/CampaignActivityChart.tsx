// En: components/CampaignActivityChart.tsx
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ChartData = {
  day: string;
  opens: number;
  clicks: number;
};

export default function CampaignActivityChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No hay suficientes datos para mostrar el gráfico.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="opens" stroke="#8884d8" name="Aperturas" />
        <Line type="monotone" dataKey="clicks" stroke="#82ca9d" name="Clics" />
      </LineChart>
    </ResponsiveContainer>
  );
}
import React, { useState } from 'react';
import { TrendPoint, TrendsSummary } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Eye, Table } from 'lucide-react';

interface TrendsChartProps {
  history: TrendPoint[];
  forecast: TrendPoint[];
  summary: TrendsSummary;
}

export const TrendsChart: React.FC<TrendsChartProps> = ({ history, forecast, summary }) => {
  const [showDataTable, setShowDataTable] = useState(false);

  // Combine history and forecast into one sequential time series
  const chartData = [
    ...history.map((pt) => ({
      time: new Date(pt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullTime: pt.time,
      historyAqi: pt.aqi,
      forecastAqi: null,
      pm2_5: pt.pm2_5,
      pm10: pt.pm10
    })),
    // Bridge point: last history point also becomes start of forecast line to avoid visual gap
    ...(history.length > 0 && forecast.length > 0
      ? [
          {
            time: new Date(history[history.length - 1].time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
            fullTime: history[history.length - 1].time,
            historyAqi: history[history.length - 1].aqi,
            forecastAqi: history[history.length - 1].aqi,
            pm2_5: history[history.length - 1].pm2_5,
            pm10: history[history.length - 1].pm10
          }
        ]
      : []),
    ...forecast.map((pt) => ({
      time: new Date(pt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullTime: pt.time,
      historyAqi: null,
      forecastAqi: pt.aqi,
      pm2_5: pt.pm2_5,
      pm10: pt.pm10
    }))
  ];

  const getDirectionBadge = () => {
    switch (summary.direction) {
      case 'improving':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Improving Trend</span>
          </span>
        );
      case 'deteriorating':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Deteriorating Trend</span>
          </span>
        );
      case 'stable':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Relatively Stable</span>
          </span>
        );
    }
  };

  return (
    <section aria-labelledby="trends-heading" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 id="trends-heading" className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Air Quality Trajectory & 24h Forecast</span>
          </h2>
          <p className="text-xs text-slate-500">
            Hourly continuous atmospheric model data (Past 24 hours & Upcoming 24 hours)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {getDirectionBadge()}
          <button
            type="button"
            onClick={() => setShowDataTable(!showDataTable)}
            className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-expanded={showDataTable}
            aria-controls="accessible-trends-table"
          >
            {showDataTable ? <Eye className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
            <span>{showDataTable ? 'Show Chart' : 'Show Data Table'}</span>
          </button>
        </div>
      </div>

      {/* Accessible Text Summary (WCAG requirement) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
        <p className="font-semibold text-slate-900 mb-1">Accessible Trajectory Summary:</p>
        <p>{summary.accessibleSummary}</p>
        <div className="mt-2 flex flex-wrap gap-4 text-slate-600">
          <span>Minimum AQI: <strong>{summary.minAqi ?? '--'}</strong></span>
          <span>Average AQI: <strong>{summary.avgAqi ?? '--'}</strong></span>
          <span>Peak AQI: <strong>{summary.maxAqi ?? '--'}</strong></span>
        </div>
      </div>

      {/* Chart View or Data Table Alternative */}
      {!showDataTable ? (
        <div className="h-72 w-full pt-2" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 'auto']} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line
                type="monotone"
                dataKey="historyAqi"
                name="Past Hours (Model Reanalysis)"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="forecastAqi"
                name="Forecast Hours (Model Prediction)"
                stroke="#9333ea"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div id="accessible-trends-table" className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-bold text-slate-700">Timestamp</th>
                <th scope="col" className="px-4 py-2.5 font-bold text-slate-700">Type</th>
                <th scope="col" className="px-4 py-2.5 font-bold text-slate-700">CPCB AQI</th>
                <th scope="col" className="px-4 py-2.5 font-bold text-slate-700">PM2.5 (µg/m³)</th>
                <th scope="col" className="px-4 py-2.5 font-bold text-slate-700">PM10 (µg/m³)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {chartData.map((pt, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-800">{pt.fullTime}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {pt.forecastAqi !== null ? 'Forecast' : 'Past Model'}
                  </td>
                  <td className="px-4 py-2 font-semibold text-slate-900">
                    {pt.forecastAqi ?? pt.historyAqi ?? '--'}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{pt.pm2_5 ?? '--'}</td>
                  <td className="px-4 py-2 text-slate-600">{pt.pm10 ?? '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default TrendsChart;

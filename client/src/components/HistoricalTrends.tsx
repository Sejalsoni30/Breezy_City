import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, Table as TableIcon, Sparkles } from 'lucide-react';

interface HistoricalTrendsProps {
  latitude: number;
  longitude: number;
}

interface TrendDayItem {
  date: string;
  avgPm25: number | null;
  avgPm10: number | null;
  aqi: number | null;
  category: string | null;
}

interface TrendApiResponse {
  days: number;
  series: TrendDayItem[];
}

export const HistoricalTrends: React.FC<HistoricalTrendsProps> = ({ latitude, longitude }) => {
  const [days, setDays] = useState<7 | 30>(7);
  const [series, setSeries] = useState<TrendDayItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTrends = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/historical-trends?lat=${latitude}&lon=${longitude}&days=${days}`);
        if (!res.ok) throw new Error('Failed to fetch historical trends');
        const data: TrendApiResponse = await res.json();
        if (isMounted) {
          setSeries(data.series || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('[HistoricalTrends] Error fetching data:', err);
          setError('Historical records could not be loaded.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTrends();
    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, days]);

  // Derived Summary Statistics
  const validAqis = series.filter((d) => d.aqi != null).map((d) => d.aqi as number);
  const minAqi = validAqis.length > 0 ? Math.min(...validAqis) : null;
  const maxAqi = validAqis.length > 0 ? Math.max(...validAqis) : null;
  const validPm25 = series.filter((d) => d.avgPm25 != null).map((d) => d.avgPm25 as number);
  const avgPm25Val =
    validPm25.length > 0 ? Math.round(validPm25.reduce((a, b) => a + b, 0) / validPm25.length) : null;

  return (
    <section
      aria-labelledby="historical-trends-title"
      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5"
    >
      {/* Header and Interval Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="historical-trends-title" className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <span>Historical AQI Trends & Analytics</span>
              <Sparkles className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
            </h2>
            <p className="text-xs text-slate-600">
              Interactive multi-day atmospheric particulate history and daily mean AQI progression
            </p>
          </div>
        </div>

        {/* 7-Day vs 30-Day Toggle & Table View Toggle */}
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Trend duration interval"
            className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50"
          >
            <button
              type="button"
              onClick={() => setDays(7)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                days === 7 ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-pressed={days === 7}
            >
              Past 7 Days
            </button>
            <button
              type="button"
              onClick={() => setDays(30)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                days === 30 ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-pressed={days === 30}
            >
              Past 30 Days
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowTable((prev) => !prev)}
            aria-expanded={showTable}
            aria-controls="historical-data-table"
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Toggle Accessible Data Table"
          >
            <TableIcon className="w-3.5 h-3.5 mr-1 text-slate-500" aria-hidden="true" />
            <span>{showTable ? 'Chart View' : 'Table View'}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
            Lowest (Cleanest) AQI
          </div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">
            {minAqi ?? '—'}
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">Best atmospheric day in period</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
            Peak (Worst) AQI
          </div>
          <div className="text-xl font-extrabold text-rose-700 mt-1">
            {maxAqi ?? '—'}
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">Peak particulate burden detected</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
            Mean PM2.5 Level
          </div>
          <div className="text-xl font-extrabold text-indigo-700 mt-1">
            {avgPm25Val ? `${avgPm25Val} µg/m³` : '—'}
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">Average inhalable fine particle mass</p>
        </div>
      </div>

      {/* Chart Visualization or Accessible Table */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 animate-pulse">
          Loading historical trends data...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error}
        </div>
      ) : showTable ? (
        /* WCAG Accessible Data Table */
        <div id="historical-data-table" className="overflow-x-auto">
          <table className="min-w-full text-xs text-left border-collapse border border-slate-200">
            <caption className="sr-only">
              Historical air quality data for the past {days} days
            </caption>
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                <th scope="col" className="px-3 py-2 border-r border-slate-200">Date</th>
                <th scope="col" className="px-3 py-2 border-r border-slate-200">Estimated AQI</th>
                <th scope="col" className="px-3 py-2 border-r border-slate-200">Category</th>
                <th scope="col" className="px-3 py-2 border-r border-slate-200">Avg PM2.5 (µg/m³)</th>
                <th scope="col" className="px-3 py-2">Avg PM10 (µg/m³)</th>
              </tr>
            </thead>
            <tbody>
              {series.map((row, idx) => (
                <tr
                  key={row.date}
                  className={`border-b border-slate-200 hover:bg-slate-50 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-slate-900 border-r border-slate-200">
                    {row.date}
                  </td>
                  <td className="px-3 py-2 font-bold text-blue-700 border-r border-slate-200">
                    {row.aqi ?? 'N/A'}
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-800">
                      {row.category ?? 'Unrated'}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200 text-slate-700">
                    {row.avgPm25 ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {row.avgPm10 ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Recharts Interactive Visualizer */
        <div
          role="region"
          aria-label="Historical AQI Trend Chart"
          tabIndex={0}
          className="w-full h-72 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val: string) => {
                  const parts = val.split('-');
                  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                domain={[0, 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as TrendDayItem;
                    return (
                      <div className="bg-slate-900 text-white rounded-lg p-2.5 shadow-lg text-xs space-y-1">
                        <div className="font-semibold text-slate-300">{label}</div>
                        <div className="text-sm font-bold text-blue-400">
                          AQI: {d.aqi ?? 'N/A'} {d.category ? `(${d.category})` : ''}
                        </div>
                        <div className="text-[11px] text-slate-300 flex justify-between gap-4">
                          <span>PM2.5: {d.avgPm25 ?? '—'} µg/m³</span>
                          <span>PM10: {d.avgPm10 ?? '—'} µg/m³</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: '11px', color: '#475569' }}
              />
              <Area
                type="monotone"
                dataKey="aqi"
                name="CPCB AQI"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#aqiGradient)"
              />
              <Line
                type="monotone"
                dataKey="avgPm25"
                name="Avg PM2.5"
                stroke="#e11d48"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="avgPm10"
                name="Avg PM10"
                stroke="#d97706"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

export default HistoricalTrends;

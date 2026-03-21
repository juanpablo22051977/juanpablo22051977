import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  type: 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'waterfall';
  title?: string;
  data: Record<string, any>[];
  xKey?: string;
  yKeys?: string[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#d4a843'];

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #2d3a4f',
    padding: '20px',
    margin: '12px 0',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: '16px',
  },
};

export default function ChartRenderer({ chart }: { chart: ChartData }) {
  const { type, title, data, xKey = 'name', yKeys = ['value'] } = chart;

  const renderChart = () => {
    switch (type) {
      case 'bar':
      case 'waterfall':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4f" />
              <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #2d3a4f', borderRadius: '8px', color: '#f1f5f9' }} />
              <Legend />
              {yKeys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4f" />
              <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #2d3a4f', borderRadius: '8px', color: '#f1f5f9' }} />
              <Legend />
              {yKeys.map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4f" />
              <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #2d3a4f', borderRadius: '8px', color: '#f1f5f9' }} />
              <Legend />
              {yKeys.map((key, i) => (
                <Area key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} dataKey={yKeys[0]} nameKey={xKey} cx="50%" cy="50%" outerRadius={100} label>
                {data.map((_entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #2d3a4f', borderRadius: '8px', color: '#f1f5f9' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4f" />
              <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis dataKey={yKeys[0]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #2d3a4f', borderRadius: '8px', color: '#f1f5f9' }} />
              <Scatter data={data} fill={COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return <p style={{ color: '#94a3b8' }}>Tipo de gráfico no soportado: {type}</p>;
    }
  };

  return (
    <div style={styles.container}>
      {title && <div style={styles.title}>{title}</div>}
      {renderChart()}
    </div>
  );
}

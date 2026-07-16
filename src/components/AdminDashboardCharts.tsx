'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface ChartProps {
  statusData: { name: string; value: number }[];
  domainData: { name: string; count: number }[];
}

export default function AdminDashboardCharts({ statusData, domainData }: ChartProps) {
  const COLORS = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Question Status Pie Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-border">
        <h3 className="text-base font-semibold mb-4 text-brand-text">Question Repository Breakdown</h3>
        <div className="h-64">
          {statusData.every(d => d.value === 0) ? (
            <div className="h-full flex items-center justify-center text-brand-muted text-sm italic">
              No questions submitted yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {statusData.filter(d => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', borderColor: '#222', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Domain Distribution Bar Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-border">
        <h3 className="text-base font-semibold mb-4 text-brand-text">Interns by Domain / Branch</h3>
        <div className="h-64">
          {domainData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-brand-muted text-sm italic">
              No interns registered in the system
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainData}>
                <XAxis dataKey="name" stroke="#888" tickLine={false} axisLine={false} />
                <YAxis stroke="#888" tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#111', borderColor: '#222', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#c5a85c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

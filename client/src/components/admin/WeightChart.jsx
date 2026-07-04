import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '12px 16px', boxShadow: 'var(--shadow)',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>{label}</p>
      <p style={{ color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 700 }}>
        {payload[0].value} kg
      </p>
    </div>
  );
}

export default function WeightChart({ data = [], goalWeight }) {
  if (!data.length) {
    return (
      <div className="empty-state" style={{ padding: '40px' }}>
        <p className="text-muted">No weight data yet</p>
      </div>
    );
  }

  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const weights = data.map(d => d.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const padding = Math.max((maxW - minW) * 0.2, 2);

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date" tick={{ fill: '#7d8590', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
          />
          <YAxis
            domain={[Math.floor(minW - padding), Math.ceil(maxW + padding)]}
            tick={{ fill: '#7d8590', fontSize: 12 }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          {goalWeight && (
            <ReferenceLine
              y={goalWeight} stroke="#f59e0b" strokeDasharray="6 4"
              label={{ value: `Goal: ${goalWeight}kg`, position: 'right', fill: '#f59e0b', fontSize: 11 }}
            />
          )}
          <Area
            type="monotone" dataKey="weight" stroke="#00d4aa" strokeWidth={2.5}
            fill="url(#weightGradient)" dot={{ r: 4, fill: '#00d4aa', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#00d4aa', stroke: '#06080d', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

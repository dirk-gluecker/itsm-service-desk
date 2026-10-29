/**
 * ReportsPage.tsx - Admin reports and data visualization
 * Dashboard with charts: tickets per status, new tickets trend, avg resolution time, tickets per assignee
 */
import React, { useState, useMemo } from 'react';
import { useTickets, useUsers } from '../../hooks/api/useHooks';
import type { Ticket, User } from '../../types';
import { Card } from '@itsm/shared-components';

interface ReportData {
  ticketsPerStatus: Record<string, number>;
  newTicketsPerDay: { date: string; count: number }[];
  averageResolutionTime: number | null;
  ticketsPerAssignee: { name: string; count: number; id?: string }[];
}

// Date helper functions
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getDaysArray = (days: number): string[] => {
  const dates: string[] = [];
  const end = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
};

// Status labels matching the app's German locale
const STATUS_LABELS: Record<string, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  done: 'Erledigt',
};

// Color palette for charts
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

/**
 * Pie Chart Component using SVG
 */
const PieChart: React.FC<{ data: Record<string, number>; title: string }> = ({ data, title }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <Card title={title}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '40px 0' }}>
          Keine Daten verfügbar
        </div>
      </Card>
    );
  }

  let currentAngle = 0;
  const size = 200;
  const center = size / 2;
  const radius = 80;

  const slices = Object.entries(data).map(([status, count], index) => {
    const percentage = count / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Convert to radians and calculate points
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathD = angle >= 360
      ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius}`
      : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      pathD,
      color: CHART_COLORS[index % CHART_COLORS.length],
      label: STATUS_LABELS[status] || status,
      count,
      percentage: (percentage * 100).toFixed(1),
    };
  });

  return (
    <Card title={title}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.pathD}
              fill={slice.color}
              stroke="#fff"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {slices.map((slice, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <span style={{ width: '12px', height: '12px', backgroundColor: slice.color, borderRadius: '2px' }} />
              <span>{slice.label}: {slice.count} ({slice.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

/**
 * Line Chart Component using SVG
 */
const LineChart: React.FC<{ data: { date: string; count: number }[]; title: string }> = ({ data, title }) => {
  if (data.length === 0) {
    return (
      <Card title={title}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '40px 0' }}>
          Keine Daten verfügbar
        </div>
      </Card>
    );
  }

  const width = 400;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: height - padding - (d.count / maxCount) * chartHeight,
    date: d.date,
    count: d.count,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Create area fill
  const areaPath = `
    M ${points[0].x} ${height - padding}
    ${points.map(p => `L ${p.x} ${p.y}`).join(' ')}
    L ${points[points.length - 1].x} ${height - padding}
    Z
  `;

  return (
    <Card title={title}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={height - padding - ratio * chartHeight}
            x2={width - padding}
            y2={height - padding - ratio * chartHeight}
            stroke="var(--color-border-default)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="rgba(59, 130, 246, 0.1)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="2" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--color-primary)" />
            <text
              x={p.x}
              y={height - padding + 20}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-text-secondary)"
            >
              {new Date(p.date).getDate()}
            </text>
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-text-primary)"
            >
              {p.count}
            </text>
          </g>
        ))}

        {/* Y-axis label */}
        <text
          x={10}
          y={height / 2}
          transform={`rotate(-90, 10, ${height / 2})`}
          textAnchor="middle"
          fontSize="12"
          fill="var(--color-text-secondary)"
        >
          Tickets
        </text>
      </svg>
    </Card>
  );
};

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{ title: string; value: string | number; subtitle?: string }> = ({ title, value, subtitle }) => (
  <Card>
    <div style={{ padding: 'var(--spacing-md)' }}>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
        {title}
      </div>
      <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
          {subtitle}
        </div>
      )}
    </div>
  </Card>
);

/**
 * Horizontal Bar Chart Component using CSS/SVG
 */
const HorizontalBarChart: React.FC<{ data: { name: string; count: number }[]; title: string }> = ({ data, title }) => {
  if (data.length === 0) {
    return (
      <Card title={title}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '40px 0' }}>
          Keine Daten verfügbar
        </div>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const barHeight = 30;
  const barSpacing = 12;
  const labelWidth = 120;

  return (
    <Card title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${barSpacing}px` }}>
        {data.slice(0, 8).map((item, index) => {
          const barWidth = (item.count / maxCount) * 100;
          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: `${labelWidth}px`,
                  fontSize: '13px',
                  color: 'var(--color-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={item.name}
              >
                {item.name}
              </div>
              <div
                style={{
                  flex: 1,
                  height: `${barHeight}px`,
                  backgroundColor: 'var(--color-border-default)',
                  borderRadius: 'var(--radius-sm)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${barWidth}%`,
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    borderRadius: 'var(--radius-sm)',
                    transition: 'width 0.3s ease',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fff',
                  }}
                >
                  {item.count}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default function ReportsPage() {
  const [days, setDays] = useState(30);
  const { data: ticketsResponse, isLoading, error, refetch } = useTickets({});
  const { data: users } = useUsers();

  // Process report data
  const reportData: ReportData = useMemo(() => {
    const tickets = ticketsResponse?.data || [];
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Filter tickets within date range for trend calculation
    const ticketsInRange = tickets.filter(t => 
      new Date(t.created_at) >= cutoffDate
    );

    // Tickets per status (all tickets)
    const ticketsPerStatus: Record<string, number> = {};
    tickets.forEach(t => {
      const status = t.status.toLowerCase();
      ticketsPerStatus[status] = (ticketsPerStatus[status] || 0) + 1;
    });

    // New tickets per day (last N days)
    const daysArray = getDaysArray(days);
    const newTicketsPerDay = daysArray.map(date => ({
      date,
      count: ticketsInRange.filter(t => t.created_at.startsWith(date)).length,
    }));

    // Average resolution time (in hours)
    let averageResolutionTime: number | null = null;
    const resolvedTickets = tickets.filter(
      t => t.status.toLowerCase() === 'done' && t.updated_at !== t.created_at
    );
    if (resolvedTickets.length > 0) {
      const totalTimeMs = resolvedTickets.reduce((sum, t) => {
        const created = new Date(t.created_at).getTime();
        const updated = new Date(t.updated_at).getTime();
        return sum + (updated - created);
      }, 0);
      averageResolutionTime = Math.round((totalTimeMs / resolvedTickets.length) / (1000 * 60 * 60));
    }

    // Open tickets per assignee
    const openTickets = tickets.filter(t => 
      ['open', 'in_progress'].includes(t.status.toLowerCase())
    );
    const assigneeMap: Record<string, { name: string; count: number }> = {};
    openTickets.forEach(t => {
      if (t.assignee_id) {
        const user = users?.find(u => u.id === t.assignee_id);
        const key = t.assignee_id;
        if (!assigneeMap[key]) {
          assigneeMap[key] = {
            name: user?.name || user?.email || 'Unzugeschrieben',
            count: 0,
          };
        }
        assigneeMap[key].count++;
      }
    });
    const ticketsPerAssignee = Object.entries(assigneeMap)
      .map(([id, data]) => ({ ...data, id }))
      .sort((a, b) => b.count - a.count);

    return {
      ticketsPerStatus,
      newTicketsPerDay,
      averageResolutionTime,
      ticketsPerAssignee,
    };
  }, [ticketsResponse, users, days]);

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)' }}>
            Berichte & Analysen
          </h1>
          <p style={{ margin: 'var(--spacing-xs) 0 0', color: 'var(--color-text-secondary)' }}>
            Übersicht der Ticket-Daten und Kennzahlen
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{
              padding: 'var(--spacing-sm)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-default)',
              fontSize: 'var(--font-size-base)',
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
          >
            <option value={7}>Letzte 7 Tage</option>
            <option value={30}>Letzte 30 Tage</option>
            <option value={90}>Letzte 90 Tage</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-default)',
              fontSize: 'var(--font-size-base)',
              cursor: 'pointer',
              opacity: isLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isLoading ? 'Laden...' : 'Aktualisieren'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: 'var(--spacing-md)', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-default)', marginBottom: 'var(--spacing-lg)' }}>
          <p style={{ color: '#dc2626', margin: 0 }}>Fehler beim Laden der Daten: {(error as Error).message}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !reportData.ticketsPerStatus && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
          Lade Berichtsdaten...
        </div>
      )}

      {!isLoading && (
        <>
          {/* Key Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <MetricCard
              title="Offene Tickets"
              value={reportData.ticketsPerStatus['open'] || 0}
              subtitle="Aktuell offen"
            />
            <MetricCard
              title="In Bearbeitung"
              value={reportData.ticketsPerStatus['in_progress'] || 0}
              subtitle="Aktiv bearbeitet"
            />
            <MetricCard
              title="Ticket-Laufzeit"
              value={reportData.averageResolutionTime !== null ? `${reportData.averageResolutionTime}h` : '-'}
              subtitle="Ø Zeit von Open bis Done"
            />
            <MetricCard
              title="Neue Tickets"
              value={reportData.newTicketsPerDay.reduce((sum, d) => sum + d.count, 0)}
              subtitle={`Letzte ${days} Tage`}
            />
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
            <PieChart data={reportData.ticketsPerStatus} title="Tickets pro Status" />
            <LineChart data={reportData.newTicketsPerDay} title={`Neue Tickets pro Tag (letzte ${days} Tage)`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <HorizontalBarChart data={reportData.ticketsPerAssignee} title="Offene Tickets pro Zuweisung" />
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getAnalyticsSummary } from '../lib/api';

interface AnalyticsData {
  totalIssues: number;
  totalSosAlerts: number;
  totalIncidents: number;
  totalNotices: number;
  totalResources: number;
  totalVolunteers: number;
  totalUsers: number;
  issuesByStatus: Array<{ status: string; count: number }>;
  sosThisWeek: number;
  pendingVolunteers: number;
  unverifiedIncidents: number;
}

const statusColors: Record<string, string> = {
  submitted: '#3B82F6',
  acknowledged: '#F59E0B',
  in_progress: '#8B5CF6',
  resolved: '#10B981',
  rejected: '#EF4444',
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await getAnalyticsSummary() as AnalyticsData;
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#102A2A', margin: '0 0 8px' }}>
            Overview
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            Real-time summary of your ward management system
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
            Loading analytics...
          </div>
        )}

        {error && (
          <div style={{
            padding: '16px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            color: '#DC2626',
            marginBottom: '24px'
          }}>
            <strong>Error:</strong> {error}
            <button
              onClick={loadAnalytics}
              style={{
                marginLeft: '12px',
                padding: '4px 12px',
                background: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {analytics && (
          <>
            {/* Key Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              <MetricCard
                title="Total Issues"
                value={analytics.totalIssues}
                color="#3B82F6"
                icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
              <MetricCard
                title="Active SOS"
                value={analytics.totalSosAlerts}
                color="#EF4444"
                icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                subtitle={`${analytics.sosThisWeek} this week`}
              />
              <MetricCard
                title="Incidents"
                value={analytics.totalIncidents}
                color="#8B5CF6"
                icon="M13 10V3L4 14h7v7l9-11h-7z"
                subtitle={`${analytics.unverifiedIncidents} unverified`}
              />
              <MetricCard
                title="Users"
                value={analytics.totalUsers}
                color="#10B981"
                icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </div>

            {/* Secondary Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              <MetricCard
                title="Notices"
                value={analytics.totalNotices}
                color="#F59E0B"
                icon="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
              <MetricCard
                title="Resources"
                value={analytics.totalResources}
                color="#06B6D4"
                icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
              <MetricCard
                title="Volunteers"
                value={analytics.totalVolunteers}
                color="#EC4899"
                icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                subtitle={`${analytics.pendingVolunteers} pending`}
              />
            </div>

            {/* Issues by Status */}
            {analytics.issuesByStatus.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#102A2A', margin: '0 0 20px' }}>
                  Issues by Status
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analytics.issuesByStatus.map(({ status, count }) => (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: statusColors[status] || '#94A3B8'
                      }} />
                      <span style={{ flex: 1, fontSize: '14px', color: '#374151', textTransform: 'capitalize' }}>
                        {status.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#102A2A' }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function MetricCard({ title, value, color, icon, subtitle }: {
  title: string;
  value: number;
  color: string;
  icon: string;
  subtitle?: string;
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {title}
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#102A2A', margin: 0 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}
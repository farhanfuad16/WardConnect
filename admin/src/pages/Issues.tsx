import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getIssues, updateIssueStatus, resolvePhotoUrl } from '../lib/api';
import { timeAgoWithDate } from '../lib/time';

interface Issue {
  id: number;
  userId: number;
  wardId: number;
  category: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  landmark: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  wardName: string | null;
}

const STATUSES = ['submitted', 'acknowledged', 'in_progress', 'resolved', 'rejected'];

// Same palette used for the "Issues by Status" chart on the Overview page,
// kept consistent here.
const statusColors: Record<string, string> = {
  submitted: '#3B82F6',
  acknowledged: '#F59E0B',
  in_progress: '#8B5CF6',
  resolved: '#10B981',
  rejected: '#EF4444',
};

export default function Issues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadIssues();
    const interval = setInterval(() => loadIssues(true), 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const loadIssues = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params: any = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const data = await getIssues(params) as { issues: Issue[] };
      setIssues(data.issues || []);
      setError('');
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load issues');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await updateIssueStatus(id, status);
      await loadIssues(true);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 8px' }}>
              Issues
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
              Review citizen-reported issues and update their status
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'var(--surface)',
              color: 'var(--text-2)'
            }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            Loading issues...
          </div>
        )}

        {error && (
          <div style={{
            padding: '16px',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: '12px',
            color: 'var(--danger-text)',
            marginBottom: '24px'
          }}>
            <strong>Error:</strong> {error}
            <button
              onClick={() => loadIssues()}
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

        {!loading && !error && issues.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            background: 'var(--surface)',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '16px' }}>No issues found</p>
          </div>
        )}

        {issues.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {issues.map((issue) => (
              <div
                key={issue.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--ink)', margin: 0 }}>
                        {issue.title}
                      </h3>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: issue.severity === 'emergency' ? 'var(--danger-bg-2)' : 'var(--subtle-bg)',
                        color: issue.severity === 'emergency' ? '#DC2626' : 'var(--muted)',
                      }}>
                        {issue.severity}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-3)', margin: '0 0 10px', lineHeight: '1.5' }}>
                      {issue.description}
                    </p>
                    {issue.landmark && (
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                        📍 {issue.landmark}
                      </div>
                    )}
                    {resolvePhotoUrl(issue.photoUrl) && (
                      <a
                        href={resolvePhotoUrl(issue.photoUrl)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '12px', color: 'var(--link)', fontWeight: '600' }}
                      >
                        View photo
                      </a>
                    )}
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>
                      {issue.category} • {issue.userName || 'Unknown reporter'} • {issue.wardName || 'No ward'} • Reported {timeAgoWithDate(issue.createdAt)}
                      {issue.status !== 'submitted' && <> • Updated {timeAgoWithDate(issue.updatedAt)}</>}
                    </div>
                  </div>
                  <select
                    value={issue.status}
                    disabled={updatingId === issue.id}
                    onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: `1px solid ${statusColors[issue.status] || '#94A3B8'}`,
                      background: `${statusColors[issue.status] || '#94A3B8'}15`,
                      color: statusColors[issue.status] || 'var(--muted)',
                      cursor: updatingId === issue.id ? 'wait' : 'pointer',
                    }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
    </AdminLayout>
  );
}

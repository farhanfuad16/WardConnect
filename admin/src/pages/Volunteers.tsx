import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getVolunteers, updateVolunteer, deleteVolunteer, getIncidentVolunteers, updateIncidentVolunteer, deleteIncidentVolunteer } from '../lib/api';
import { timeAgoWithDate } from '../lib/time';

interface Volunteer {
  id: number;
  userId: number;
  wardId: number;
  skillsOrInterest: string;
  status: string;
  createdAt: string;
  userName: string;
  wardName: string;
}

interface IncidentVolunteer {
  id: number;
  incidentTitle: string;
  userName: string;
  homeWardName: string;
  note: string | null;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  approved: '#10B981',
  active: '#3B82F6',
  inactive: '#94A3B8',
};

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [incidentVolunteers, setIncidentVolunteers] = useState<IncidentVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '' });

  useEffect(() => {
    loadVolunteers();
    const interval = setInterval(() => loadVolunteers(true), 15000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadVolunteers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params: any = { limit: 50 };
      if (filter.status) params.status = filter.status;
      const data = await getVolunteers(params) as { volunteers: Volunteer[] };
      setVolunteers(data.volunteers || []);
      const incidentData = await getIncidentVolunteers() as { volunteers: IncidentVolunteer[] };
      setIncidentVolunteers(incidentData.volunteers || []);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load volunteers');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateVolunteer(id, { status: newStatus });
      loadVolunteers(true);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleIncidentStatusChange = async (id: number, status: 'approved' | 'declined') => {
    try {
      await updateIncidentVolunteer(id, status);
      await loadVolunteers(true);
    } catch (err: any) {
      alert(`Failed to update incident volunteer: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this volunteer?')) return;
    try {
      await deleteVolunteer(id);
      loadVolunteers();
    } catch (err: any) {
      alert(`Failed to remove: ${err.message}`);
    }
  };

  const handleIncidentDelete = async (id: number) => {
    if (!confirm('Remove this incident volunteer offer?')) return;
    try {
      await deleteIncidentVolunteer(id);
      await loadVolunteers(true);
    } catch (err: any) {
      alert(`Failed to remove offer: ${err.message}`);
    }
  };

  return (
    <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 8px' }}>
              Volunteers
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
              Manage volunteer applications and assignments
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              style={{
                padding: '10px 16px',
                border: '1px solid var(--border-strong)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--surface)',
                color: 'var(--text-2)'
              }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            Loading volunteers...
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
              onClick={() => loadVolunteers()}
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

        {incidentVolunteers.length > 0 && (
          <section style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {incidentVolunteers.map((volunteer) => (
                <div key={`incident-${volunteer.id}`} style={{ background: 'var(--surface)', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', flex: '1 1 220px', minWidth: 0 }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        flexShrink: 0,
                        borderRadius: '50%',
                        background: 'var(--success-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        color: '#10B981',
                        fontSize: '14px'
                      }}>
                        {volunteer.userName?.charAt(0) || '?'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--ink)', fontSize: '16px' }}>{volunteer.userName}</div>
                          <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize', background: `${statusColors[volunteer.status] || '#94A3B8'}20`, color: statusColors[volunteer.status] || '#94A3B8' }}>{volunteer.status === 'approved' ? 'Activated' : volunteer.status}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-2)', marginTop: '4px' }}>{volunteer.incidentTitle}</div>
                        {volunteer.note && <p style={{ fontSize: '14px', color: 'var(--text-3)', margin: '8px 0 0' }}>{volunteer.note}</p>}
                        <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>{volunteer.homeWardName} • Offered {timeAgoWithDate(volunteer.createdAt)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {volunteer.status === 'pending' && <>
                        <button onClick={() => handleIncidentStatusChange(volunteer.id, 'approved')} style={{ padding: '8px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => handleIncidentStatusChange(volunteer.id, 'declined')} style={{ padding: '8px 12px', background: 'var(--danger-bg-2)', color: 'var(--danger-text)', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Reject</button>
                      </>}
                      {volunteer.status === 'approved' && <span style={{ padding: '8px 12px', background: 'var(--success-bg)', color: '#10B981', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Activated</span>}
                      <button onClick={() => handleIncidentDelete(volunteer.id)} style={{ padding: '8px 12px', background: 'var(--danger-bg-2)', color: 'var(--danger-text)', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && volunteers.length === 0 && incidentVolunteers.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            background: 'var(--surface)',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '16px' }}>No volunteers found</p>
          </div>
        )}

        {volunteers.length > 0 && (
          <section>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {volunteers.map((volunteer) => (
              <div
                key={volunteer.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      flexShrink: 0,
                      borderRadius: '50%',
                      background: 'var(--success-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      color: '#10B981',
                      fontSize: '14px'
                    }}>
                      {volunteer.userName?.charAt(0) || '?'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--ink)', fontSize: '16px' }}>{volunteer.userName}</div>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          background: `${statusColors[volunteer.status] || '#94A3B8'}20`,
                          color: statusColors[volunteer.status] || '#94A3B8'
                        }}>
                          {volunteer.status === 'approved' || volunteer.status === 'active' ? 'Activated' : volunteer.status}
                        </span>
                      </div>
                      {volunteer.skillsOrInterest && (
                        <p style={{ fontSize: '14px', color: 'var(--text-3)', margin: '0 0 8px', lineHeight: '1.5' }}>
                          {volunteer.skillsOrInterest}
                        </p>
                      )}
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {volunteer.wardName} • Joined {timeAgoWithDate(volunteer.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {volunteer.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(volunteer.id, 'approved')}
                          style={{
                            padding: '8px 12px',
                            background: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(volunteer.id, 'inactive')}
                          style={{
                            padding: '8px 12px',
                            background: 'var(--danger-bg-2)',
                            color: 'var(--danger-text)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(volunteer.status === 'approved' || volunteer.status === 'active') && (
                      <span style={{ padding: '8px 12px', background: 'var(--success-bg)', color: '#10B981', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                        Activated
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(volunteer.id)}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--danger-bg-2)',
                        color: 'var(--danger-text)',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </section>
        )}
    </AdminLayout>
  );
}
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getVolunteers, updateVolunteer, deleteVolunteer } from '../lib/api';

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

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  approved: '#10B981',
  active: '#3B82F6',
  inactive: '#94A3B8',
};

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '' });

  useEffect(() => {
    loadVolunteers();
  }, [filter]);

  const loadVolunteers = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (filter.status) params.status = filter.status;
      const data = await getVolunteers(params) as { volunteers: Volunteer[] };
      setVolunteers(data.volunteers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateVolunteer(id, { status: newStatus });
      loadVolunteers();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#102A2A', margin: '0 0 8px' }}>
              Volunteers
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
              Manage volunteer applications and assignments
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              style={{
                padding: '10px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                color: '#374151'
              }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
            Loading volunteers...
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
              onClick={loadVolunteers}
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

        {!loading && volunteers.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ color: '#64748B', fontSize: '16px' }}>No volunteers found</p>
          </div>
        )}

        {volunteers.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={thStyle}>Volunteer</th>
                  <th style={thStyle}>Ward</th>
                  <th style={thStyle}>Skills / Interest</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Joined</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((volunteer) => (
                  <tr key={volunteer.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: '#F0FDF4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          color: '#10B981',
                          fontSize: '14px'
                        }}>
                          {volunteer.userName?.charAt(0) || '?'}
                        </div>
                        <div style={{ fontWeight: '500', color: '#102A2A' }}>{volunteer.userName}</div>
                      </div>
                    </td>
                    <td style={tdStyle}>{volunteer.wardName}</td>
                    <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {volunteer.skillsOrInterest || '—'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        background: `${statusColors[volunteer.status] || '#94A3B8'}20`,
                        color: statusColors[volunteer.status] || '#94A3B8'
                      }}>
                        {volunteer.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {new Date(volunteer.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {volunteer.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(volunteer.id, 'approved')}
                              style={{
                                padding: '6px 10px',
                                background: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(volunteer.id, 'inactive')}
                              style={{
                                padding: '6px 10px',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {volunteer.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(volunteer.id, 'active')}
                            style={{
                              padding: '6px 10px',
                              background: '#3B82F6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            Activate
                          </button>
                        )}
                        {volunteer.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(volunteer.id, 'inactive')}
                            style={{
                              padding: '6px 10px',
                              background: '#F3F4F6',
                              color: '#374151',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            Deactivate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(volunteer.id)}
                          style={{
                            padding: '6px 10px',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '600',
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  background: '#F9FAFB'
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '14px',
  color: '#374151'
};
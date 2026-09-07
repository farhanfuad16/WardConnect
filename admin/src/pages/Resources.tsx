import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getResources, createResource, updateResource, deleteResource } from '../lib/api';

interface Resource {
  id: number;
  name: string;
  category: string;
  contactInfo: string;
  address: string | null;
  wardName: string;
  createdAt: string;
}

const categoryIcons: Record<string, string> = {
  hospital: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  fire_station: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  police: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  shelter: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
};

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({ name: '', category: 'hospital', contactInfo: '', address: '' });
  const [filter, setFilter] = useState({ category: '' });

  useEffect(() => {
    loadResources();
  }, [filter]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (filter.category) params.category = filter.category;
      const data = await getResources(params) as { resources: Resource[] };
      setResources(data.resources || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateResource(editing.id, formData);
      } else {
        await createResource(formData);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', category: 'hospital', contactInfo: '', address: '' });
      loadResources();
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditing(resource);
    setFormData({
      name: resource.name,
      category: resource.category,
      contactInfo: resource.contactInfo,
      address: resource.address || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteResource(id);
      loadResources();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setFormData({ name: '', category: 'hospital', contactInfo: '', address: '' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#102A2A', margin: '0 0 8px' }}>
              Resources
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
              Manage emergency services and community resources
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              style={{
                padding: '10px 16px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                color: '#374151'
              }}
            >
              <option value="">All Categories</option>
              <option value="hospital">Hospital</option>
              <option value="fire_station">Fire Station</option>
              <option value="police">Police</option>
              <option value="shelter">Shelter</option>
            </select>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '10px 20px',
                background: '#0F766E',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + New Resource
            </button>
          </div>
        </div>

        {showForm && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#102A2A', margin: '0 0 20px' }}>
              {editing ? 'Edit Resource' : 'New Resource'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="hospital">Hospital</option>
                    <option value="fire_station">Fire Station</option>
                    <option value="police">Police</option>
                    <option value="shelter">Shelter</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Contact Info
                </label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Address (optional)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#0F766E',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '10px 20px',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
            Loading resources...
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
              onClick={loadResources}
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

        {!loading && resources.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ color: '#64748B', fontSize: '16px' }}>No resources found</p>
          </div>
        )}

        {resources.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={thStyle}>Resource</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Address</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((resource) => (
                  <tr key={resource.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: '#F0FDF4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d={categoryIcons[resource.category] || categoryIcons.hospital} />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontWeight: '500', color: '#102A2A' }}>{resource.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>{resource.wardName}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        background: '#F0FDF4',
                        color: '#10B981'
                      }}>
                        {resource.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={tdStyle}>{resource.contactInfo}</td>
                    <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {resource.address || '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleEdit(resource)}
                          style={{
                            padding: '6px 12px',
                            background: '#EFF6FF',
                            color: '#3B82F6',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
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
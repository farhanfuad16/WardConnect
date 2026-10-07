import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { deleteUser, getUsers } from '../lib/api';
import { timeAgoWithDate } from '../lib/time';

interface User {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  wardName: string | null;
  role: string;
  isAdmin: boolean;
  createdAt: string;
  lastSignedIn: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getUsers({ search: search.trim(), limit: 100 }) as { users: User[] };
        if (!cancelled) setUsers(data.users || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadUsers();
    return () => { cancelled = true; };
  }, [search, reloadToken]);

  const handleDelete = async (user: User) => {
    if (!confirm(`Remove ${user.name || 'this user'} from WardConnect?`)) return;
    try {
      await deleteUser(user.id);
      setReloadToken((token) => token + 1);
    } catch (err: any) {
      alert(`Failed to remove user: ${err.message}`);
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--ink)', margin: '0 0 8px' }}>Users</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>View registered users and their ward assignments</p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search users"
          aria-label="Search users"
          style={{ padding: '10px 14px', minWidth: '240px', border: '1px solid var(--border-strong)', borderRadius: '8px', fontSize: '14px', background: 'var(--surface)', color: 'var(--text-2)' }}
        />
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>Loading users...</div>}
      {error && <div style={{ padding: '16px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '12px', color: 'var(--danger-text)' }}>{error}</div>}

      {!loading && !error && users.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--surface)', borderRadius: '12px', color: 'var(--muted)' }}>
          No users found
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div style={{ background: 'var(--surface)', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['User', 'Contact', 'Ward', 'Role', 'Joined', 'Last signed in', ''].map((heading, index) => (
                  <th key={`${heading}-${index}`} style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--ink)' }}>{user.name || 'Unnamed user'}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '3px' }}>ID #{user.id}</div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-2)', fontSize: '13px' }}>
                    <div>{user.email || 'No email'}</div>
                    {user.phone && <div style={{ color: 'var(--muted)', marginTop: '3px' }}>{user.phone}</div>}
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-2)', fontSize: '13px' }}>{user.wardName || 'Unassigned'}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ padding: '4px 9px', borderRadius: '12px', background: user.isAdmin ? '#DBEAFE' : 'var(--btn-bg)', color: user.isAdmin ? '#2563EB' : 'var(--text-2)', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }}>{user.isAdmin ? 'Admin' : user.role}</span>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--muted)', fontSize: '13px' }}>{timeAgoWithDate(user.createdAt)}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--muted)', fontSize: '13px' }}>{timeAgoWithDate(user.lastSignedIn)}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(user)} style={{ padding: '8px 12px', background: 'var(--danger-bg-2)', color: 'var(--danger-text)', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

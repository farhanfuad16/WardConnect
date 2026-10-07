import { useEffect, useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';

const MOBILE_BREAKPOINT = 768;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setDrawerOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar
        isMobile={isMobile}
        isOpen={!isMobile || drawerOpen}
        onNavigate={() => setDrawerOpen(false)}
        onClose={() => setDrawerOpen(false)}
      />

      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            background: 'var(--sidebar-bg)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{ background: 'transparent', border: 'none', color: '#E2E8F0', cursor: 'pointer', padding: '4px', lineHeight: 0 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <strong style={{ color: '#5EEAD4', fontSize: '15px', fontWeight: 700 }}>WardConnect Admin</strong>
          </div>
        )}

        <main style={{ flex: 1, minWidth: 0, padding: isMobile ? '16px' : '32px', overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

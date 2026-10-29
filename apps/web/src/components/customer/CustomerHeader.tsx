/**
 * Customer Header with navigation and user info
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@shared/components';
import { useCurrentUser, useLogout } from '../../hooks/api/useHooks';

export const CustomerHeader: React.FC = () => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/login');
  };

  return (
    <header style={styles.header}>
      <div style={styles.logo} onClick={() => navigate('/my-tickets')} role="button">
        <span style={styles.logoText}>ITSM Portal</span>
      </div>
      
      <nav style={styles.nav}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/my-tickets')}>
          My Tickets
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/create-ticket')}>
          New Ticket
        </Button>
        
        {user && (
          <div style={styles.userMenu}>
            <span style={styles.userName}>{user.name || user.email}</span>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: 'var(--color-bg-surface)',
    borderBottom: '1px solid var(--color-border-default)',
  },
  logo: {
    cursor: 'pointer',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--color-primary)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: '16px',
    paddingTop: '12px',
    borderTop: '1px solid var(--color-border-default)',
  },
  userName: {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
  },
};

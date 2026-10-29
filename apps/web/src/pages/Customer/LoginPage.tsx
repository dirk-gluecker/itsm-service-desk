/**
 * Login Page - Customer login form
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/api/useHooks';
import { Button } from '@shared/components';
import { Input } from '@shared/components';
import { Card } from '@shared/components';
import type { ErrorResponse } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  
  const loginMutation = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await loginMutation.mutateAsync({ email, password });
      
      // Store auth data
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Redirect to tickets page
      navigate('/my-tickets');
    } catch (err: any) {
      const errorResponse = err.response?.data as ErrorResponse;
      setError(
        errorResponse?.error?.message || 
        'Invalid email or password'
      );
    }
  };

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <h1 style={styles.title}>Login</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            style={{ marginBottom: '16px' }}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            style={{ marginBottom: '24px' }}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={loginMutation.isPending}
          >
            Sign In
          </Button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Register here
          </Link>
        </p>
      </Card>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg-page)',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: 'var(--color-text-primary)',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    marginBottom: '24px',
    textAlign: 'center',
  },
  form: {
    marginTop: '24px',
  },
  errorBox: {
    backgroundColor: 'var(--color-priority-high-bg)',
    color: 'var(--color-priority-high-text)',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '16px',
    fontSize: '14px',
  },
  footerText: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
  },
  link: {
    color: 'var(--color-primary)',
    textDecoration: 'none',
    fontWeight: 500,
  },
};

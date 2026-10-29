/**
 * Register Page - Customer registration form with password validation
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegister } from '../hooks/api/useHooks';
import { Button, Input } from '@shared/components';
import { Card } from '@shared/components';
import type { ErrorResponse } from '../types';

// Password strength requirements
const PASSWORD_REQUIREMENTS = [
  { test: (p: string) => p.length >= 12, label: 'At least 12 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[@$!%*?&#\-_]/.test(p), label: 'One special character (@$!%*#?-_)' },
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');

  const registerMutation = useRegister();

  const getPasswordStrength = () => {
    return PASSWORD_REQUIREMENTS.filter(req => req.test(password)).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password strength client-side
    const missingRequirements = PASSWORD_REQUIREMENTS.filter(req => !req.test(password));
    if (missingRequirements.length > 0) {
      setError(`Password must have: ${missingRequirements.map(r => r.label).join(', ')}`);
      return;
    }

    try {
      const response = await registerMutation.mutateAsync({ name, email, password });
      
      // Store auth data and redirect to tickets page
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/my-tickets');
    } catch (err: any) {
      const errorResponse = err.response?.data as ErrorResponse;
      setError(
        errorResponse?.error?.message || 
        'Registration failed. Please try again.'
      );
    }
  };

  const passwordStrength = getPasswordStrength();
  const strengthPercent = (passwordStrength / PASSWORD_REQUIREMENTS.length) * 100;

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Register for the customer portal</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="John Doe"
            style={{ marginBottom: '16px' }}
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            style={{ marginBottom: '16px' }}
          />

          <div style={{ marginBottom: '16px' }}>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter a strong password"
            />
            
            {/* Password strength indicator */}
            <div style={styles.strengthBarContainer}>
              <div
                style={{
                  ...styles.strengthBar,
                  width: `${strengthPercent}%`,
                  backgroundColor: getStrengthColor(passwordStrength),
                }}
              />
            </div>
            
            {/* Password requirements checklist */}
            <div style={styles.requirementsList}>
              {PASSWORD_REQUIREMENTS.map((req, index) => (
                <div key={index} style={{ ...styles.requirementItem, opacity: req.test(password) ? 1 : 0.5 }}>
                  <span style={styles.checkmark}>{req.test(password) ? '✓' : '○'}</span>
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={registerMutation.isPending}
          >
            Create Account
          </Button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Sign in here
          </Link>
        </p>
      </Card>
    </div>
  );
};

function getStrengthColor(strength: number): string {
  if (strength <= 2) return '#DC2626'; // Red
  if (strength <= 4) return '#F59E0B'; // Amber
  return '#059669'; // Green
}

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
    maxWidth: '480px',
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
  strengthBarContainer: {
    height: '4px',
    backgroundColor: 'var(--color-neutral-200)',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    marginTop: '8px',
  },
  strengthBar: {
    height: '100%',
    transition: 'width 0.3s ease, background-color 0.3s ease',
  },
  requirementsList: {
    marginTop: '12px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  requirementItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
  },
  checkmark: {
    color: 'var(--color-success)',
    fontWeight: 'bold',
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

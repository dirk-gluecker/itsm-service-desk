import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@shared/components';

// Customer Portal Pages
import { LoginPage } from './pages/Customer/LoginPage';
import { RegisterPage } from './pages/Customer/RegisterPage';
import { MyTicketsPage } from './pages/Customer/MyTicketsPage';
import { CreateTicketPage } from './pages/Customer/CreateTicketPage';
import { TicketDetailPage } from './pages/Customer/TicketDetailPage';

// Staff routes (existing)
import StaffDashboard from './pages/Staff/Dashboard';
import StaffTickets from './pages/Staff/Tickets';
import ReportsPage from './pages/ReportsPage';

// Auth guards
import { AuthGuard, PublicRoute } from './lib/authGuard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Customer Portal Protected Routes */}
          <Route path="/my-tickets" element={<AuthGuard><MyTicketsPage /></AuthGuard>} />
          <Route path="/create-ticket" element={<AuthGuard><CreateTicketPage /></AuthGuard>} />
          <Route path="/tickets/:id" element={<AuthGuard><TicketDetailPage /></AuthGuard>} />

          {/* Staff Routes */}
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/tickets" element={<StaffTickets />} />
          <Route path="/staff/reports" element={<ReportsPage />} />
          <Route path="/staff/*" element={<Navigate to="/staff/dashboard" replace />} />
          
          {/* Root redirect - send customers to my-tickets */}
          <Route path="/" element={<Navigate to="/my-tickets" replace />} />
          
          {/* Catch all - 404 */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

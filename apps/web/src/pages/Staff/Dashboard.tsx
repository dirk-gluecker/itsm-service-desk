import { Link } from 'react-router-dom'

export default function StaffDashboard() {
  return (
    <div className="staff-dashboard">
      <h1>Staff Dashboard</h1>
      <nav>
        <ul>
          <li><Link to="/staff/tickets">View Tickets</Link></li>
          <li><Link to="/staff/reports">Reports & Analytics</Link></li>
          {/* Add more navigation items as needed */}
        </ul>
      </nav>
    </div>
  )
}

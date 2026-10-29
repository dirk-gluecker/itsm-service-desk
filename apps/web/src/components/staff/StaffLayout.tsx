interface StaffLayoutProps {
  children: React.ReactNode
}

export function StaffLayout({ children }: StaffLayoutProps) {
  return (
    <div className="staff-layout">
      <aside className="staff-sidebar">
        {/* Sidebar navigation will go here */}
      </aside>
      <main className="staff-main">
        {children}
      </main>
    </div>
  )
}

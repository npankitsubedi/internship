import { Building2, LayoutDashboard, ShieldCheck, Waypoints } from 'lucide-react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import InternshipForm from './pages/InternshipForm.jsx'

const navItems = [
  { to: '/', label: 'Submit Internship', icon: Building2 },
  { to: '/dashboard', label: 'Approval Dashboard', icon: LayoutDashboard },
]

function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen overflow-hidden bg-shell text-ink">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-90" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.88),transparent_72%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-halo backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ink/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-ink/70">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  VIT Internship Approval System
                </div>
                <h1 className="font-display text-4xl leading-none text-ink sm:text-5xl">
                  One route for CDC, Non-CDC, and every approval handoff.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-ink/70 sm:text-base">
                  Submit internship documents, trigger the correct approval ladder, and monitor the live queue for CDC,
                  guide, HoD, school office, and hostel clearance.
                </p>
              </div>

              <div className="grid gap-3 rounded-[1.5rem] bg-ink px-5 py-4 text-white sm:grid-cols-2 lg:min-w-[320px]">
                <div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Waypoints className="h-4 w-4" />
                    Workflow Engine
                  </div>
                  <p className="mt-2 text-lg font-semibold">All applications route to CDC first</p>
                </div>
                <div>
                  <p className="text-sm text-white/70">Branch logic</p>
                  <p className="mt-2 text-lg font-semibold">CDC to SW to Hostel or CDC to Guide to HoD to SW to Hostel</p>
                </div>
              </div>
            </div>

            <nav className="mt-6 flex flex-wrap gap-3">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    [
                      'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-ink text-white shadow-lg'
                        : 'border border-ink/10 bg-white text-ink/70 hover:border-ink/25 hover:text-ink',
                    ].join(' ')
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="mt-8 flex-1">
            <Routes>
              <Route path="/" element={<InternshipForm />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App

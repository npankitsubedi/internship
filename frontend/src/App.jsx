import { Building2, LayoutDashboard, LoaderCircle, RefreshCw, RotateCcw, ShieldCheck, Users2, Waypoints } from 'lucide-react'
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './components/Dashboard.jsx'
import InternshipForm from './components/InternshipForm.jsx'
import { useAuth } from './context/AuthContext.jsx'

const navItems = [
  { to: '/', label: 'Student Form', icon: Building2 },
  { to: '/dashboard', label: 'Approval Dashboard', icon: LayoutDashboard },
]

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

function AppShell() {
  const { currentUser, isBooting, isRefreshing, isSwitchingRole, refreshData, resetDemo, roleSwitcherUsers, switchRole } =
    useAuth()

  if (isBooting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-shell px-6">
        <div className="panel flex items-center gap-4 px-6 py-5 text-ink">
          <LoaderCircle className="h-5 w-5 animate-spin text-sea" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ink/45">Booting Demo</p>
            <p className="mt-1 text-sm text-ink/70">Restoring the mock workflow from localStorage.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-shell text-ink">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-90" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_72%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="panel overflow-hidden p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="eyebrow">
                <ShieldCheck className="h-4 w-4" />
                VIT Internship Approval System
              </div>
              <h1 className="mt-4 font-display text-4xl leading-none text-ink sm:text-6xl">
                A frontend-only workflow prototype that still feels operational.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/70 sm:text-base">
                The entire system is simulated in React Context and localStorage, including role switching, staged
                approvals, HoD credit warnings, and fake document uploads that survive a refresh.
              </p>

              <nav className="mt-6 flex flex-wrap gap-3">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      [
                        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
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
            </div>

            <div className="grid gap-4">
              <div className="panel-dark grid gap-4 sm:grid-cols-2">
                <StatCard icon={Waypoints} label="CDC Flow" value="Student -> CDC -> SW -> Hostel" />
                <StatCard icon={Users2} label="Non-CDC Flow" value="Student -> CDC -> Guide -> HoD -> SW -> Hostel" />
              </div>

              <div className="rounded-[1.75rem] border border-ink/10 bg-shell/80 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">Role Switcher</p>
                    <p className="mt-2 text-sm text-ink/65">Switch mock roles instantly to demo the entire approval ladder.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {roleSwitcherUsers.map((user) => (
                      <button
                        key={user.id}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          currentUser?.id === user.id
                            ? 'bg-ink text-white'
                            : 'border border-ink/10 bg-white text-ink/70 hover:border-ink/25 hover:text-ink'
                        }`}
                        disabled={isSwitchingRole}
                        onClick={() => void switchRole(user.role)}
                        type="button"
                      >
                        {isSwitchingRole && currentUser?.id !== user.id ? <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" /> : null}
                        {user.role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_auto]">
            <div className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">Current Mock Session</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  {currentUser?.role}
                </span>
                <p className="text-lg font-semibold text-ink">{currentUser?.name}</p>
                <p className="text-sm text-ink/60">{currentUser?.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="secondary-btn" disabled={isRefreshing} onClick={() => void refreshData()} type="button">
                {isRefreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh data
              </button>
              <button className="secondary-btn" disabled={isRefreshing} onClick={() => void resetDemo()} type="button">
                <RotateCcw className="h-4 w-4" />
                Reset demo
              </button>
            </div>
          </div>
        </header>

        <main className="mt-8 flex-1">
          <Routes>
            <Route element={<InternshipForm />} path="/" />
            <Route element={<Dashboard />} path="/dashboard" />
            <Route element={<Navigate replace to="/" />} path="*" />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm text-white/70">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-3 text-base font-semibold text-white">{value}</p>
    </div>
  )
}

export default App

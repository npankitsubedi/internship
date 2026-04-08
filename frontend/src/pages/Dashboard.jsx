import { useDeferredValue, useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { fetchApplications, processApplication } from '../lib/apiClient.js'

const roleOptions = ['CDC', 'GUIDE', 'HOD', 'SW', 'HOSTEL', 'STUDENT']

const stageTitles = {
  CDC: 'Career Development Centre',
  GUIDE: 'Faculty Guide',
  HOD: 'Head of Department',
  SW: 'School Office',
  HOSTEL: 'Hostel Office',
  STUDENT: 'Student',
}

function Dashboard() {
  const [applications, setApplications] = useState([])
  const [selectedRole, setSelectedRole] = useState('CDC')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [actionDrafts, setActionDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processingId, setProcessingId] = useState('')
  const [error, setError] = useState('')

  const deferredSearch = useDeferredValue(searchTerm)

  useEffect(() => {
    void loadApplications()
  }, [])

  const loadApplications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError('')
      const data = await fetchApplications()
      setApplications(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const visibleApplications = applications
    .filter((application) => {
      if (selectedRole === 'STUDENT') {
        return true
      }

      return (
        application.stage === selectedRole ||
        application.approvalHistory.some((entry) => entry.actorRole === selectedRole)
      )
    })
    .filter((application) => {
      if (statusFilter === 'ALL') {
        return true
      }
      return application.status === statusFilter
    })
    .filter((application) => {
      const query = deferredSearch.trim().toLowerCase()
      if (!query) {
        return true
      }

      return [
        application.studentName,
        application.registrationNumber,
        application.companyName,
        application.roleTitle,
        application.country,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
    .sort((left, right) => {
      const leftPriority = left.status === 'PENDING' && left.stage === selectedRole ? 0 : 1
      const rightPriority = right.status === 'PENDING' && right.stage === selectedRole ? 0 : 1
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    })

  const pendingAtRole = visibleApplications.filter(
    (application) => application.status === 'PENDING' && application.stage === selectedRole,
  ).length
  const approvedCount = visibleApplications.filter((application) => application.status === 'APPROVED').length
  const rejectedCount = visibleApplications.filter((application) => application.status === 'REJECTED').length

  const updateDraft = (applicationId, field, value) => {
    setActionDrafts((current) => ({
      ...current,
      [applicationId]: {
        approverName: current[applicationId]?.approverName ?? '',
        comments: current[applicationId]?.comments ?? '',
        [field]: value,
      },
    }))
  }

  const handleAction = async (applicationId, approved) => {
    const draft = actionDrafts[applicationId] ?? { approverName: '', comments: '' }

    if (!draft.approverName.trim()) {
      setError('Enter the approver name before recording a decision.')
      return
    }

    try {
      setProcessingId(applicationId)
      setError('')
      const updated = await processApplication(applicationId, {
        role: selectedRole,
        approverName: draft.approverName.trim(),
        comments: draft.comments.trim(),
        approved,
      })

      setApplications((current) =>
        current.map((application) => (application.id === updated.id ? updated : application)),
      )

      setActionDrafts((current) => ({
        ...current,
        [applicationId]: {
          approverName: draft.approverName,
          comments: '',
        },
      }))
    } catch (error) {
      setError(error.message)
    } finally {
      setProcessingId('')
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ink/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-ink/70">
              <ShieldCheck className="h-3.5 w-3.5" />
              Role-Based Queue
            </div>
            <h2 className="mt-4 font-display text-4xl text-ink">Approval Dashboard</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
              Switch roles to inspect the live queue, review workflow history, and record approvals only at the current stage.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-ink/20 hover:bg-ink hover:text-white disabled:cursor-not-allowed"
            disabled={refreshing}
            onClick={() => void loadApplications(true)}
            type="button"
          >
            {refreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh from backend
          </button>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] border border-ink/10 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
              <Filter className="h-3.5 w-3.5" />
              Active Role
            </div>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedRole === role
                      ? 'bg-ink text-white'
                      : 'border border-ink/10 bg-shell text-ink/70 hover:border-ink/25 hover:text-ink'
                  }`}
                  onClick={() => setSelectedRole(role)}
                  type="button"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard icon={Clock3} label="Pending At Role" tone="amber" value={pendingAtRole} />
            <MetricCard icon={CheckCircle2} label="Approved" tone="emerald" value={approvedCount} />
            <MetricCard icon={XCircle} label="Rejected" tone="rose" value={rejectedCount} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
            <input
              className="field-input pl-11"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by student, registration, company, role, or country"
              value={searchTerm}
            />
          </label>

          <select
            className="field-input min-w-[180px]"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel flex min-h-[320px] items-center justify-center p-8">
          <div className="flex items-center gap-3 text-ink/70">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading applications from the backend...
          </div>
        </div>
      ) : visibleApplications.length === 0 ? (
        <div className="glass-panel p-10 text-center">
          <p className="text-lg font-semibold text-ink">No applications match this dashboard view.</p>
          <p className="mt-2 text-sm text-ink/60">Try another role or relax the status filter to widen the queue.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {visibleApplications.map((application) => {
            const draft = actionDrafts[application.id] ?? { approverName: '', comments: '' }
            const canAct =
              selectedRole !== 'STUDENT' &&
              application.status === 'PENDING' &&
              application.stage === selectedRole
            const route = getRoute(application.internshipMode)

            return (
              <article key={application.id} className="glass-panel overflow-hidden">
                <div className="grid gap-6 p-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill status={application.status} />
                          <span className="rounded-full border border-ink/10 bg-shell px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink/65">
                            Stage {application.stage}
                          </span>
                          <span className="rounded-full border border-sea/15 bg-sea/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sea">
                            {application.internshipMode}
                          </span>
                        </div>
                        <h3 className="mt-4 text-2xl font-semibold text-ink">{application.studentName}</h3>
                        <p className="mt-1 text-sm text-ink/60">
                          {application.registrationNumber} • {application.program}
                        </p>
                      </div>

                      <div className="rounded-[1.5rem] bg-ink px-4 py-3 text-white">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Company</p>
                        <p className="mt-2 text-lg font-semibold">{application.companyName}</p>
                        <p className="text-sm text-white/70">{application.roleTitle}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <InfoCard label="Location" value={`${application.city}, ${application.country}`} />
                      <InfoCard label="School" value={application.school} />
                      <InfoCard label="Credits" value={`${application.earnedCredits} credits`} />
                      <InfoCard label="Duration" value={`${application.startDate} to ${application.endDate}`} />
                      <InfoCard label="Offer Letter" value={application.offerLetterUrl} />
                      <InfoCard label="Email Proof" value={application.emailProofUrl} />
                    </div>

                    <div className="mt-6">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">Workflow Track</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {route.map((step, index) => {
                          const completed = hasReachedStep(application, step)
                          const active = application.stage === step && application.status === 'PENDING'

                          return (
                            <div key={`${application.id}-${step}`} className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                                  active
                                    ? 'bg-ink text-white'
                                    : completed
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'border border-ink/10 bg-shell text-ink/50'
                                }`}
                              >
                                {step}
                              </span>
                              {index < route.length - 1 && <span className="text-ink/30">→</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.8rem] border border-ink/10 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">Decision Console</p>
                    <h4 className="mt-3 text-xl font-semibold text-ink">{stageTitles[selectedRole]}</h4>
                    <p className="mt-2 text-sm leading-6 text-ink/60">
                      Only the current stage role can approve or reject. This application is currently at{' '}
                      <span className="font-semibold text-ink">{application.stage}</span>.
                    </p>

                    {canAct ? (
                      <div className="mt-5 space-y-4">
                        <div>
                          <label className="field-label" htmlFor={`approver-${application.id}`}>
                            Approver Name
                          </label>
                          <input
                            className="field-input"
                            id={`approver-${application.id}`}
                            onChange={(event) => updateDraft(application.id, 'approverName', event.target.value)}
                            placeholder={`Enter ${stageTitles[selectedRole]} approver`}
                            value={draft.approverName}
                          />
                        </div>
                        <div>
                          <label className="field-label" htmlFor={`comments-${application.id}`}>
                            Comments
                          </label>
                          <textarea
                            className="field-input min-h-28 resize-y"
                            id={`comments-${application.id}`}
                            onChange={(event) => updateDraft(application.id, 'comments', event.target.value)}
                            placeholder="Add optional review notes or compliance remarks"
                            value={draft.comments}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                            disabled={processingId === application.id}
                            onClick={() => void handleAction(application.id, true)}
                            type="button"
                          >
                            {processingId === application.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            Approve
                          </button>
                          <button
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                            disabled={processingId === application.id}
                            onClick={() => void handleAction(application.id, false)}
                            type="button"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-ink/10 bg-shell px-4 py-4 text-sm leading-6 text-ink/60">
                        {application.status === 'PENDING'
                          ? `This record is waiting with ${stageTitles[application.stage]}.`
                          : `This record is already marked ${application.status.toLowerCase()}.`}
                      </div>
                    )}

                    <div className="mt-6 border-t border-ink/10 pt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">History</p>
                      <div className="mt-4 space-y-3">
                        {application.approvalHistory.map((entry) => (
                          <div key={entry.id} className="rounded-2xl border border-ink/10 bg-shell px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-ink">
                                {entry.actorRole} • {entry.action}
                              </p>
                              <span className="text-xs text-ink/45">{formatDateTime(entry.actionAt)}</span>
                            </div>
                            <p className="mt-1 text-sm text-ink/60">{entry.actorName}</p>
                            {entry.comments && <p className="mt-2 text-sm leading-6 text-ink/70">{entry.comments}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, tone, value }) {
  const tones = {
    amber: 'bg-amber-50 text-amber-900',
    emerald: 'bg-emerald-50 text-emerald-900',
    rose: 'bg-rose-50 text-rose-900',
  }

  return (
    <div className={`rounded-[1.8rem] p-5 ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">{label}</p>
          <p className="mt-3 text-3xl font-semibold">{value}</p>
        </div>
        <Icon className="h-6 w-6 opacity-80" />
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const styles = {
    PENDING: 'bg-amber-100 text-amber-900',
    APPROVED: 'bg-emerald-100 text-emerald-900',
    REJECTED: 'bg-rose-100 text-rose-900',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${styles[status]}`}>
      {status}
    </span>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-ink/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-2 break-all text-sm leading-6 text-ink/75">{value}</p>
    </div>
  )
}

function getRoute(internshipMode) {
  return internshipMode === 'NON_CDC'
    ? ['CDC', 'GUIDE', 'HOD', 'SW', 'HOSTEL']
    : ['CDC', 'SW', 'HOSTEL']
}

function hasReachedStep(application, step) {
  if (application.stage === step) {
    return true
  }
  return application.approvalHistory.some((entry) => entry.actorRole === step && entry.action === 'APPROVED')
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default Dashboard

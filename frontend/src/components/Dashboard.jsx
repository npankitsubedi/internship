import { useDeferredValue, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock3,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { INTERNSHIP_MODE_LABELS, ROLE_LABELS } from '../data/mockData.js'
import { useAuth } from '../context/AuthContext.jsx'

function Dashboard() {
  const { applications, currentUser, decideApplication, isRefreshing, refreshData } = useAuth()
  const [decisionNotes, setDecisionNotes] = useState({})
  const [processingId, setProcessingId] = useState('')
  const [actionError, setActionError] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearch = useDeferredValue(searchTerm)

  if (!currentUser) {
    return null
  }

  const stageQueue = applications
    .filter((application) => application.current_stage === currentUser.role)
    .filter((application) => {
      const query = deferredSearch.trim().toLowerCase()
      if (!query) {
        return true
      }

      return [
        application.id,
        application.student?.name,
        application.student?.registrationNumber,
        application.companyName,
        application.roleTitle,
        application.city,
        application.country,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })

  const workflowCounts = {
    CDC: stageQueue.filter((application) => application.internshipMode === 'CDC').length,
    NON_CDC: stageQueue.filter((application) => application.internshipMode === 'NON_CDC').length,
  }

  const handleDecision = async (applicationId, approved) => {
    try {
      setProcessingId(applicationId)
      setActionError('')
      const updated = await decideApplication(applicationId, approved, decisionNotes[applicationId] ?? '')
      setFeedbackMessage(
        approved
          ? `${updated.id} moved to ${ROLE_LABELS[updated.current_stage] ?? 'Completed'}.`
          : `${updated.id} was rejected and closed.`,
      )
      setDecisionNotes((current) => ({
        ...current,
        [applicationId]: '',
      }))
    } catch (caughtError) {
      setActionError(caughtError.message || 'Unable to record the workflow decision.')
    } finally {
      setProcessingId('')
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="eyebrow">
              <ShieldCheck className="h-4 w-4" />
              Unified Approval Dashboard
            </div>
            <h2 className="mt-4 font-display text-4xl text-ink sm:text-5xl">Only the applications waiting at your stage appear here.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/70 sm:text-base">
              The queue is filtered by <strong>{ROLE_LABELS[currentUser.role]}</strong>, mirroring how the workflow
              engine hands off each application from one office to the next.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard icon={Clock3} label="Pending Now" value={stageQueue.length} />
            <MetricCard icon={BadgeCheck} label="CDC Flow" value={workflowCounts.CDC} />
            <MetricCard icon={ShieldCheck} label="Non-CDC Flow" value={workflowCounts.NON_CDC} />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
            <input
              className="field-input pl-11"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by application, student, company, or location"
              value={searchTerm}
            />
          </label>

          <button className="secondary-btn" disabled={isRefreshing} onClick={() => void refreshData()} type="button">
            {isRefreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh queue
          </button>
        </div>
      </section>

      {feedbackMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {feedbackMessage}
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {actionError}
        </div>
      )}

      {currentUser.role === 'STUDENT' ? (
        <section className="panel p-8 text-center">
          <p className="text-lg font-semibold text-ink">Student users do not approve applications from this queue.</p>
          <p className="mt-2 text-sm text-ink/65">
            Submit a new application from the student form, then switch to CDC, HoD, or another approver role to
            continue the demo.
          </p>
          <Link className="primary-btn mx-auto mt-6 w-fit" to="/">
            Open student form
          </Link>
        </section>
      ) : stageQueue.length === 0 ? (
        <section className="panel p-8 text-center">
          <p className="text-lg font-semibold text-ink">No applications are waiting with {ROLE_LABELS[currentUser.role]}.</p>
          <p className="mt-2 text-sm text-ink/65">
            Switch roles from the navbar or submit a new application to populate the workflow.
          </p>
        </section>
      ) : (
        <div className="grid gap-5">
          {stageQueue.map((application) => {
            const pendingCreditWarning = currentUser.role === 'HOD' && (application.student?.pendingCredits ?? 0) > 10
            const noteValue = decisionNotes[application.id] ?? ''

            return (
              <article key={application.id} className="panel overflow-hidden">
                <div className="grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill text="Pending" tone="amber" />
                      <StatusPill text={INTERNSHIP_MODE_LABELS[application.internshipMode]} tone="sea" />
                      <StatusPill text={`Waiting at ${ROLE_LABELS[application.current_stage]}`} tone="ink" />
                    </div>

                    <h3 className="mt-4 text-2xl font-semibold text-ink">
                      {application.companyName} · {application.roleTitle}
                    </h3>
                    <p className="mt-2 text-sm text-ink/70">
                      {application.student?.name} · {application.student?.registrationNumber} · {application.student?.program}
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <InfoCard label="Location" value={`${application.city}, ${application.country}`} />
                      <InfoCard label="Duration" value={`${formatDate(application.startDate)} to ${formatDate(application.endDate)}`} />
                      <InfoCard label="Monthly Stipend" value={`INR ${application.stipend.toLocaleString('en-IN')}`} />
                      <InfoCard label="Pending Credits" value={String(application.student?.pendingCredits ?? 0)} />
                    </div>

                    <div className="mt-5 rounded-[1.5rem] border border-ink/10 bg-shell/75 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">Workflow Path</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {application.workflow.map((stage, index) => (
                          <StageChip key={stage} active={stage === application.current_stage} label={ROLE_LABELS[stage]} showArrow={index < application.workflow.length - 1} />
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <DocumentCard label="Offer Letter" value={application.offerLetterUrl} />
                      <DocumentCard label="Email Proof" value={application.emailProofUrl} />
                    </div>

                    {application.additionalNotes && (
                      <div className="mt-5 rounded-[1.5rem] border border-ink/10 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">Student Note</p>
                        <p className="mt-2 text-sm leading-6 text-ink/75">{application.additionalNotes}</p>
                      </div>
                    )}

                    <div className="mt-5 rounded-[1.5rem] border border-ink/10 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">Approval Timeline</p>
                      <div className="mt-4 space-y-3">
                        {application.decisionHistory.map((entry) => (
                          <div key={`${entry.stage}-${entry.timestamp}`} className="rounded-2xl border border-ink/10 bg-shell/60 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-ink">
                                {ROLE_LABELS[entry.stage] ?? entry.stage} · {entry.decision}
                              </p>
                              <p className="text-xs text-ink/55">{formatDateTime(entry.timestamp)}</p>
                            </div>
                            <p className="mt-2 text-sm text-ink/70">
                              {entry.actorName} · {entry.comments}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-ink/10 bg-white p-5">
                    <div className="flex items-center gap-3">
                      <MessageSquareText className="h-5 w-5 text-sea" />
                      <div>
                        <p className="section-title">Decision Panel</p>
                        <h4 className="mt-1 text-xl font-semibold text-ink">{ROLE_LABELS[currentUser.role]} action</h4>
                      </div>
                    </div>

                    {pendingCreditWarning && (
                      <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
                          <div>
                            <p className="text-sm font-semibold text-amber-950">Credit overload warning</p>
                            <p className="mt-1 text-sm leading-6 text-amber-900/80">
                              {application.student?.name} currently has {application.student?.pendingCredits} pending
                              credits. This exceeds the HoD warning threshold of 10 credits, so review carefully before
                              approval.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <label className="mt-5 block">
                      <span className="field-label">Approver Comments</span>
                      <textarea
                        className="field-textarea"
                        onChange={(event) =>
                          setDecisionNotes((current) => ({
                            ...current,
                            [application.id]: event.target.value,
                          }))
                        }
                        placeholder="Add optional remarks for the next stage or note a rejection reason."
                        rows="6"
                        value={noteValue}
                      />
                    </label>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <button
                        className="primary-btn justify-center"
                        disabled={processingId === application.id}
                        onClick={() => void handleDecision(application.id, true)}
                        type="button"
                      >
                        {processingId === application.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <BadgeCheck className="h-4 w-4" />
                        )}
                        Approve
                      </button>

                      <button
                        className="danger-btn justify-center"
                        disabled={processingId === application.id}
                        onClick={() => void handleDecision(application.id, false)}
                        type="button"
                      >
                        {processingId === application.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </button>
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

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.75rem] border border-ink/10 bg-white p-5">
      <div className="flex items-center gap-3 text-ink/55">
        <Icon className="h-5 w-5" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em]">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-semibold text-ink">{value}</p>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-ink/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

function DocumentCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-ink/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">{label}</p>
      <code className="mt-2 block break-all text-xs text-sea">{value}</code>
    </div>
  )
}

function StageChip({ active, label, showArrow }) {
  return (
    <>
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
          active ? 'bg-ink text-white' : 'border border-ink/10 bg-white text-ink/60'
        }`}
      >
        {label}
      </span>
      {showArrow && <ArrowRight className="h-4 w-4 text-ink/35" />}
    </>
  )
}

function StatusPill({ text, tone }) {
  const toneClasses = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    sea: 'border-sea/20 bg-sea/10 text-sea',
    ink: 'border-ink/10 bg-shell text-ink/70',
  }

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneClasses[tone]}`}>{text}</span>
}

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

export default Dashboard

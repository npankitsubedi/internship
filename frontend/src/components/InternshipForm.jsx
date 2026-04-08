import { startTransition, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  FileCheck2,
  FileUp,
  Globe2,
  Landmark,
  LoaderCircle,
  ShieldAlert,
  UploadCloud,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { COUNTRY_OPTIONS, INDIAN_STATES } from '../data/mockData.js'
import { useAuth } from '../context/AuthContext.jsx'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const uploadConfig = {
  offerLetterUrl: {
    label: 'Offer Letter',
    accept: '.pdf,application/pdf',
    allowedTypes: ['application/pdf'],
    allowedExtensions: ['pdf'],
    storageFolder: 'offer-letter',
    helpText: 'Upload the employer offer letter as a PDF under 5 MB.',
  },
  emailProofUrl: {
    label: 'Email Proof',
    accept: '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg',
    allowedTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg'],
    storageFolder: 'email-proof',
    helpText: 'Upload confirmation mail or screenshot as PDF, PNG, or JPG under 5 MB.',
  },
}

const createEmptyUploads = () => ({
  offerLetterUrl: { fileName: '', progress: 0, status: 'idle', error: '', url: '' },
  emailProofUrl: { fileName: '', progress: 0, status: 'idle', error: '', url: '' },
})

const createFormState = (student) => ({
  studentName: student?.name ?? '',
  registrationNumber: student?.registrationNumber ?? '',
  studentEmail: student?.email ?? '',
  phoneNumber: student?.phone ?? '',
  school: student?.school ?? '',
  program: student?.program ?? '',
  yearOfStudy: student?.yearOfStudy ? String(student.yearOfStudy) : '',
  pendingCredits: student?.pendingCredits ? String(student.pendingCredits) : '0',
  internshipMode: 'CDC',
  companyName: '',
  roleTitle: '',
  stipend: '',
  startDate: '',
  endDate: '',
  locationScope: 'INDIA',
  stateName: 'Tamil Nadu',
  country: 'Singapore',
  city: '',
  legalConsentAccepted: false,
  legalConsentName: '',
  additionalNotes: '',
  offerLetterUrl: '',
  emailProofUrl: '',
})

function InternshipForm() {
  const { currentUser, submitInternship } = useAuth()
  const [form, setForm] = useState(createFormState(currentUser))
  const [uploads, setUploads] = useState(createEmptyUploads())
  const [formError, setFormError] = useState('')
  const [submissionSuccess, setSubmissionSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toasts, setToasts] = useState([])
  const uploadTimers = useRef({})

  useEffect(() => {
    if (currentUser?.role === 'STUDENT') {
      setForm(createFormState(currentUser))
      setUploads(createEmptyUploads())
      setFormError('')
      setSubmissionSuccess('')
    }
  }, [currentUser])

  useEffect(() => {
    return () => {
      Object.values(uploadTimers.current).forEach((timerId) => window.clearInterval(timerId))
    }
  }, [])

  const pushToast = (tone, message) => {
    const toastId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((current) => [...current, { id: toastId, tone, message }])

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== toastId))
    }, 2600)
  }

  const updateForm = (event) => {
    const { name, value, checked, type } = event.target
    setFormError('')
    setSubmissionSuccess('')

    setForm((current) => {
      const next = {
        ...current,
        [name]: type === 'checkbox' ? checked : value,
      }

      if (name === 'internshipMode' && value === 'CDC') {
        next.legalConsentAccepted = false
        next.legalConsentName = ''
      }

      if (name === 'locationScope') {
        if (value === 'INDIA') {
          next.stateName = next.stateName || 'Tamil Nadu'
        } else {
          next.country = next.country || 'Singapore'
        }
      }

      return next
    })
  }

  const validateSelectedFile = (field, file) => {
    const config = uploadConfig[field]
    if (!file) {
      return 'Please choose a file to continue.'
    }

    if (file.size > MAX_FILE_SIZE) {
      return `${config.label} must be smaller than 5 MB.`
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    const hasAllowedType = config.allowedTypes.includes(file.type)
    const hasAllowedExtension = config.allowedExtensions.includes(extension)

    if (!hasAllowedType && !hasAllowedExtension) {
      return `${config.label} has an unsupported file type.`
    }

    return ''
  }

  const beginFakeUpload = (field, file) => {
    const validationMessage = validateSelectedFile(field, file)
    if (validationMessage) {
      setUploads((current) => ({
        ...current,
        [field]: {
          ...current[field],
          error: validationMessage,
          fileName: file?.name ?? '',
          progress: 0,
          status: 'error',
          url: '',
        },
      }))
      pushToast('error', validationMessage)
      return
    }

    if (uploadTimers.current[field]) {
      window.clearInterval(uploadTimers.current[field])
    }

    setUploads((current) => ({
      ...current,
      [field]: {
        error: '',
        fileName: file.name,
        progress: 0,
        status: 'uploading',
        url: '',
      },
    }))

    setForm((current) => ({
      ...current,
      [field]: '',
    }))

    let step = 0
    uploadTimers.current[field] = window.setInterval(() => {
      step += 1
      const progress = Math.min(step * 10, 100)

      if (step >= 10) {
        window.clearInterval(uploadTimers.current[field])
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
        const mockUrl = `mock-s3/${uploadConfig[field].storageFolder}/${Date.now()}-${safeName}`

        setUploads((current) => ({
          ...current,
          [field]: {
            error: '',
            fileName: file.name,
            progress: 100,
            status: 'uploaded',
            url: mockUrl,
          },
        }))

        setForm((current) => ({
          ...current,
          [field]: mockUrl,
        }))

        pushToast('success', `${uploadConfig[field].label} uploaded successfully.`)
        return
      }

      setUploads((current) => ({
        ...current,
        [field]: {
          ...current[field],
          progress,
          status: 'uploading',
        },
      }))
    }, 200)
  }

  const handleFileChange = (field, event) => {
    const file = event.target.files?.[0]
    setFormError('')
    setSubmissionSuccess('')
    beginFakeUpload(field, file)
  }

  const typedNameMatches = currentUser?.name && form.legalConsentName.trim() === currentUser.name
  const isNonCdc = form.internshipMode === 'NON_CDC'
  const isUploadInFlight = Object.values(uploads).some((upload) => upload.status === 'uploading')
  const workflowPreview =
    form.internshipMode === 'CDC' ? 'Student -> CDC -> SW -> Hostel' : 'Student -> CDC -> Guide -> HoD -> SW -> Hostel'

  const validateBeforeSubmit = () => {
    if (currentUser?.role !== 'STUDENT') {
      return 'Switch to the Student role to submit a new internship request.'
    }

    const requiredFields = [
      ['companyName', 'Company name'],
      ['roleTitle', 'Role title'],
      ['stipend', 'Stipend'],
      ['startDate', 'Start date'],
      ['endDate', 'End date'],
      ['city', 'City'],
    ]

    const missingField = requiredFields.find(([field]) => !form[field]?.trim())
    if (missingField) {
      return `${missingField[1]} is required.`
    }

    if (form.locationScope === 'INDIA' && !form.stateName) {
      return 'Select the internship state for an India-based internship.'
    }

    if (form.locationScope === 'OUTSIDE_INDIA' && !form.country) {
      return 'Select the internship country for an internship outside India.'
    }

    if (!form.offerLetterUrl || !form.emailProofUrl) {
      return 'Complete both mock uploads before submitting the application.'
    }

    if (isUploadInFlight) {
      return 'Wait for the simulated uploads to finish before submitting.'
    }

    if (isNonCdc && !form.legalConsentAccepted) {
      return 'Non-CDC internships require the legal withdrawal checkbox.'
    }

    if (isNonCdc && !typedNameMatches) {
      return 'The typed consent name must match the student name exactly.'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationMessage = validateBeforeSubmit()
    if (validationMessage) {
      setFormError(validationMessage)
      pushToast('error', validationMessage)
      return
    }

    try {
      setIsSubmitting(true)
      setFormError('')

      const response = await submitInternship({
        ...form,
        stipend: Number(form.stipend),
      })

      startTransition(() => {
        setSubmissionSuccess(`Application ${response.id} submitted successfully and routed to CDC.`)
        setForm(createFormState(currentUser))
        setUploads(createEmptyUploads())
      })

      pushToast('success', `Application ${response.id} was routed to the approval chain.`)
    } catch (caughtError) {
      const message = caughtError.message || 'Submission failed in the mock service.'
      setFormError(message)
      pushToast('error', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-card ${toast.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-rose-200 bg-rose-50 text-rose-950'}`}
          >
            <div className="flex items-start gap-3">
              {toast.tone === 'success' ? (
                <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-600" />
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="panel overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="eyebrow">
              <Building2 className="h-4 w-4" />
              Student Submission Workspace
            </div>
            <h2 className="mt-4 font-display text-4xl text-ink sm:text-5xl">
              Build a believable internship approval demo with no backend.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/70 sm:text-base">
              Student details are auto-filled from the current mock login, files use simulated uploads, and every
              submission is routed into a localStorage-backed workflow that survives refreshes.
            </p>
          </div>

          <div className="panel-dark grid gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Current Route</p>
              <p className="mt-3 text-xl font-semibold">{workflowPreview}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70">Logged-in Student</p>
              <p className="mt-2 text-lg font-semibold">{currentUser.name}</p>
              <p className="mt-1 text-sm text-white/70">{currentUser.registrationNumber}</p>
              <p className="mt-1 text-sm text-white/70">{currentUser.program}</p>
            </div>
          </div>
        </div>
      </section>

      {currentUser.role !== 'STUDENT' && (
        <section className="panel border-amber-200 bg-amber-50/90 p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-5 w-5 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-950">Submission is locked for approver roles.</p>
              <p className="mt-1 text-sm text-amber-900/80">
                The form is read-only unless the demo role is switched back to Student from the navbar. You can still
                inspect the approval dashboard meanwhile.
              </p>
              <Link className="mt-4 inline-flex text-sm font-semibold text-amber-950 underline" to="/dashboard">
                Open approval dashboard
              </Link>
            </div>
          </div>
        </section>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="panel p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Landmark className="h-5 w-5 text-sea" />
            <div>
              <p className="section-title">Auto-Fetched Student Data</p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">Student identity and academic snapshot</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ReadOnlyField label="Student Name" value={form.studentName} />
            <ReadOnlyField label="Registration Number" value={form.registrationNumber} />
            <ReadOnlyField label="Email" value={form.studentEmail} />
            <ReadOnlyField label="Phone Number" value={form.phoneNumber} />
            <ReadOnlyField label="School" value={form.school} />
            <ReadOnlyField label="Program" value={form.program} />
            <ReadOnlyField label="Year of Study" value={form.yearOfStudy} />
            <ReadOnlyField label="Pending Credits" value={form.pendingCredits} />
            <ReadOnlyField label="Faculty Guide" value={currentUser.guideName ?? 'Assigned by school'} />
          </div>
        </section>

        <section className="panel p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Globe2 className="h-5 w-5 text-sea" />
            <div>
              <p className="section-title">Internship Details</p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">Route, dates, and location logic</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <label>
              <span className="field-label">Internship Type</span>
              <select
                className="field-select"
                disabled={currentUser.role !== 'STUDENT'}
                name="internshipMode"
                onChange={updateForm}
                value={form.internshipMode}
              >
                <option value="CDC">CDC Internship</option>
                <option value="NON_CDC">Non-CDC Internship</option>
              </select>
            </label>

            <label>
              <span className="field-label">Company Name</span>
              <input
                className="field-input"
                disabled={currentUser.role !== 'STUDENT'}
                name="companyName"
                onChange={updateForm}
                placeholder="Example: Zoho, Bosch, Siemens"
                value={form.companyName}
              />
            </label>

            <label>
              <span className="field-label">Role Title</span>
              <input
                className="field-input"
                disabled={currentUser.role !== 'STUDENT'}
                name="roleTitle"
                onChange={updateForm}
                placeholder="Example: Frontend Engineering Intern"
                value={form.roleTitle}
              />
            </label>

            <label>
              <span className="field-label">Monthly Stipend (INR)</span>
              <input
                className="field-input"
                disabled={currentUser.role !== 'STUDENT'}
                min="0"
                name="stipend"
                onChange={updateForm}
                placeholder="45000"
                type="number"
                value={form.stipend}
              />
            </label>

            <label>
              <span className="field-label">Start Date</span>
              <input
                className="field-input"
                disabled={currentUser.role !== 'STUDENT'}
                name="startDate"
                onChange={updateForm}
                type="date"
                value={form.startDate}
              />
            </label>

            <label>
              <span className="field-label">End Date</span>
              <input
                className="field-input"
                disabled={currentUser.role !== 'STUDENT'}
                name="endDate"
                onChange={updateForm}
                type="date"
                value={form.endDate}
              />
            </label>
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-ink/10 bg-shell/85 p-5">
            <p className="field-label">Internship Location</p>
            <div className="flex flex-wrap gap-3">
              <label className="choice-pill">
                <input
                  checked={form.locationScope === 'INDIA'}
                  className="sr-only"
                  disabled={currentUser.role !== 'STUDENT'}
                  name="locationScope"
                  onChange={updateForm}
                  type="radio"
                  value="INDIA"
                />
                Inside India
              </label>
              <label className="choice-pill">
                <input
                  checked={form.locationScope === 'OUTSIDE_INDIA'}
                  className="sr-only"
                  disabled={currentUser.role !== 'STUDENT'}
                  name="locationScope"
                  onChange={updateForm}
                  type="radio"
                  value="OUTSIDE_INDIA"
                />
                Outside India
              </label>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {form.locationScope === 'INDIA' ? (
                <label>
                  <span className="field-label">State</span>
                  <select
                    className="field-select"
                    disabled={currentUser.role !== 'STUDENT'}
                    name="stateName"
                    onChange={updateForm}
                    value={form.stateName}
                  >
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  <span className="field-label">Country</span>
                  <select
                    className="field-select"
                    disabled={currentUser.role !== 'STUDENT'}
                    name="country"
                    onChange={updateForm}
                    value={form.country}
                  >
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                <span className="field-label">City</span>
                <input
                  className="field-input"
                  disabled={currentUser.role !== 'STUDENT'}
                  name="city"
                  onChange={updateForm}
                  placeholder={form.locationScope === 'INDIA' ? 'Example: Chennai' : 'Example: Singapore'}
                  value={form.city}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="panel p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <UploadCloud className="h-5 w-5 text-sea" />
            <div>
              <p className="section-title">Fake Uploads</p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">Simulated document storage with progress bars</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {Object.entries(uploadConfig).map(([field, config]) => (
              <UploadCard
                key={field}
                config={config}
                data={uploads[field]}
                disabled={currentUser.role !== 'STUDENT'}
                onChange={(event) => handleFileChange(field, event)}
              />
            ))}
          </div>
        </section>

        {isNonCdc && (
          <section className="panel border-amber-200 bg-amber-50/90 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-700" />
              <div>
                <p className="section-title text-amber-900/70">Legal Consent</p>
                <h3 className="mt-2 text-2xl font-semibold text-amber-950">Required for Non-CDC internships</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded-[1.75rem] border border-amber-200 bg-white/80 p-5">
                <label className="flex items-start gap-3 text-sm text-amber-950">
                  <input
                    checked={form.legalConsentAccepted}
                    className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-700 focus:ring-amber-500"
                    disabled={currentUser.role !== 'STUDENT'}
                    name="legalConsentAccepted"
                    onChange={updateForm}
                    type="checkbox"
                  />
                  <span>
                    I understand that choosing a Non-CDC internship requires withdrawing from the CDC placement process
                    and I accept the institutional consequences.
                  </span>
                </label>
              </div>

              <label>
                <span className="field-label text-amber-950">Type your exact full name</span>
                <input
                  className="field-input border-amber-200 focus:border-amber-400 focus:ring-amber-200"
                  disabled={currentUser.role !== 'STUDENT'}
                  name="legalConsentName"
                  onChange={updateForm}
                  placeholder={currentUser.name}
                  value={form.legalConsentName}
                />
                <p className={`mt-2 text-xs ${typedNameMatches ? 'text-emerald-700' : 'text-amber-800/80'}`}>
                  {typedNameMatches
                    ? 'Exact match confirmed.'
                    : 'The typed name must match the student name exactly before submission.'}
                </p>
              </label>
            </div>
          </section>
        )}

        <section className="panel p-6 sm:p-8">
          <label>
            <span className="field-label">Additional Notes</span>
            <textarea
              className="field-textarea"
              disabled={currentUser.role !== 'STUDENT'}
              name="additionalNotes"
              onChange={updateForm}
              placeholder="Optional remarks for CDC or later approvers."
              rows="4"
              value={form.additionalNotes}
            />
          </label>

          {formError && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {formError}
            </div>
          )}

          {submissionSuccess && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {submissionSuccess}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="primary-btn" disabled={currentUser.role !== 'STUDENT' || isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Submitting application
                </>
              ) : (
                <>
                  <FileCheck2 className="h-4 w-4" />
                  Submit internship application
                </>
              )}
            </button>

            <Link className="secondary-btn" to="/dashboard">
              Review approval queue
            </Link>
          </div>
        </section>
      </form>
    </div>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-ink/10 bg-shell/85 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45">{label}</p>
      <p className="mt-3 text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

function UploadCard({ config, data, disabled, onChange }) {
  return (
    <div className="rounded-[1.75rem] border border-ink/10 bg-shell/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-ink">{config.label}</p>
          <p className="mt-1 text-sm text-ink/65">{config.helpText}</p>
        </div>
        <FileUp className="h-5 w-5 text-sea" />
      </div>

      <label className="mt-5 flex cursor-pointer items-center justify-center gap-3 rounded-[1.25rem] border border-dashed border-ink/20 bg-white px-4 py-5 text-sm font-medium text-ink/70 transition hover:border-sea/40 hover:text-ink">
        <UploadCloud className="h-4 w-4" />
        <span>{data.fileName || `Choose ${config.label}`}</span>
        <input accept={config.accept} className="hidden" disabled={disabled} onChange={onChange} type="file" />
      </label>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full transition-all duration-200 ${
            data.status === 'error' ? 'bg-rose-500' : data.status === 'uploaded' ? 'bg-emerald-500' : 'bg-sea'
          }`}
          style={{ width: `${data.progress}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold uppercase tracking-[0.18em] text-ink/45">
          {data.status === 'idle' ? 'Waiting' : data.status}
        </span>
        <span className="text-ink/60">{data.progress}%</span>
      </div>

      {data.url && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          Stored at <code>{data.url}</code>
        </div>
      )}

      {data.error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
          {data.error}
        </div>
      )}
    </div>
  )
}

export default InternshipForm

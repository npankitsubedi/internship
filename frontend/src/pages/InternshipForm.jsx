import { startTransition, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  FileArchive,
  FileCheck2,
  Globe2,
  Landmark,
  LoaderCircle,
  ShieldAlert,
  UploadCloud,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { globalRegions, indianStates } from '../data/locationOptions.js'
import { submitApplication } from '../lib/apiClient.js'

const schoolOptions = [
  'School of Computer Science and Engineering',
  'School of Computer Science Engineering and Information Systems',
  'School of Electronics Engineering',
  'School of Mechanical Engineering',
  'School of Advanced Sciences',
  'VIT Business School',
]

const internshipModes = [
  { value: 'CDC', label: 'CDC Internship', helper: 'Standard VIT placement-routed internship' },
  { value: 'NON_CDC', label: 'Non-CDC Internship', helper: 'Requires legal placement withdrawal acknowledgement' },
]

const createUploadDefaults = () => ({
  offerLetter: { fileName: '', progress: 0, status: 'idle', url: '', error: '' },
  emailProof: { fileName: '', progress: 0, status: 'idle', url: '', error: '' },
})

const createInitialFormState = () => ({
  studentName: '',
  registrationNumber: '',
  studentEmail: '',
  phoneNumber: '',
  school: schoolOptions[0],
  program: '',
  yearOfStudy: '4',
  earnedCredits: '',
  internshipMode: 'CDC',
  companyName: '',
  roleTitle: '',
  stipend: '',
  startDate: '',
  endDate: '',
  locationScope: 'INDIA',
  stateName: 'Tamil Nadu',
  globalRegion: '',
  country: 'India',
  city: '',
  placementWithdrawalAccepted: false,
  placementWithdrawalTypedName: '',
})

function InternshipForm() {
  const [form, setForm] = useState(createInitialFormState)
  const [uploads, setUploads] = useState(createUploadDefaults)
  const [validationError, setValidationError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [createdApplicationId, setCreatedApplicationId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableCountries =
    form.locationScope === 'OUTSIDE_INDIA' && form.globalRegion ? globalRegions[form.globalRegion] ?? [] : ['India']

  const isNonCdc = form.internshipMode === 'NON_CDC'
  const typedNameMatches = form.studentName.trim() !== '' && form.placementWithdrawalTypedName === form.studentName

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target
    setSuccessMessage('')
    setCreatedApplicationId('')
    setValidationError('')
    setSubmitError('')

    setForm((current) => {
      const next = {
        ...current,
        [name]: type === 'checkbox' ? checked : value,
      }

      if (name === 'internshipMode' && value === 'CDC') {
        next.placementWithdrawalAccepted = false
        next.placementWithdrawalTypedName = ''
      }

      if (name === 'locationScope') {
        if (value === 'INDIA') {
          next.stateName = next.stateName || 'Tamil Nadu'
          next.globalRegion = ''
          next.country = 'India'
        } else {
          next.stateName = ''
          next.globalRegion = ''
          next.country = ''
        }
      }

      if (name === 'globalRegion') {
        const countries = globalRegions[value] ?? []
        next.country = countries[0] ?? ''
      }

      return next
    })
  }

  const validateFile = (file, uploadKey) => {
    if (!file) {
      return 'Please select a file.'
    }

    const lowerName = file.name.toLowerCase()
    const isPdf = lowerName.endsWith('.pdf')
    const isImage = /\.(png|jpg|jpeg)$/i.test(lowerName)

    if (uploadKey === 'offerLetter' && !isPdf) {
      return 'Offer letter must be uploaded as a PDF.'
    }

    if (uploadKey === 'emailProof' && !isPdf && !isImage) {
      return 'Email proof must be a PDF, PNG, or JPG.'
    }

    return ''
  }

  const runMockUpload = (file, uploadKey) => {
    const error = validateFile(file, uploadKey)
    if (error) {
      setUploads((current) => ({
        ...current,
        [uploadKey]: {
          ...current[uploadKey],
          status: 'error',
          error,
          fileName: file?.name ?? '',
        },
      }))
      return
    }

    const folder = uploadKey === 'offerLetter' ? 'offer-letters' : 'email-proofs'
    let progress = 0

    setUploads((current) => ({
      ...current,
      [uploadKey]: {
        fileName: file.name,
        progress: 8,
        status: 'uploading',
        url: '',
        error: '',
      },
    }))

    const interval = window.setInterval(() => {
      progress += 18

      if (progress >= 100) {
        window.clearInterval(interval)
        const safeName = file.name.replace(/\s+/g, '-').toLowerCase()
        const mockUrl = `https://mock-s3.vitinternships.in/${folder}/${Date.now()}-${safeName}`

        setUploads((current) => ({
          ...current,
          [uploadKey]: {
            fileName: file.name,
            progress: 100,
            status: 'uploaded',
            url: mockUrl,
            error: '',
          },
        }))
        return
      }

      setUploads((current) => ({
        ...current,
        [uploadKey]: {
          ...current[uploadKey],
          progress,
          status: 'uploading',
        },
      }))
    }, 160)
  }

  const handleFileChange = (event, uploadKey) => {
    const [file] = event.target.files ?? []
    setValidationError('')
    setSubmitError('')
    setSuccessMessage('')
    setCreatedApplicationId('')
    runMockUpload(file, uploadKey)
  }

  const validateForm = () => {
    if (!uploads.offerLetter.url || !uploads.emailProof.url) {
      return 'Complete both mock S3 uploads before submitting the application.'
    }

    if (isNonCdc && !form.placementWithdrawalAccepted) {
      return 'Non-CDC internships require the placement withdrawal checkbox to be accepted.'
    }

    if (isNonCdc && !typedNameMatches) {
      return 'For Non-CDC internships, the typed legal name must match the student name exactly.'
    }

    if (form.locationScope === 'INDIA' && !form.stateName) {
      return 'Select the internship state for an India-based internship.'
    }

    if (form.locationScope === 'OUTSIDE_INDIA' && (!form.globalRegion || !form.country)) {
      return 'Select both the global region and country for internships outside India.'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const error = validateForm()

    if (error) {
      setValidationError(error)
      return
    }

    setIsSubmitting(true)
    setValidationError('')
    setSubmitError('')

    try {
      const payload = {
        ...form,
        yearOfStudy: Number(form.yearOfStudy),
        earnedCredits: Number(form.earnedCredits),
        stipend: Number(form.stipend),
        offerLetterUrl: uploads.offerLetter.url,
        emailProofUrl: uploads.emailProof.url,
        placementWithdrawalAccepted: Boolean(form.placementWithdrawalAccepted),
        stateName: form.locationScope === 'INDIA' ? form.stateName : null,
        globalRegion: form.locationScope === 'OUTSIDE_INDIA' ? form.globalRegion : null,
        country: form.locationScope === 'INDIA' ? 'India' : form.country,
      }

      const response = await submitApplication(payload)

      startTransition(() => {
        setSuccessMessage('Application submitted successfully and routed to CDC for first-stage review.')
        setCreatedApplicationId(response.id)
        setForm(createInitialFormState())
        setUploads(createUploadDefaults())
      })
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-dune/20 bg-dune/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-dune">
            <FileCheck2 className="h-3.5 w-3.5" />
            Submission Desk
          </div>
          <div>
            <h2 className="font-display text-4xl text-ink">Internship Request Form</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">
              Upload the required documents, choose the correct location rules, and submit the internship for the exact
              approval ladder defined by VIT policy.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                Student
              </span>
              <p className="text-sm text-ink/60">Core identity and academic details used for workflow routing.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="studentName">
                  Student Name
                </label>
                <input className="field-input" id="studentName" name="studentName" onChange={handleInputChange} required value={form.studentName} />
              </div>
              <div>
                <label className="field-label" htmlFor="registrationNumber">
                  Registration Number
                </label>
                <input className="field-input uppercase" id="registrationNumber" name="registrationNumber" onChange={handleInputChange} required value={form.registrationNumber} />
              </div>
              <div>
                <label className="field-label" htmlFor="studentEmail">
                  VIT Email
                </label>
                <input className="field-input" id="studentEmail" name="studentEmail" onChange={handleInputChange} required type="email" value={form.studentEmail} />
              </div>
              <div>
                <label className="field-label" htmlFor="phoneNumber">
                  Mobile Number
                </label>
                <input className="field-input" id="phoneNumber" name="phoneNumber" onChange={handleInputChange} required value={form.phoneNumber} />
              </div>
              <div>
                <label className="field-label" htmlFor="school">
                  School
                </label>
                <select className="field-input" id="school" name="school" onChange={handleInputChange} value={form.school}>
                  {schoolOptions.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="program">
                  Program
                </label>
                <input className="field-input" id="program" name="program" onChange={handleInputChange} placeholder="B.Tech Computer Science and Engineering" required value={form.program} />
              </div>
              <div>
                <label className="field-label" htmlFor="yearOfStudy">
                  Year of Study
                </label>
                <select className="field-input" id="yearOfStudy" name="yearOfStudy" onChange={handleInputChange} value={form.yearOfStudy}>
                  {['1', '2', '3', '4', '5'].map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="earnedCredits">
                  Earned Credits
                </label>
                <input className="field-input" id="earnedCredits" min="0" name="earnedCredits" onChange={handleInputChange} placeholder="Example: 92" required type="number" value={form.earnedCredits} />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-sea px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                Internship
              </span>
              <p className="text-sm text-ink/60">Choose the correct route before the system builds the approval path.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {internshipModes.map((mode) => (
                <label
                  key={mode.value}
                  className={`rounded-[1.5rem] border p-5 transition ${
                    form.internshipMode === mode.value
                      ? 'border-sea bg-sea/5 shadow-sm'
                      : 'border-ink/10 bg-white hover:border-ink/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      checked={form.internshipMode === mode.value}
                      className="mt-1 h-4 w-4 accent-sea"
                      name="internshipMode"
                      onChange={handleInputChange}
                      type="radio"
                      value={mode.value}
                    />
                    <div>
                      <p className="font-semibold text-ink">{mode.label}</p>
                      <p className="mt-1 text-sm text-ink/60">{mode.helper}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="companyName">
                  Company Name
                </label>
                <input className="field-input" id="companyName" name="companyName" onChange={handleInputChange} required value={form.companyName} />
              </div>
              <div>
                <label className="field-label" htmlFor="roleTitle">
                  Internship Role
                </label>
                <input className="field-input" id="roleTitle" name="roleTitle" onChange={handleInputChange} required value={form.roleTitle} />
              </div>
              <div>
                <label className="field-label" htmlFor="stipend">
                  Monthly Stipend (INR equivalent)
                </label>
                <input className="field-input" id="stipend" min="0" name="stipend" onChange={handleInputChange} required type="number" value={form.stipend} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label" htmlFor="startDate">
                    Start Date
                  </label>
                  <input className="field-input" id="startDate" name="startDate" onChange={handleInputChange} required type="date" value={form.startDate} />
                </div>
                <div>
                  <label className="field-label" htmlFor="endDate">
                    End Date
                  </label>
                  <input className="field-input" id="endDate" name="endDate" onChange={handleInputChange} required type="date" value={form.endDate} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-dune px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                Location Rules
              </span>
              <p className="text-sm text-ink/60">The location dropdowns switch between India and Outside India rules.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="locationScope">
                  Internship Geography
                </label>
                <select className="field-input" id="locationScope" name="locationScope" onChange={handleInputChange} value={form.locationScope}>
                  <option value="INDIA">India</option>
                  <option value="OUTSIDE_INDIA">Outside India</option>
                </select>
              </div>

              {form.locationScope === 'INDIA' ? (
                <>
                  <div>
                    <label className="field-label" htmlFor="stateName">
                      State
                    </label>
                    <select className="field-input" id="stateName" name="stateName" onChange={handleInputChange} value={form.stateName}>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="country-india">
                      Country
                    </label>
                    <input className="field-input bg-slate-50" disabled id="country-india" value="India" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="field-label" htmlFor="globalRegion">
                      Region
                    </label>
                    <select className="field-input" id="globalRegion" name="globalRegion" onChange={handleInputChange} value={form.globalRegion}>
                      <option value="">Select a region</option>
                      {Object.keys(globalRegions).map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="country">
                      Country
                    </label>
                    <select className="field-input" id="country" name="country" onChange={handleInputChange} value={form.country}>
                      <option value="">Select a country</option>
                      {availableCountries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="field-label" htmlFor="city">
                  City
                </label>
                <input className="field-input" id="city" name="city" onChange={handleInputChange} required value={form.city} />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                Documents
              </span>
              <p className="text-sm text-ink/60">Both uploads are mocked to S3 and converted into backend-ready document URLs.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <UploadCard
                accept=".pdf"
                helper="PDF only"
                icon={FileArchive}
                onChange={(event) => handleFileChange(event, 'offerLetter')}
                state={uploads.offerLetter}
                title="Offer Letter"
              />
              <UploadCard
                accept=".pdf,.png,.jpg,.jpeg"
                helper="Image or PDF"
                icon={UploadCloud}
                onChange={(event) => handleFileChange(event, 'emailProof')}
                state={uploads.emailProof}
                title="Email Proof"
              />
            </div>
          </div>

          {isNonCdc && (
            <div className="rounded-[1.8rem] border border-amber-300 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-950">Mandatory Non-CDC declaration</h3>
                  <p className="mt-1 text-sm leading-6 text-amber-900/80">
                    By continuing, you acknowledge that accepting a Non-CDC internship withdraws you from ongoing placement participation.
                  </p>
                </div>
              </div>

              <label className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-950">
                <input
                  checked={form.placementWithdrawalAccepted}
                  className="mt-1 h-4 w-4 accent-amber-600"
                  name="placementWithdrawalAccepted"
                  onChange={handleInputChange}
                  type="checkbox"
                />
                <span>I understand the legal implication and voluntarily withdraw from placement participation for this Non-CDC internship.</span>
              </label>

              <div className="mt-4">
                <label className="field-label text-amber-950" htmlFor="placementWithdrawalTypedName">
                  Type your exact legal name to confirm
                </label>
                <input
                  className="field-input border-amber-200 focus:border-amber-500 focus:ring-amber-200"
                  id="placementWithdrawalTypedName"
                  name="placementWithdrawalTypedName"
                  onChange={handleInputChange}
                  placeholder={form.studentName || 'Enter the exact student name above'}
                  value={form.placementWithdrawalTypedName}
                />
                <p className={`mt-2 text-sm ${typedNameMatches ? 'text-emerald-700' : 'text-amber-800'}`}>
                  {typedNameMatches
                    ? 'Exact-name validation satisfied.'
                    : 'The typed name must match the Student Name field exactly.'}
                </p>
              </div>
            </div>
          )}

          {validationError && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {validationError}
            </div>
          )}

          {submitError && (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {submitError}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p>{successMessage}</p>
              {createdApplicationId && <p className="mt-1 font-medium">Application ID: {createdApplicationId}</p>}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm text-ink/60">
              Submission sends the application straight to CDC. The dashboard can then drive approvals stage by stage.
            </p>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/40"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-6">
        <div className="glass-panel p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sea/20 bg-sea/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sea">
            <Landmark className="h-3.5 w-3.5" />
            Approval Logic
          </div>
          <h3 className="mt-4 font-display text-3xl text-ink">Workflow engine preview</h3>
          <div className="mt-5 space-y-4">
            <WorkflowPreview
              accent="bg-sea"
              route={['Student', 'CDC', 'SW', 'Hostel']}
              title="CDC Flow"
            />
            <WorkflowPreview
              accent="bg-dune"
              route={['Student', 'CDC', 'Guide', 'HoD', 'SW', 'Hostel']}
              title="Non-CDC Flow"
            />
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ink/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-ink/70">
            <Globe2 className="h-3.5 w-3.5" />
            What the form enforces
          </div>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-ink/70">
            <li className="rounded-2xl bg-ink/5 px-4 py-3">
              Offer Letter accepts PDF only, while Email Proof accepts PDF or image formats and both generate mock S3 URLs.
            </li>
            <li className="rounded-2xl bg-ink/5 px-4 py-3">
              India-based internships switch to a state selector. Outside-India internships switch to region plus country selectors.
            </li>
            <li className="rounded-2xl bg-ink/5 px-4 py-3">
              Non-CDC submissions are blocked until the legal checkbox is checked and the typed name matches the student name exactly.
            </li>
          </ul>

          <Link
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sea transition hover:text-ink"
            to="/dashboard"
          >
            Open approval dashboard
            <FileCheck2 className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-[2rem] border border-ink/10 bg-ink p-6 text-white shadow-halo">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-dune" />
            <div>
              <h3 className="text-lg font-semibold">Mock HoD rule</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">
                The backend simulates HoD credit validation. Non-CDC approvals at the HoD stage fail automatically when earned credits are below 75.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

function UploadCard({ accept, helper, icon: Icon, onChange, state, title }) {
  const statusLabel =
    state.status === 'uploaded'
      ? 'Uploaded to mock S3'
      : state.status === 'uploading'
        ? 'Uploading...'
        : state.status === 'error'
          ? state.error
          : 'Awaiting file'

  return (
    <label className="flex cursor-pointer flex-col rounded-[1.7rem] border border-dashed border-ink/15 bg-white p-5 transition hover:border-sea/40 hover:bg-sea/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-ink/5 p-3 text-ink">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-ink">{title}</p>
            <p className="text-sm text-ink/55">{helper}</p>
          </div>
        </div>
        {state.status === 'uploaded' && <BadgeCheck className="h-5 w-5 text-emerald-600" />}
      </div>

      <div className="mt-5 rounded-2xl bg-ink/5 px-4 py-4">
        <div className="flex items-center justify-between text-sm text-ink/70">
          <span className="truncate pr-4">{state.fileName || 'Choose a file to start mock upload'}</span>
          <span>{state.progress}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div
            className={`h-full rounded-full transition-all ${
              state.status === 'error' ? 'bg-rose-500' : 'bg-gradient-to-r from-sea to-dune'
            }`}
            style={{ width: `${state.progress}%` }}
          />
        </div>
        <p className={`mt-3 text-xs ${state.status === 'error' ? 'text-rose-700' : 'text-ink/55'}`}>{statusLabel}</p>
      </div>

      <input accept={accept} className="sr-only" onChange={onChange} type="file" />
    </label>
  )
}

function WorkflowPreview({ accent, route, title }) {
  return (
    <div className="rounded-[1.7rem] border border-ink/10 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
        <p className="font-semibold text-ink">{title}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {route.map((step, index) => (
          <div key={`${title}-${step}`} className="flex items-center gap-2">
            <span className="rounded-full border border-ink/10 bg-ink/5 px-3 py-1 text-xs font-medium text-ink/80">
              {step}
            </span>
            {index < route.length - 1 && <span className="text-ink/30">→</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default InternshipForm

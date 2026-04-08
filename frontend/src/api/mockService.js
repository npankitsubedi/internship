import { DEMO_ROLE_ORDER, getWorkflowForMode, mockData, ROLE_LABELS } from '../data/mockData.js'

const STORAGE_KEY = 'vit-internship-demo-db'
const SESSION_KEY = 'vit-internship-demo-session'
const NETWORK_DELAY = 800

const cloneValue = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const wait = (ms = NETWORK_DELAY) => new Promise((resolve) => window.setTimeout(resolve, ms))

const buildSeedState = () => cloneValue(mockData)

const getDefaultUserId = (database) => {
  const roleOrderedUsers = DEMO_ROLE_ORDER.map((role) => database.users.find((user) => user.role === role)).filter(Boolean)
  return roleOrderedUsers[0]?.id ?? database.users[0]?.id ?? null
}

const readDatabase = () => {
  if (!canUseStorage()) {
    return buildSeedState()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = buildSeedState()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }

  try {
    return JSON.parse(raw)
  } catch {
    const seed = buildSeedState()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

const writeDatabase = (database) => {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(database))
}

const readSessionUserId = (database) => {
  const fallback = getDefaultUserId(database)

  if (!canUseStorage()) {
    return fallback
  }

  const raw = window.localStorage.getItem(SESSION_KEY)
  if (!raw) {
    if (fallback) {
      window.localStorage.setItem(SESSION_KEY, fallback)
    }
    return fallback
  }

  const userExists = database.users.some((user) => user.id === raw)
  if (!userExists) {
    if (fallback) {
      window.localStorage.setItem(SESSION_KEY, fallback)
    }
    return fallback
  }

  return raw
}

const writeSessionUserId = (userId) => {
  if (!canUseStorage() || !userId) {
    return
  }

  window.localStorage.setItem(SESSION_KEY, userId)
}

const getUserByIdentifier = (database, identifier) => {
  if (!identifier) {
    return null
  }

  return (
    database.users.find((user) => user.id === identifier) ??
    database.users.find((user) => user.role === identifier) ??
    null
  )
}

const getNextApplicationId = (database) => {
  const nextNumber =
    database.applications.reduce((maxValue, application) => {
      const match = application.id.match(/(\d+)$/)
      const number = match ? Number(match[1]) : 0
      return Math.max(maxValue, number)
    }, 0) + 1

  return `APP-2026-${String(nextNumber).padStart(3, '0')}`
}

const withStudentDetails = (application, users) => ({
  ...application,
  student: users.find((user) => user.id === application.studentId) ?? null,
})

export const login = async (identifier = 'STUDENT') => {
  await wait()
  const database = readDatabase()
  const resolvedUser = getUserByIdentifier(database, identifier)

  if (!resolvedUser) {
    throw new Error('Unable to switch the demo role for this user.')
  }

  writeSessionUserId(resolvedUser.id)
  return cloneValue(resolvedUser)
}

export const fetchDashboardData = async () => {
  await wait()
  const database = readDatabase()
  const sessionUserId = readSessionUserId(database)
  const currentUser = database.users.find((user) => user.id === sessionUserId) ?? database.users[0]
  const applications = database.applications
    .map((application) => withStudentDetails(application, database.users))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())

  return cloneValue({
    currentUser,
    users: database.users,
    applications,
    roleLabels: ROLE_LABELS,
  })
}

export const submitApplication = async (payload) => {
  await wait()
  const database = readDatabase()
  const sessionUserId = readSessionUserId(database)
  const student = database.users.find((user) => user.id === (payload.studentId ?? sessionUserId))

  if (!student || student.role !== 'STUDENT') {
    throw new Error('Only student users can submit internship applications in this demo.')
  }

  const workflow = getWorkflowForMode(payload.internshipMode)
  const timestamp = new Date().toISOString()
  const application = {
    id: getNextApplicationId(database),
    studentId: student.id,
    internshipMode: payload.internshipMode,
    companyName: payload.companyName,
    roleTitle: payload.roleTitle,
    stipend: Number(payload.stipend),
    startDate: payload.startDate,
    endDate: payload.endDate,
    locationScope: payload.locationScope,
    stateName: payload.locationScope === 'INDIA' ? payload.stateName : '',
    country: payload.locationScope === 'INDIA' ? 'India' : payload.country,
    city: payload.city,
    offerLetterUrl: payload.offerLetterUrl,
    emailProofUrl: payload.emailProofUrl,
    legalConsentAccepted: Boolean(payload.legalConsentAccepted),
    legalConsentName: payload.legalConsentName ?? '',
    additionalNotes: payload.additionalNotes ?? '',
    workflow,
    current_stage: workflow[0],
    status: 'PENDING',
    createdAt: timestamp,
    updatedAt: timestamp,
    decisionHistory: [
      {
        stage: 'STUDENT',
        actorRole: 'STUDENT',
        actorName: student.name,
        decision: 'SUBMITTED',
        comments:
          payload.internshipMode === 'NON_CDC'
            ? 'Non-CDC internship submitted with legal withdrawal consent.'
            : 'CDC internship submitted and routed to the approval workflow.',
        timestamp,
      },
    ],
  }

  database.applications.unshift(application)
  writeDatabase(database)

  return cloneValue(withStudentDetails(application, database.users))
}

export const approveApplication = async (applicationId, payload) => {
  await wait()
  const database = readDatabase()
  const applicationIndex = database.applications.findIndex((entry) => entry.id === applicationId)

  if (applicationIndex === -1) {
    throw new Error('This application could not be found in the local demo store.')
  }

  const currentApplication = database.applications[applicationIndex]
  if (currentApplication.status !== 'PENDING') {
    throw new Error('This application is no longer awaiting action.')
  }

  if (currentApplication.current_stage !== payload.actorRole) {
    throw new Error(`This application is currently waiting at ${ROLE_LABELS[currentApplication.current_stage]}.`)
  }

  const workflow = currentApplication.workflow ?? getWorkflowForMode(currentApplication.internshipMode)
  const currentStageIndex = workflow.indexOf(payload.actorRole)
  const timestamp = new Date().toISOString()
  const decision = payload.approved ? 'APPROVED' : 'REJECTED'

  currentApplication.decisionHistory.push({
    stage: payload.actorRole,
    actorRole: payload.actorRole,
    actorName: payload.actorName,
    decision,
    comments: payload.comments?.trim() || (payload.approved ? 'Approved in demo workflow.' : 'Rejected in demo workflow.'),
    timestamp,
  })

  currentApplication.updatedAt = timestamp

  if (payload.approved) {
    const nextStage = workflow[currentStageIndex + 1]
    if (nextStage) {
      currentApplication.current_stage = nextStage
      currentApplication.status = 'PENDING'
    } else {
      currentApplication.current_stage = 'COMPLETED'
      currentApplication.status = 'APPROVED'
    }
  } else {
    currentApplication.current_stage = 'COMPLETED'
    currentApplication.status = 'REJECTED'
  }

  database.applications[applicationIndex] = currentApplication
  writeDatabase(database)

  return cloneValue(withStudentDetails(currentApplication, database.users))
}

export const resetDemoState = async () => {
  await wait(300)
  const seed = buildSeedState()
  writeDatabase(seed)
  writeSessionUserId(getDefaultUserId(seed))
  return fetchDashboardData()
}

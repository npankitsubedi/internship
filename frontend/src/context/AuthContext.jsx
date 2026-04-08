import { createContext, startTransition, useContext, useEffect, useState } from 'react'
import {
  approveApplication as approveApplicationRequest,
  fetchDashboardData,
  login as loginRequest,
  resetDemoState,
  submitApplication as submitApplicationRequest,
} from '../api/mockService.js'
import { DEMO_ROLE_ORDER } from '../data/mockData.js'

const AuthContext = createContext(null)

const sortApplications = (applications) =>
  [...applications].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [applications, setApplications] = useState([])
  const [isBooting, setIsBooting] = useState(true)
  const [isSwitchingRole, setIsSwitchingRole] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void hydrateSession()
  }, [])

  const applySnapshot = (snapshot) => {
    startTransition(() => {
      setCurrentUser(snapshot.currentUser)
      setUsers(snapshot.users)
      setApplications(snapshot.applications)
      setError('')
    })
  }

  const hydrateSession = async () => {
    try {
      setIsBooting(true)
      const snapshot = await fetchDashboardData()
      applySnapshot(snapshot)
    } catch (caughtError) {
      setError(caughtError.message || 'Unable to load the mock workspace.')
    } finally {
      setIsBooting(false)
    }
  }

  const refreshData = async () => {
    try {
      setIsRefreshing(true)
      const snapshot = await fetchDashboardData()
      applySnapshot(snapshot)
    } catch (caughtError) {
      setError(caughtError.message || 'Unable to refresh the dashboard.')
      throw caughtError
    } finally {
      setIsRefreshing(false)
    }
  }

  const switchRole = async (identifier) => {
    try {
      setIsSwitchingRole(true)
      setError('')
      await loginRequest(identifier)
      const snapshot = await fetchDashboardData()
      applySnapshot(snapshot)
    } catch (caughtError) {
      setError(caughtError.message || 'Unable to switch the demo role.')
      throw caughtError
    } finally {
      setIsSwitchingRole(false)
    }
  }

  const submitInternship = async (payload) => {
    const created = await submitApplicationRequest({
      ...payload,
      studentId: currentUser?.id,
    })

    setApplications((current) => sortApplications([created, ...current.filter((entry) => entry.id !== created.id)]))
    return created
  }

  const decideApplication = async (applicationId, approved, comments) => {
    const updated = await approveApplicationRequest(applicationId, {
      actorRole: currentUser?.role,
      actorName: currentUser?.name,
      approved,
      comments,
    })

    setApplications((current) => sortApplications(current.map((entry) => (entry.id === updated.id ? updated : entry))))
    return updated
  }

  const resetDemo = async () => {
    try {
      setIsRefreshing(true)
      const snapshot = await resetDemoState()
      applySnapshot(snapshot)
    } catch (caughtError) {
      setError(caughtError.message || 'Unable to reset the demo data.')
      throw caughtError
    } finally {
      setIsRefreshing(false)
    }
  }

  const roleSwitcherUsers = DEMO_ROLE_ORDER.map((role) => users.find((user) => user.role === role)).filter(Boolean)

  return (
    <AuthContext.Provider
      value={{
        applications,
        currentUser,
        decideApplication,
        error,
        isBooting,
        isRefreshing,
        isSwitchingRole,
        refreshData,
        resetDemo,
        roleSwitcherUsers,
        submitInternship,
        switchRole,
        users,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.')
  }

  return context
}

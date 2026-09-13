import { Navigate, createBrowserRouter } from 'react-router-dom'
import {
  PublicLayout,
  CitizenLayout,
  AuthorityLayout,
  WorkerLayout,
  AdminLayout,
  RequireRole,
} from '../components/layout/index.js'

// Public Pages
import { LandingPage } from '../pages/public/LandingPage.jsx'
import { LoginPage } from '../pages/public/LoginPage.jsx'
import { RegisterPage } from '../pages/public/RegisterPage.jsx'
import { ForgotPasswordPage } from '../pages/public/ForgotPasswordPage.jsx'
import { DesignSystemPage } from '../pages/public/DesignSystemPage.jsx'
import { UnauthorizedPage } from '../pages/public/UnauthorizedPage.jsx'
import { NotFoundPage } from '../pages/public/NotFoundPage.jsx'

// Citizen Pages
import { CitizenDashboard } from '../pages/citizen/CitizenDashboard.jsx'
import { CreateComplaint } from '../pages/citizen/CreateComplaint.jsx'
import { MyComplaints } from '../pages/citizen/MyComplaints.jsx'
import { CitizenComplaintDetails } from '../pages/citizen/CitizenComplaintDetails.jsx'
import { CitizenNotifications } from '../pages/citizen/CitizenNotifications.jsx'
import { CitizenProfile } from '../pages/citizen/CitizenProfile.jsx'
import { CitizenSettings } from '../pages/citizen/CitizenSettings.jsx'

// Authority Pages
import { AuthorityDashboard } from '../pages/authority/AuthorityDashboard.jsx'
import { ComplaintQueue } from '../pages/authority/ComplaintQueue.jsx'
import { AuthorityComplaintDetails } from '../pages/authority/AuthorityComplaintDetails.jsx'
import { WorkersManagement } from '../pages/authority/WorkersManagement.jsx'
import { AuthorityAnalytics } from '../pages/authority/AuthorityAnalytics.jsx'
import { AuthorityNotifications } from '../pages/authority/AuthorityNotifications.jsx'
import { AuthorityProfile } from '../pages/authority/AuthorityProfile.jsx'
import { AuthoritySettings } from '../pages/authority/AuthoritySettings.jsx'

// Worker Pages
import { WorkerDashboard } from '../pages/worker/WorkerDashboard.jsx'
import { AssignedComplaints } from '../pages/worker/AssignedComplaints.jsx'
import { WorkerComplaintDetails } from '../pages/worker/WorkerComplaintDetails.jsx'
import { WorkerNotifications } from '../pages/worker/WorkerNotifications.jsx'
import { WorkerProfile } from '../pages/worker/WorkerProfile.jsx'
import { WorkerSettings } from '../pages/worker/WorkerSettings.jsx'

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard.jsx'
import { UsersManagement } from '../pages/admin/UsersManagement.jsx'
import { CitizensManagement } from '../pages/admin/CitizensManagement.jsx'
import { AuthoritiesManagement } from '../pages/admin/AuthoritiesManagement.jsx'
import { AdminWorkersManagement } from '../pages/admin/AdminWorkersManagement.jsx'
import { AdminComplaints } from '../pages/admin/AdminComplaints.jsx'
import { CategoriesManagement } from '../pages/admin/CategoriesManagement.jsx'
import { AdminAnalytics } from '../pages/admin/AdminAnalytics.jsx'
import { ActivityLog } from '../pages/admin/ActivityLog.jsx'
import { AdminSettings } from '../pages/admin/AdminSettings.jsx'
import { AdminProfile } from '../pages/admin/AdminProfile.jsx'

export const appRouter = createBrowserRouter([
  // Public Root
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'design-system', element: <DesignSystemPage /> },
      { path: 'unauthorized', element: <UnauthorizedPage /> },
      { path: '404', element: <NotFoundPage /> },
    ],
  },

  // Citizen Role Shell (Protected)
  {
    path: '/citizen',
    element: (
      <RequireRole requiredRole="CITIZEN">
        <CitizenLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="/citizen/dashboard" replace /> },
      { path: 'dashboard', element: <CitizenDashboard /> },
      { path: 'complaints', element: <MyComplaints /> },
      { path: 'complaints/new', element: <CreateComplaint /> },
      { path: 'complaints/:id', element: <CitizenComplaintDetails /> },
      { path: 'notifications', element: <CitizenNotifications /> },
      { path: 'profile', element: <CitizenProfile /> },
      { path: 'settings', element: <CitizenSettings /> },
    ],
  },

  // Authority Role Shell (Protected)
  {
    path: '/authority',
    element: (
      <RequireRole requiredRole="AUTHORITY">
        <AuthorityLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="/authority/dashboard" replace /> },
      { path: 'dashboard', element: <AuthorityDashboard /> },
      { path: 'complaints', element: <ComplaintQueue /> },
      { path: 'complaints/:id', element: <AuthorityComplaintDetails /> },
      { path: 'workers', element: <WorkersManagement /> },
      { path: 'analytics', element: <AuthorityAnalytics /> },
      { path: 'notifications', element: <AuthorityNotifications /> },
      { path: 'profile', element: <AuthorityProfile /> },
      { path: 'settings', element: <AuthoritySettings /> },
    ],
  },

  // Worker Role Shell (Protected)
  {
    path: '/worker',
    element: (
      <RequireRole requiredRole="WORKER">
        <WorkerLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="/worker/dashboard" replace /> },
      { path: 'dashboard', element: <WorkerDashboard /> },
      { path: 'complaints', element: <AssignedComplaints /> },
      { path: 'complaints/:id', element: <WorkerComplaintDetails /> },
      { path: 'notifications', element: <WorkerNotifications /> },
      { path: 'profile', element: <WorkerProfile /> },
      { path: 'settings', element: <WorkerSettings /> },
    ],
  },

  // Admin Role Shell (Protected)
  {
    path: '/admin',
    element: (
      <RequireRole requiredRole="ADMIN">
        <AdminLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'users', element: <UsersManagement /> },
      { path: 'citizens', element: <CitizensManagement /> },
      { path: 'authorities', element: <AuthoritiesManagement /> },
      { path: 'workers', element: <AdminWorkersManagement /> },
      { path: 'complaints', element: <AdminComplaints /> },
      { path: 'categories', element: <CategoriesManagement /> },
      { path: 'analytics', element: <AdminAnalytics /> },
      { path: 'activity', element: <ActivityLog /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: 'profile', element: <AdminProfile /> },
    ],
  },

  // Fallback 404
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
])

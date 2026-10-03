import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingState } from './components/ui/LoadingState';
import { RequireAuth, SupabaseSetupNotice } from './components/routing/RequireAuth';

const Home = lazy(() => import('./pages/Home/Home'));
const Baymax = lazy(() => import('./pages/Baymax/Baymax'));
const Orayan = lazy(() => import('./pages/Orayan/Orayan'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const HealthRecords = lazy(() => import('./pages/HealthRecords/HealthRecords'));
const Medications = lazy(() => import('./pages/Medications/Medications'));
const Appointments = lazy(() => import('./pages/Appointments/Appointments'));
const Family = lazy(() => import('./pages/Family/Family'));
const FamilyMemberPage = lazy(() => import('./pages/Family/FamilyMemberPage'));
const HealthEducation = lazy(() => import('./pages/HealthEducation/HealthEducation'));
const SymptomJournal = lazy(() => import('./pages/SymptomJournal/SymptomJournal'));
const ReportHistory = lazy(() => import('./pages/ReportHistory/ReportHistory'));
const ReportDetail = lazy(() => import('./pages/ReportHistory/ReportDetail'));
const DoctorPrep = lazy(() => import('./pages/DoctorPrep/DoctorPrep'));
const Emergency = lazy(() => import('./pages/Emergency/Emergency'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const Login = lazy(() => import('./pages/Login/Login'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));
const StaticPages = lazy(() => import('./pages/Static/StaticPages'));

function PageFallback() {
  return (
    <div className="page-container py-16">
      <LoadingState label="Preparing your health space…" />
    </div>
  );
}

/**
 * Pages that hold somebody's health data sit behind <RequireAuth>, so an
 * expired or missing session sends them to sign in rather than showing an
 * empty or broken screen. The static and public pages stay open.
 */
export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <SupabaseSetupNotice />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/health-education" element={<HealthEducation />} />
          <Route path="/about" element={<StaticPages variant="about" />} />
          <Route path="/contact" element={<StaticPages variant="contact" />} />
          <Route path="/privacy" element={<StaticPages variant="privacy" />} />
          <Route path="/terms" element={<StaticPages variant="terms" />} />
          <Route path="/login" element={<Login initialMode="signin" />} />
          <Route path="/signup" element={<Login initialMode="signup" />} />

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/baymax"
            element={
              <RequireAuth>
                <Baymax />
              </RequireAuth>
            }
          />
          <Route
            path="/orayan"
            element={
              <RequireAuth>
                <Orayan />
              </RequireAuth>
            }
          />
          <Route
            path="/health-records"
            element={
              <RequireAuth>
                <HealthRecords />
              </RequireAuth>
            }
          />
          <Route
            path="/medications"
            element={
              <RequireAuth>
                <Medications />
              </RequireAuth>
            }
          />
          <Route
            path="/appointments"
            element={
              <RequireAuth>
                <Appointments />
              </RequireAuth>
            }
          />
          <Route
            path="/family"
            element={
              <RequireAuth>
                <Family />
              </RequireAuth>
            }
          />
          <Route
            path="/family/:memberId"
            element={
              <RequireAuth>
                <FamilyMemberPage />
              </RequireAuth>
            }
          />
          <Route
            path="/symptom-journal"
            element={
              <RequireAuth>
                <SymptomJournal />
              </RequireAuth>
            }
          />
          <Route
            path="/report-history"
            element={
              <RequireAuth>
                <ReportHistory />
              </RequireAuth>
            }
          />
          <Route
            path="/report-history/:reportId"
            element={
              <RequireAuth>
                <ReportDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/doctor-prep"
            element={
              <RequireAuth>
                <DoctorPrep />
              </RequireAuth>
            }
          />
          <Route
            path="/emergency"
            element={
              <RequireAuth>
                <Emergency />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
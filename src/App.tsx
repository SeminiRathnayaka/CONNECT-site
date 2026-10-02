import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingState } from './components/ui/LoadingState';

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

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/baymax" element={<Baymax />} />
          <Route path="/orayan" element={<Orayan />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/health-records" element={<HealthRecords />} />
          <Route path="/medications" element={<Medications />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/family" element={<Family />} />
          <Route path="/family/:memberId" element={<FamilyMemberPage />} />
          <Route path="/health-education" element={<HealthEducation />} />
          <Route path="/symptom-journal" element={<SymptomJournal />} />
          <Route path="/report-history" element={<ReportHistory />} />
          <Route path="/report-history/:reportId" element={<ReportDetail />} />
          <Route path="/doctor-prep" element={<DoctorPrep />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<StaticPages variant="about" />} />
          <Route path="/contact" element={<StaticPages variant="contact" />} />
          <Route path="/privacy" element={<StaticPages variant="privacy" />} />
          <Route path="/terms" element={<StaticPages variant="terms" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

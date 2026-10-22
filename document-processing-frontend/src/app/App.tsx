import { Alert, Box, CircularProgress } from '@mui/material';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell } from '../components/layout/AppShell';
import { SourcePage } from '../features/source-selection/SourceForm';
import { TaskMonitor } from '../features/task-monitor/TaskMonitor';
import { useWorkflowStore } from '../state/workflowStore';
import '../app.css';

const DocumentsPage = lazy(() => import('../features/document-selection/DocumentsPage').then((module) => ({ default: module.DocumentsPage })));
const ResultsPage = lazy(() => import('../features/results/ResultsPage').then((module) => ({ default: module.ResultsPage })));

function Notice() {
  const { t } = useTranslation();
  const location = useLocation();
  const notice = location.state && typeof location.state === 'object' && 'notice' in location.state ? String(location.state.notice) : undefined;
  return notice ? <Alert severity="info" sx={{ mb: 3 }}>{t(notice)}</Alert> : null;
}

function DocumentsGuard() {
  const workflowId = useWorkflowStore((state) => state.workflowId);
  const intakeTask = useWorkflowStore((state) => state.intakeTask);
  return workflowId && intakeTask?.status === 'succeeded' ? <DocumentsPage /> : <Navigate to="/source" replace state={{ notice: 'guardSource' }} />;
}

function ResultsGuard() {
  const tasks = useWorkflowStore((state) => state.processingTasks);
  return tasks.some((task) => task.status === 'succeeded') ? <ResultsPage /> : <Navigate to="/documents" replace state={{ notice: 'guardResults' }} />;
}

export function App() {
  return <BrowserRouter><TaskMonitor><AppShell><Notice /><Suspense fallback={<Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress /></Box>}><Routes>
    <Route path="/source" element={<SourcePage />} />
    <Route path="/documents" element={<DocumentsGuard />} />
    <Route path="/results" element={<ResultsGuard />} />
    <Route path="*" element={<Navigate to="/source" replace />} />
  </Routes></Suspense></AppShell></TaskMonitor></BrowserRouter>;
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage.jsx';
import { AppLayout } from '../layouts/AppLayout.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { WorkspacePage } from '../pages/WorkspacePage.jsx';
import { HistoryPage } from '../pages/HistoryPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

export function AppRoutes() {
  const basename =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/prompify')
      ? '/prompify'
      : '/';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        {/* Landing Page with Animated Shader Hero */}
        <Route path="/" element={<LandingPage />} />

        {/* Main Application Workspace with Collapsible Sidebar & TopNav */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="workspace" element={<WorkspacePage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

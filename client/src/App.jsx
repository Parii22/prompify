import React from 'react';
import { AppProvider } from './context/AppContext.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';
import './styles/global.css';

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { resetIfNewDay } from './utils/storage.js';
import { getTodayDate } from './utils/date.js';
import './index.css';

// Clear yesterday's progress before any hook reads from localStorage.
resetIfNewDay(getTodayDate());

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);

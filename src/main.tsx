import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/domine';
import '@fontsource-variable/space-grotesk';
import './styles.css';
import App from './App';
import { initializeGame } from './store/game-store';

void initializeGame();
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

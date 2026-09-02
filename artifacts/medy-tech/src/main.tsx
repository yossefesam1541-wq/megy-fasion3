import { createRoot } from 'react-dom/client';

import App from './App';
import { setBaseUrl } from '@workspace/api-client-react';

import './index.css';

setBaseUrl('https://megy-fasion3-api-server.vercel.app');

createRoot(document.getElementById('root')!).render(<App />);

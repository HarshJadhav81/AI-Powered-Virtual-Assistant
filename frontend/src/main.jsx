import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // [COPILOT-UPGRADE]: Multi-language support
import App from './App.jsx'
import {BrowserRouter} from "react-router-dom"
import UserContext from './context/UserContext.jsx'

// [COPILOT-UPGRADE]: Initialize i18n before rendering
console.info('[COPILOT-UPGRADE]', 'Initializing AI Virtual Assistant...');

createRoot(document.getElementById('root')).render(
<BrowserRouter>
<UserContext>
    <App />
  </UserContext>
  </BrowserRouter>
 
)

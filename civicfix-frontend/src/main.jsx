import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx'
import { AppProviders } from './app/providers.jsx'
import './styles/tokens.css'
import './styles/global.css'
import './styles/ui.css'
import './styles/domain.css'
import './styles/layout.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'

import './styles/tokens.css'
import './styles/shadcn-bridge.css'
import './styles/global.css'
import './i18n'

import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

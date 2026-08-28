import React from 'react'
import ReactDOM from 'react-dom/client'

import './styles/tokens.css'
// global.css defines @layer base; it must be imported before the Tailwind
// entry so the layer order is base < components < utilities.
import './styles/global.css'
import './styles/shadcn-bridge.css'
import './i18n'

import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

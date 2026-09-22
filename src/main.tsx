import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { bootLearnerSession } from './learning/services/learnerSession'

// The learner's session is restored before the first render: AppStateContext
// reads progress synchronously as it mounts, so a signed-in learner's
// repositories must already hold the server's state. Never rejects — with the
// API down, or signed out, the app renders on local progress as before.
void bootLearnerSession().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})

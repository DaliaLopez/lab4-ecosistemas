import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SupabaseProvider } from './providers/SupabaseProvider'
import { OrderTrackingProvider } from './providers/OrderTrackingProvider'
import { PositionProvider } from './providers/PositionProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SupabaseProvider>
      <PositionProvider activeOrder={null}>
        <OrderTrackingProvider>
          <App />
        </OrderTrackingProvider>
      </PositionProvider>
    </SupabaseProvider>
  </StrictMode>,
)
import './globals.css'
import { Toaster } from 'react-hot-toast';


export const metadata = {
  title: 'Smart Visit Plan - Telkom Indonesia',
  description: 'Sistem Manajemen Kunjungan',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
  <Toaster 
    position="top-right"
    toastOptions={{
      duration: 3000,
      style: {
        background: '#363636',
        color: '#fff',
      },
      success: {
        duration: 3000,
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff',
        },
      },
      error: {
        duration: 4000,
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        },
      },
    }}
  />
  {children}
</body>

    </html>
  )
}

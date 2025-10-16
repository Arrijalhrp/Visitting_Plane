import './globals.css'

export const metadata = {
  title: 'Smart Visit Plan - Telkom Indonesia',
  description: 'Sistem Manajemen Kunjungan',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  )
}

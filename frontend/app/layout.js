export const metadata = {
  title: 'Adverayze Chat',
  description: 'Real-time chat application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
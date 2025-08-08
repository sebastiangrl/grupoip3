export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D5AA0] to-[#1E3A8A]">
      {children}
    </div>
  )
}

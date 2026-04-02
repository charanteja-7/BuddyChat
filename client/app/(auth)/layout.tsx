export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#0a0a0f]">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="animate-blob animation-delay-0 absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)",
          }}
        />
        <div
          className="animate-blob animation-delay-2000 absolute top-1/2 -right-32 w-[420px] h-[420px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="animate-blob animation-delay-4000 absolute -bottom-32 left-1/3 w-[380px] h-[380px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(192,132,252,0.14) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M0 0h1v40H0zm40 0h-1v40h1zM0 0v1h40V0zm0 40v-1h40v1z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>
      {children}
    </div>
  );
}

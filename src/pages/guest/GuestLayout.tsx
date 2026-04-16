import { Outlet } from "react-router-dom";

export function GuestLayout() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 relative transition-colors duration-300">
      <Outlet />
    </div>
  );
}

export default GuestLayout;

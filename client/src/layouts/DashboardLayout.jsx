import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSocket } from '../hooks/useSocket';

const DashboardLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Initialize socket connection
  useSocket();

  return (
    <div className="min-h-screen bg-dark-950 transition-colors duration-300">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-64 w-[600px] h-[400px] opacity-30"
          style={{ background: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.08) 0%, transparent 60%)', filter: 'blur(20px)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] opacity-20"
          style={{ background: 'radial-gradient(ellipse at bottom right, rgba(168,85,247,0.08) 0%, transparent 60%)', filter: 'blur(20px)' }} />
      </div>
      <Sidebar isMobileOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
      <Navbar onMenuToggle={() => setIsMobileOpen(true)} />
      <main className="lg:ml-64 pt-16 min-h-screen relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="p-4 lg:p-6"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DashboardLayout;

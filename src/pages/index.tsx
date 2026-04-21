/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { siteConfig } from "../config/site-config";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function LandingPage() {
  const { user, isAuthReady } = useUser();

  return (
    <div className="min-h-screen bg-sand flex flex-col p-[32px] md:p-[60px]">
      <header className="px-4 py-8 md:px-16 md:py-12 flex justify-between items-center">
        <div className="font-serif text-2xl font-bold text-forest tracking-widest">
          {siteConfig.shortName}
        </div>
        <div className="flex items-center gap-8">
          <nav className="hidden md:block text-xs uppercase tracking-[2px] text-forest font-semibold">
            Foundations • Community • Identity
          </nav>
          {isAuthReady && user && (
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 px-4 py-2 bg-forest text-paper rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-md"
            >
              <LayoutDashboard size={14} /> Dashboard
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12 md:px-16 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl text-center md:text-left md:self-start w-full"
        >
          <span className="font-serif italic text-lg text-sage mb-3 block">
            {siteConfig.name}
          </span>
          <h1 className="text-4xl md:text-7xl font-serif text-forest leading-[1.1] mb-6">
            Building the Roots of Professionalism.
          </h1>
          <p className="text-base md:text-xl leading-relaxed text-ink/80 max-w-xl mb-10">
            A high-end, community-focused ecosystem for meaningful professional exchanges. 
            Earthy aesthetics meet modern technical foundations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <Link
              to={user ? "/dashboard" : "/onboarding"}
              className="px-12 py-5 bg-forest text-paper rounded-full font-semibold text-sm uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-xl flex items-center justify-center gap-2"
            >
              {user ? "Go to Dashboard" : "Connect Now"} <ArrowRight size={18} />
            </Link>
            <Link
              to="/admin/verify"
              className="px-12 py-5 border-2 border-forest text-forest rounded-full font-semibold text-sm uppercase tracking-widest hover:bg-forest hover:text-paper transition-all text-center"
            >
              Admin Verify
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Decorative Border from Design */}
      <div className="fixed inset-0 pointer-events-none border-[20px] md:border-[30px] border-sand z-50 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)]"></div>
    </div>
  );
}

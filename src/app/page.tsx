'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Monitor,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Activity
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';

export default function HomePage() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (res.ok) setBackendStatus('connected');
        else setBackendStatus('offline');
      })
      .catch(() => setBackendStatus('offline'));
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: 'var(--mk-bg)', color: 'var(--mk-text)' }}>
      
      {/* Top Header Placeholder (Empty for now to keep logo centered) */}
      <header className="p-6 h-20" />

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 flex-1 flex flex-col items-center justify-center -mt-12">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-md transform rotate-3"
              style={{ backgroundColor: 'var(--mk-primary)', color: 'var(--mk-text-inverse)' }}
            >
              M
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight" style={{ color: 'var(--mk-text)' }}>
              MediKiosk
            </h1>
          </div>
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight mb-4" style={{ color: 'var(--mk-text-secondary)' }}>
            Smart Healthcare Check-in
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: 'var(--mk-text-muted)' }}>
            Streamlined patient intake, intelligent symptom routing, and instant clinical handover.
          </p>
        </motion.div>

        {/* Portal Entry Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl"
        >
          {/* Patient Kiosk Card */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl p-8 flex flex-col justify-between group transition-all duration-300 hover:shadow-xl"
            style={{ backgroundColor: 'var(--mk-surface)', border: '1px solid var(--mk-border)' }}
          >
            <div>
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                style={{ backgroundColor: 'var(--mk-accent-light)', color: 'var(--mk-accent-dark)' }}
              >
                <Monitor className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--mk-text)' }}>Patient Kiosk</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--mk-text-secondary)' }}>
                Touchscreen check-in, multilingual speech recognition, and instant queue token allocation for patients.
              </p>
              <ul className="space-y-2 text-sm mb-8" style={{ color: 'var(--mk-text-secondary)' }}>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Voice Intake</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Document Scan</li>
              </ul>
            </div>
            <Link href="/kiosk">
              <Button size="lg" className="w-full text-white font-semibold" style={{ backgroundColor: 'var(--mk-accent)' }}>
                Launch Kiosk <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Doctor Portal Card */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl p-8 flex flex-col justify-between group transition-all duration-300 hover:shadow-xl relative overflow-hidden"
            style={{ backgroundColor: 'var(--mk-surface)', border: '2px solid var(--mk-primary)' }}
          >
            <div className="absolute top-0 right-0 p-3">
              <span className="text-xs font-bold px-2 py-1 rounded bg-teal-100 text-teal-800">Primary</span>
            </div>
            <div>
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                style={{ backgroundColor: 'var(--mk-primary-subtle)', color: 'var(--mk-primary-dark)' }}
              >
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--mk-text)' }}>Doctor Portal</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--mk-text-secondary)' }}>
                Live patient queue, pre-consultation summary review, clinical diagnosis entry, and record generation.
              </p>
              <ul className="space-y-2 text-sm mb-8" style={{ color: 'var(--mk-text-secondary)' }}>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" /> Live Token Queue</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" /> AI Patient Summary</li>
              </ul>
            </div>
            <Link href="/doctor/login">
              <Button size="lg" className="w-full text-white font-semibold shadow-md" style={{ backgroundColor: 'var(--mk-primary)' }}>
                Doctor Sign In <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Admin Panel Card */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl p-8 flex flex-col justify-between group transition-all duration-300 hover:shadow-xl"
            style={{ backgroundColor: 'var(--mk-surface)', border: '1px solid var(--mk-border)' }}
          >
            <div>
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                style={{ backgroundColor: '#F3E8FF', color: '#7E22CE' }}
              >
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--mk-text)' }}>Admin Panel</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--mk-text-secondary)' }}>
                Manage question trees, transition routing, staff accounts, kiosk hardware, and system configurations.
              </p>
              <ul className="space-y-2 text-sm mb-8" style={{ color: 'var(--mk-text-secondary)' }}>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" /> Question Bank</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" /> Staff & Kiosks</li>
              </ul>
            </div>
            <Link href="/doctor/login">
              <Button size="lg" variant="outline" className="w-full font-semibold border-2" style={{ color: 'var(--mk-text)' }}>
                Admin Login <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

        </motion.div>
      </div>

      {/* Footer & Health Indicator */}
      <footer className="py-8 px-6 flex flex-col sm:flex-row items-center justify-between border-t max-w-7xl mx-auto w-full" style={{ borderColor: 'var(--mk-border)' }}>
        <p className="text-sm font-medium mb-4 sm:mb-0" style={{ color: 'var(--mk-text-muted)' }}>
          &copy; {new Date().getFullYear()} MediKiosk System. All rights reserved.
        </p>
        
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm"
          style={{ backgroundColor: 'var(--mk-surface)', borderColor: 'var(--mk-border)' }}
        >
          <Activity className="w-4 h-4" style={{ color: 'var(--mk-text-muted)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--mk-text-secondary)' }}>System Status:</span>
          <div className="flex items-center gap-2 ml-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                backendStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse' :
                backendStatus === 'checking' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-bold" style={{ 
              color: backendStatus === 'connected' ? 'var(--mk-success)' :
                     backendStatus === 'checking' ? 'var(--mk-warning)' : 'var(--mk-error)'
            }}>
              {backendStatus === 'connected' ? 'Operational' : 
               backendStatus === 'checking' ? 'Checking...' : 'Offline'}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

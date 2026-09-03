'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Monitor,
  Stethoscope,
  ShieldCheck,
  Activity,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  Mic,
  Cpu,
} from 'lucide-react';

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

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-500/30">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">MediKiosk</h1>
              <p className="text-xs text-slate-400">Intelligent Healthcare Intake System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : backendStatus === 'checking'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
              <span className="text-slate-300">
                Backend API:{' '}
                <strong className={backendStatus === 'connected' ? 'text-emerald-400' : 'text-slate-400'}>
                  {backendStatus === 'connected' ? 'Online (Port 8000)' : backendStatus === 'checking' ? 'Connecting...' : 'Standby / Offline'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Patient Pre-Consultation
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6">
            Seamless Kiosk Intake, AI Triage &amp; Clinical Interoperability
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            MediKiosk empowers patients with multilingual voice intake and prescription OCR, while providing doctors with instant clinical encounter aggregation and FHIR R4 document export.
          </p>
        </div>

        {/* Portal Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Kiosk Interface Card */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-8 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <Monitor className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Patient Kiosk</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Touchscreen check-in, multilingual speech recognition, AI symptom routing, and instant queue token allocation.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  Unauthenticated Patient Onboarding
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  Voice Intake &amp; Decision Tree
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  Document Scan &amp; Medication OCR
                </li>
              </ul>
            </div>
            <Link href="/kiosk">
              <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                Launch Kiosk <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Doctor Portal Card */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-8 hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 text-teal-400 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Doctor Portal</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Live patient consultation queue, pre-consultation summary review, authoritative diagnosis entry, and FHIR R4 generation.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  Live Patient Token Queue
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  Aggregated Symptom &amp; Rx History
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  Clinical Diagnosis &amp; FHIR Export
                </li>
              </ul>
            </div>
            <Link href="/doctor/login">
              <Button size="lg" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold">
                Doctor Sign In <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Admin Dashboard Card */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-8 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Admin Panel</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Manage question trees, transition routing, staff accounts, kiosk hardware, system activity, and audit trails.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  Question Bank &amp; Transitions CRUD
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  Staff Role-Based Access Control
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  Physical Kiosk Registry &amp; Audit Logs
                </li>
              </ul>
            </div>
            <Link href="/doctor/login">
              <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                Admin / Staff Login <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center">
          <div className="p-4">
            <Mic className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">Voice &amp; AI Routing</h4>
            <p className="text-xs text-slate-400 mt-1">Guided classification against DB decision tree</p>
          </div>
          <div className="p-4">
            <FileText className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">Google Vision OCR</h4>
            <p className="text-xs text-slate-400 mt-1">Prescription parsing &amp; medication extraction</p>
          </div>
          <div className="p-4">
            <Cpu className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">FHIR R4 Bundles</h4>
            <p className="text-xs text-slate-400 mt-1">Standards-compliant interoperable health records</p>
          </div>
          <div className="p-4">
            <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">Atomic Queues</h4>
            <p className="text-xs text-slate-400 mt-1">Concurrency-safe kiosk token issuance</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        MediKiosk System &copy; 2026. FastAPI Backend &bull; Next.js Frontend &bull; PostgreSQL &bull; FHIR R4
      </footer>
    </main>
  );
}

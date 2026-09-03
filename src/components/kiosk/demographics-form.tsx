'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, User, Calendar, Phone, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export interface DemographicsData {
  full_name: string;
  date_of_birth: string;
  sex: 'Male' | 'Female' | 'Other' | 'unknown';
  phone?: string;
}

interface DemographicsFormProps {
  onContinue: (data: DemographicsData) => void;
  onBack: () => void;
  isProcessing?: boolean;
}

export function DemographicsForm({ onContinue, onBack, isProcessing }: DemographicsFormProps) {
  const [data, setData] = useState<DemographicsData>({
    full_name: '',
    date_of_birth: '',
    sex: 'unknown',
    phone: '',
  });

  const [dob, setDob] = useState({ day: '', month: '', year: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const updateDob = (part: 'day' | 'month' | 'year', value: string) => {
    const newDob = { ...dob, [part]: value };
    setDob(newDob);
    if (newDob.day && newDob.month && newDob.year) {
      setData({ ...data, date_of_birth: `${newDob.year}-${newDob.month.padStart(2, '0')}-${newDob.day.padStart(2, '0')}` });
    } else {
      setData({ ...data, date_of_birth: '' });
    }
  };

  const isValid = data.full_name.trim() !== '' && data.date_of_birth !== '' && data.sex !== 'unknown';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onContinue(data);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-[100dvh] bg-[var(--mk-bg)]"
    >
      {/* Sticky Top Header & Titles */}
      <div className="flex-shrink-0 w-full flex flex-col items-center px-6 pt-6 pb-2 border-b border-[var(--mk-border)] bg-[var(--mk-bg)] z-10">
        <div className="w-full max-w-4xl relative flex items-center justify-center">
          <button 
            onClick={onBack}
            disabled={isProcessing}
            className="absolute left-0 flex items-center text-[var(--mk-text-secondary)] hover:text-[var(--mk-text)] transition-colors text-lg font-medium py-2 pr-4 disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="text-center py-2">
            <h2 className="text-4xl md:text-[48px] font-bold text-[var(--mk-text)] mb-2 tracking-tight leading-tight">Patient Information</h2>
            <p className="text-xl md:text-2xl text-[var(--mk-text-secondary)] font-medium">Please provide your details to get started.</p>
          </div>
        </div>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 min-h-0 overflow-y-auto w-full flex flex-col items-center pb-8 pt-8 px-6">
        <form id="demographics-form" onSubmit={handleSubmit} className="w-full max-w-4xl space-y-8">
          {/* Full Name */}
          <div className="w-full">
            <label htmlFor="full_name" className="block text-[22px] font-bold text-[var(--mk-text)] mb-3">
              Full Name
            </label>
            <input
              id="full_name"
              type="text"
              required
              value={data.full_name}
              onChange={(e) => setData({ ...data, full_name: e.target.value })}
              onBlur={() => handleBlur('full_name')}
              className="w-full min-h-[64px] px-6 text-[22px] border border-[var(--mk-border-strong)] bg-[var(--mk-surface)] text-[var(--mk-text)] rounded-xl focus:border-[var(--mk-primary)] focus:ring-1 focus:ring-[var(--mk-primary)] outline-none shadow-sm transition-all"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Date of Birth Dropdowns */}
            <div>
              <label htmlFor="dob_month" className="block text-[22px] font-bold text-[var(--mk-text)] mb-3">
                Date of Birth
              </label>
              <div className="flex gap-3">
                <select 
                  id="dob_month"
                  value={dob.month} 
                  onChange={e => updateDob('month', e.target.value)}
                  onBlur={() => handleBlur('dob')}
                  className="w-full min-h-[64px] px-4 text-xl border border-[var(--mk-border-strong)] bg-[var(--mk-surface)] text-[var(--mk-text)] rounded-xl focus:border-[var(--mk-primary)] outline-none shadow-sm appearance-none"
                >
                  <option value="">Month</option>
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'short' })}</option>
                  ))}
                </select>
                <select 
                  id="dob_day"
                  value={dob.day} 
                  onChange={e => updateDob('day', e.target.value)}
                  onBlur={() => handleBlur('dob')}
                  className="w-full min-h-[64px] px-4 text-xl border border-[var(--mk-border-strong)] bg-[var(--mk-surface)] text-[var(--mk-text)] rounded-xl focus:border-[var(--mk-primary)] outline-none shadow-sm appearance-none"
                >
                  <option value="">Day</option>
                  {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select 
                  id="dob_year"
                  value={dob.year} 
                  onChange={e => updateDob('year', e.target.value)}
                  onBlur={() => handleBlur('dob')}
                  className="w-full min-h-[64px] px-4 text-xl border border-[var(--mk-border-strong)] bg-[var(--mk-surface)] text-[var(--mk-text)] rounded-xl focus:border-[var(--mk-primary)] outline-none shadow-sm appearance-none"
                >
                  <option value="">Year</option>
                  {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-[22px] font-bold text-[var(--mk-text)] mb-3">
                Phone Number <span className="text-[var(--mk-text-muted)] font-normal">(Optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                className="w-full min-h-[64px] px-6 text-[22px] border border-[var(--mk-border-strong)] bg-[var(--mk-surface)] text-[var(--mk-text)] rounded-xl focus:border-[var(--mk-primary)] outline-none shadow-sm transition-all"
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>

          {/* Sex */}
          <div role="radiogroup" aria-labelledby="sex_label">
            <label id="sex_label" className="block text-[22px] font-bold text-[var(--mk-text)] mb-3">
              Sex
            </label>
            <div className="flex gap-4">
              {['Male', 'Female', 'Other'].map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={data.sex === option}
                  onClick={() => {
                    setData({ ...data, sex: option as any });
                    setTouched(prev => ({ ...prev, sex: true }));
                  }}
                  className={`flex-1 min-h-[64px] text-[22px] font-bold rounded-xl border-2 transition-all ${
                    data.sex === option
                      ? 'border-[var(--mk-primary)] bg-[var(--mk-primary-subtle)] text-[var(--mk-primary)] shadow-md'
                      : 'border-[var(--mk-border-strong)] bg-[var(--mk-surface)] text-[var(--mk-text-secondary)] hover:border-[var(--mk-primary)]/50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Sticky Bottom Action */}
      <div className="flex-shrink-0 w-full flex justify-center p-6 bg-[var(--mk-bg)] border-t border-[var(--mk-border)] z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Button
          form="demographics-form"
          type="submit"
          disabled={!isValid || isProcessing}
          className="w-full max-w-sm shadow-xl min-h-[64px] text-[26px] rounded-2xl"
          style={{ 
            backgroundColor: isValid && !isProcessing ? 'var(--mk-primary)' : 'var(--mk-surface-muted)',
            color: isValid && !isProcessing ? 'var(--mk-text-inverse)' : 'var(--mk-text-muted)'
          }}
        >
          {isProcessing ? 'Processing...' : 'Continue'}
          {!isProcessing && <ArrowRight className="w-8 h-8 ml-2" />}
        </Button>
      </div>
    </motion.div>
  );
}

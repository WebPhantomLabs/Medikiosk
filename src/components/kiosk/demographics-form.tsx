'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, User, Calendar, Phone, Activity } from 'lucide-react';

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

  const isValid = data.full_name.trim() !== '' && data.date_of_birth !== '' && data.sex !== 'unknown';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onContinue(data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-4xl w-full">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Patient Information</h2>
          <p className="text-xl text-gray-600">Please provide your details to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Full Name */}
          <div>
            <label className="flex items-center text-xl font-semibold text-gray-800 mb-3">
              <User className="w-6 h-6 mr-2 text-blue-600" />
              Full Name *
            </label>
            <input
              type="text"
              required
              value={data.full_name}
              onChange={(e) => setData({ ...data, full_name: e.target.value })}
              className="w-full p-6 text-2xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Date of Birth */}
            <div>
              <label className="flex items-center text-xl font-semibold text-gray-800 mb-3">
                <Calendar className="w-6 h-6 mr-2 text-blue-600" />
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={data.date_of_birth}
                onChange={(e) => setData({ ...data, date_of_birth: e.target.value })}
                className="w-full p-6 text-2xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="flex items-center text-xl font-semibold text-gray-800 mb-3">
                <Phone className="w-6 h-6 mr-2 text-blue-600" />
                Phone Number
              </label>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                className="w-full p-6 text-2xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                placeholder="(Optional)"
              />
            </div>
          </div>

          {/* Sex */}
          <div>
            <label className="flex items-center text-xl font-semibold text-gray-800 mb-4">
              <Activity className="w-6 h-6 mr-2 text-blue-600" />
              Sex *
            </label>
            <div className="grid grid-cols-3 gap-6">
              {['Male', 'Female', 'Other'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setData({ ...data, sex: option as any })}
                  className={`p-6 text-2xl font-bold rounded-2xl border-4 transition-all ${
                    data.sex === option
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-12 pt-8 border-t-2 border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onBack}
              disabled={isProcessing}
              className="text-2xl px-10 py-8 rounded-2xl"
            >
              <ArrowLeft className="w-8 h-8 mr-3" />
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={!isValid || isProcessing}
              className="text-2xl px-12 py-8 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Continue'}
              {!isProcessing && <ArrowRight className="w-8 h-8 ml-3" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

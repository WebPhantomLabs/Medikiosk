'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Save, FileText, Pill, Stethoscope, Activity, X } from 'lucide-react';
import { doctor } from '@/lib/api-client';

interface IntakeAnswerHistory {
  node_id: string;
  question_text: string;
  transcript: string;
  answer_category: string;
  sequence: number;
}

interface DocumentResponse {
  id: string;
  file_name: string;
  mime_type: string;
  status: string;
  ocr_text?: string;
  medications?: any[];
  created_at: string;
}

interface PatientData {
  session_id: string;
  token_number: string;
  patient: {
    id: string;
    full_name: string;
    date_of_birth?: string;
    sex?: string;
    phone?: string;
  };
  intake_history: IntakeAnswerHistory[];
  documents: DocumentResponse[];
  diagnosis?: {
    id: string;
    diagnosis_text: string;
    notes?: string;
    doctor_name: string;
    created_at: string;
  };
}

interface PatientSummaryProps {
  tokenNumber: string;
  onClose: () => void;
  onSignOff: () => void;
}

export function PatientSummary({ tokenNumber, onClose, onSignOff }: PatientSummaryProps) {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'ayurveda' | 'meds' | 'documents' | 'prescription'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPatientData();
  }, [tokenNumber]);

  const fetchPatientData = async () => {
    try {
      const response = await doctor.getPatient(tokenNumber);
      setPatientData(response.data);
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOff = async () => {
    setIsSubmitting(true);
    try {
      if (patientData) {
        await doctor.signoff(patientData.session_id, { diagnosis, prescription });
        onSignOff();
      }
    } catch (error) {
      console.error('Failed to sign off:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient not found</h2>
          <Button onClick={onClose}>Go Back</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Stethoscope },
    { id: 'history', label: 'History', icon: Activity },
    { id: 'ayurveda', label: 'Ayurveda', icon: Activity },
    { id: 'meds', label: 'Medications', icon: Pill },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'prescription', label: 'Prescription', icon: Edit },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  Token: {patientData.token_number}
                </h1>
              </div>
              <p className="text-gray-600 mt-1">
                {patientData.patient.full_name}
                {patientData.patient.date_of_birth && ` • ${Math.abs(new Date(Date.now() - new Date(patientData.patient.date_of_birth).getTime()).getUTCFullYear() - 1970)} years`}
                {patientData.patient.sex && ` • ${patientData.patient.sex}`}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                <X className="w-5 h-5 mr-2" />
                Close
              </Button>
              <Button onClick={handleSignOff} disabled={isSubmitting || !diagnosis}>
                <Save className="w-5 h-5 mr-2" />
                {isSubmitting ? 'Saving...' : 'Sign & Generate Record'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-medium transition-all
                    ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="bg-white rounded-xl shadow p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Chief Complaint</h3>
              <p className="text-xl text-gray-900">{patientData.intake_history[0]?.transcript || 'Not provided'}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Demographics</h3>
                <div className="space-y-2 text-gray-900">
                  <p>Name: {patientData.patient.full_name}</p>
                  {patientData.patient.date_of_birth && <p>Age: {Math.abs(new Date(Date.now() - new Date(patientData.patient.date_of_birth).getTime()).getUTCFullYear() - 1970)} years</p>}
                  {patientData.patient.sex && <p>Sex: {patientData.patient.sex}</p>}
                  {patientData.patient.phone && <p>Phone: {patientData.patient.phone}</p>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Visit Info</h3>
                <div className="space-y-2 text-gray-900">
                  <p>Token: {patientData.token_number}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">History of Present Illness</h3>
            {patientData.intake_history.filter((i: any) => i.answer_category !== 'ayurveda').length > 0 ? (
              <div className="space-y-4">
                {patientData.intake_history.filter((i: any) => i.answer_category !== 'ayurveda').map((item: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900">{item.question_text}</h4>
                    <p className="text-gray-700 mt-1">{item.transcript}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No history recorded</p>
            )}
          </div>
        )}

        {activeTab === 'ayurveda' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ayurvedic Assessment</h3>
            {patientData.intake_history.filter((i: any) => i.answer_category === 'ayurveda').length > 0 ? (
              <div className="space-y-4">
                {patientData.intake_history.filter((i: any) => i.answer_category === 'ayurveda').map((item: any, index: number) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-900">{item.question_text}</h4>
                    <p className="text-gray-700 mt-1">{item.transcript}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No ayurvedic assessment</p>
            )}
          </div>
        )}

        {activeTab === 'meds' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Current Medications</h3>
            {(() => {
              const allMeds = patientData.documents.flatMap((doc: any) => doc.medications || []);
              return allMeds.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Medication</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dose</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Frequency</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {allMeds.map((med: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-gray-900">{med.name}</td>
                          <td className="px-4 py-3 text-gray-700">{med.dose || '—'}</td>
                          <td className="px-4 py-3 text-gray-700">{med.frequency || '—'}</td>
                          <td className="px-4 py-3 text-gray-700">{med.duration || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No medications recorded</p>
              );
            })()}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Documents</h3>
            {patientData.documents.length > 0 ? (
              <div className="space-y-4">
                {patientData.documents.map((doc: any, index: number) => (
                  <div key={index} className="border p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900">{doc.file_name}</h4>
                    <p className="text-sm text-gray-500 mb-2">Status: {doc.status}</p>
                    {doc.ocr_text && (
                      <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap">
                        {doc.ocr_text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No documents uploaded</p>
            )}
          </div>
        )}

        {activeTab === 'prescription' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Diagnosis</h3>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter diagnosis..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Prescription & Notes</h3>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Enter prescription and treatment notes..."
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

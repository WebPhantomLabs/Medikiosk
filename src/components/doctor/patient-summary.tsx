'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Save, FileText, Pill, Stethoscope, Activity, X, AlertTriangle } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setError(null);
        const response = await doctor.getPatient(tokenNumber);
        setPatientData(response.data);
      } catch (err: any) {
        console.error('Failed to fetch patient data:', err);
        setError('Failed to load patient record.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [tokenNumber]);

  const handleSignOff = async () => {
    setIsSubmitting(true);
    try {
      if (patientData) {
        await doctor.recordDiagnosis(patientData.session_id, { diagnosis_text: diagnosis, notes: prescription });
        onSignOff();
      }
    } catch (error) {
      console.error('Failed to sign off:', error);
      alert('Failed to save record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[var(--mk-bg)]">
        <div className="bg-[var(--mk-surface)] border-b border-[var(--mk-border)] p-6 shadow-sm animate-mk-shimmer h-24" />
        <div className="flex-1 p-6 space-y-6 overflow-hidden">
          <div className="h-64 bg-[var(--mk-surface)] rounded-xl animate-mk-shimmer" />
          <div className="h-64 bg-[var(--mk-surface)] rounded-xl animate-mk-shimmer" />
        </div>
      </div>
    );
  }

  if (error || !patientData) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center p-6 bg-[var(--mk-bg)]">
        <div className="text-center bg-[var(--mk-surface)] p-8 rounded-2xl shadow-sm border border-[var(--mk-border)] max-w-md w-full">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2 text-[var(--mk-text)]">Error Loading Record</h2>
          <p className="mb-6 text-[var(--mk-text-secondary)]">{error || 'Patient not found'}</p>
          <Button onClick={onClose} className="w-full" variant="outline">Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const age = patientData.patient.date_of_birth 
    ? Math.abs(new Date(new Date().getTime() - new Date(patientData.patient.date_of_birth).getTime()).getUTCFullYear() - 1970)
    : null;

  const generalHistory = patientData.intake_history.filter((i: any) => i.answer_category === 'general');
  const ayurvedaHistory = patientData.intake_history.filter((i: any) => i.answer_category === 'ayurveda');
  const allMeds = patientData.documents.flatMap((doc: any) => doc.medications || []);

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--mk-bg)]">
      <header className="flex-shrink-0 bg-[var(--mk-surface)] border-b border-[var(--mk-border)] z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="mr-2" aria-label="Go back">
              <X className="w-6 h-6 text-[var(--mk-text-secondary)]" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold px-2 py-0.5 rounded bg-[var(--mk-surface-muted)] text-[var(--mk-text)]">
                  {patientData.token_number}
                </span>
                <h1 className="text-xl font-bold text-[var(--mk-text)] truncate max-w-[200px] sm:max-w-md">
                  {patientData.patient.full_name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--mk-text-secondary)] mt-1">
                {age !== null && <span>{age} yrs</span>}
                {age !== null && patientData.patient.sex && <span>•</span>}
                {patientData.patient.sex && <span className="capitalize">{patientData.patient.sex}</span>}
                {patientData.patient.phone && <span>•</span>}
                {patientData.patient.phone && <span>{patientData.patient.phone}</span>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto space-y-12 pb-24">
          <section>
            <h2 className="text-sm font-bold text-[var(--mk-text-secondary)] uppercase tracking-wider mb-4 flex items-center">
              <Stethoscope className="w-4 h-4 mr-2" /> Reason for Visit
            </h2>
            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
              <p className="text-xl text-[var(--mk-text)] leading-relaxed font-medium">
                &quot;{generalHistory[0]?.transcript || 'Not provided'}&quot;
              </p>
            </div>
          </section>

          {generalHistory.length > 1 && (
            <section>
              <h2 className="text-sm font-bold text-[var(--mk-text-secondary)] uppercase tracking-wider mb-4 flex items-center">
                <Activity className="w-4 h-4 mr-2" /> Medical History & Symptoms
              </h2>
              <div className="space-y-6">
                {generalHistory.slice(1).map((item: any, index: number) => (
                  <div key={index} className="pl-4 border-l-2 border-[var(--mk-border-strong)]">
                    <h3 className="text-sm font-semibold text-[var(--mk-text-secondary)] mb-1">{item.question_text}</h3>
                    <p className="text-lg text-[var(--mk-text)] break-words">{item.transcript}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {ayurvedaHistory.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[var(--mk-text-secondary)] uppercase tracking-wider mb-4 flex items-center">
                <Activity className="w-4 h-4 mr-2" /> Ayurveda Assessment
              </h2>
              <div className="space-y-6">
                {ayurvedaHistory.map((item: any, index: number) => (
                  <div key={index} className="pl-4 border-l-2 border-green-500">
                    <h3 className="text-sm font-semibold text-[var(--mk-text-secondary)] mb-1">{item.question_text}</h3>
                    <p className="text-lg text-[var(--mk-text)] break-words">{item.transcript}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-bold text-[var(--mk-text-secondary)] uppercase tracking-wider mb-4 flex items-center">
              <Pill className="w-4 h-4 mr-2" /> Extracted Medications
            </h2>
            {allMeds.length > 0 ? (
              <div className="bg-white rounded-xl border border-[var(--mk-border)] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead className="bg-[var(--mk-surface-muted)] text-[var(--mk-text-secondary)] text-sm">
                    <tr>
                      <th className="px-6 py-3 font-medium">Medication</th>
                      <th className="px-6 py-3 font-medium">Dose</th>
                      <th className="px-6 py-3 font-medium">Frequency</th>
                      <th className="px-6 py-3 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--mk-border)]">
                    {allMeds.map((med: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 font-medium text-[var(--mk-text)] whitespace-normal break-words">
                          {med.name}
                          {med.source === 'ai_extracted' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              AI Extracted
                            </span>
                          )}
                          {med.requires_verification && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                              Needs Verification
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[var(--mk-text-secondary)]">{med.dose || '-'}</td>
                        <td className="px-6 py-4 text-[var(--mk-text-secondary)]">{med.frequency || '-'}</td>
                        <td className="px-6 py-4 text-[var(--mk-text-secondary)]">{med.duration || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[var(--mk-text-muted)] italic">No medications extracted from documents.</p>
            )}
          </section>

          {patientData.documents.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[var(--mk-text-secondary)] uppercase tracking-wider mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2" /> Patient Documents
              </h2>
              <div className="space-y-4">
                {patientData.documents.map((doc: any, index: number) => (
                  <div key={index} className="bg-white rounded-xl border border-[var(--mk-border)] p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-5 h-5 text-[var(--mk-text-muted)] flex-shrink-0" />
                        <h4 className="font-semibold text-[var(--mk-text)] truncate">{doc.file_name}</h4>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-[var(--mk-surface-muted)] text-[var(--mk-text-secondary)] flex-shrink-0">
                        {doc.status}
                      </span>
                    </div>
                    {doc.ocr_text ? (
                      <div className="bg-[var(--mk-bg)] p-4 rounded-lg text-sm text-[var(--mk-text-secondary)] whitespace-pre-wrap font-mono overflow-wrap-anywhere break-words">
                        {doc.ocr_text}
                      </div>
                    ) : (
                      <p className="text-[var(--mk-text-muted)] italic text-sm">No text extracted.</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="pt-8 border-t border-[var(--mk-border-strong)]">
            <h2 className="text-xl font-bold text-[var(--mk-text)] mb-6 flex items-center">
              <Edit className="w-5 h-5 mr-2 text-[var(--mk-primary)]" /> Clinical Notes & Prescription
            </h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="diagnosis" className="block text-sm font-bold text-[var(--mk-text-secondary)] mb-2">Diagnosis (Required)</label>
                <textarea
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter confirmed diagnosis..."
                  className="w-full min-h-[100px] p-4 bg-white border border-[var(--mk-border-strong)] rounded-xl focus:border-[var(--mk-primary)] focus:ring-1 focus:ring-[var(--mk-primary)] outline-none resize-y"
                  required
                />
              </div>

              <div>
                <label htmlFor="prescription" className="block text-sm font-bold text-[var(--mk-text-secondary)] mb-2">Treatment Plan & Prescription</label>
                <textarea
                  id="prescription"
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="Rx:&#10;1.&#10;2.&#10;&#10;Advise:"
                  className="w-full min-h-[200px] p-4 bg-white border border-[var(--mk-border-strong)] rounded-xl focus:border-[var(--mk-primary)] focus:ring-1 focus:ring-[var(--mk-primary)] outline-none resize-y font-mono text-sm"
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="flex-shrink-0 bg-[var(--mk-surface)] border-t border-[var(--mk-border)] p-4 sm:p-6 z-20">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[var(--mk-text-secondary)]">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Signing off will lock this record.
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {showConfirm ? (
              <>
                <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1 sm:flex-none">Cancel</Button>
                <Button className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white" onClick={handleSignOff} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Confirm Sign Off'}
                </Button>
              </>
            ) : (
              <Button size="lg" className="w-full sm:w-auto bg-[var(--mk-primary)]" onClick={() => setShowConfirm(true)} disabled={!diagnosis.trim()}>
                <Save className="w-5 h-5 mr-2" />
                Sign & Lock Record
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

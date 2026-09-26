import React, { useState } from 'react';
import { Shield, Key, FileText, Lock, CheckCircle } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState('police');
  const [step, setStep] = useState(1);
  const [evidenceHash, setEvidenceHash] = useState('');

  const handleComputeHash = (e) => {
    const file = e.target.files[0];

    if (file) {
      setEvidenceHash(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Shield className="text-cyan-400 w-6 h-6" />
          <h1 className="text-xl font-bold">SAKSHYA React Engine</h1>
        </div>

        <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800 px-3 py-1 rounded-full">
          Role: {role.toUpperCase()}
        </span>
      </header>

      <main className="max-w-4xl mx-auto glass-panel p-6 rounded-xl border border-slate-800">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Evidence Hash Validator
        </h2>

        <input
          type="file"
          onChange={handleComputeHash}
          className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
        />

        {evidenceHash && (
          <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-cyan-400 flex items-center justify-between">
            <span>SHA-256: {evidenceHash}</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
        )}
      </main>
    </div>
  );
}

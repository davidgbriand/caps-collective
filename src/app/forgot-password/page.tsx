'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-pattern">
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#99D6EA] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#00245D] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-md w-full animate-fadeIn relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#00245D]/10 p-8 border border-[#D4C4A8]">
          <div className="text-center mb-8">
            <Logo size="xl" showText={false} centered className="mb-4" />
            <h1 className="text-2xl font-extrabold text-[#00245D]">Reset Password</h1>
            <p className="mt-2 text-[#00245D]/60">We&apos;ll send you reset instructions</p>
          </div>

          {success ? (
            <div className="text-center animate-fadeIn">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">✉️</span></div>
              <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm mb-6">Check your email for password reset instructions.</div>
              <Link href="/login" className="text-[#00245D] hover:text-[#00245D]/70 font-semibold">← Return to sign in</Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2"><span>⚠️</span> {error}</div>}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#00245D] mb-1.5">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-4 py-3.5 border-2 border-[#D4C4A8] rounded-xl placeholder-[#00245D]/40 focus:outline-none focus:ring-0 focus:border-[#00245D] transition-colors" placeholder="you@example.com" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-[#00245D] text-white rounded-xl font-semibold shadow-lg shadow-[#00245D]/25 hover:shadow-xl hover:shadow-[#00245D]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>Sending...</span> : 'Send reset email'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-[#D4C4A8] text-center">
            <p className="text-[#00245D]/60">Remember your password? <Link href="/login" className="text-[#00245D] hover:text-[#00245D]/70 font-semibold">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}


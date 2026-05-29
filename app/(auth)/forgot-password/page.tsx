'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/ui/AuthLayout'; 

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Send the email request to your backend API route given in fetch
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      setMessage('An email will be sent to reset your password if this ID exists.');

      if (response.ok) {
        setTimeout(() => {
          router.push('/reset-password');
        }, 3000); 
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      headline={<>Reset<br />Your Password.</>}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="text-sm text-gray-500 mb-2">
          Enter your email address and we will send you instructions to reset your password.
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            disabled={isLoading}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm transition-all duration-200 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
          />
        </div>

        {message && (
          <div className="p-3 text-xs bg-orange-50 text-orange-800 rounded-lg border border-orange-100">
            {message}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-[#27272A] hover:bg-black transition-colors duration-150 shadow-sm disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>

        <div className="text-center text-xs pt-1">
          <a href="/" className="font-bold text-gray-500 hover:text-black hover:underline transition-colors">
            Back to Sign In
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}
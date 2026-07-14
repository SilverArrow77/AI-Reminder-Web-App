'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import { syncLocalTasksWithServer } from '@/lib/localSync';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const normalizeDisplayName = (value: unknown) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const normalized = trimmed.toLowerCase();
  if (normalized === 'undefined' || normalized === 'null') return '';
  return trimmed;
};

export default function SignUpForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryData, setCountryData] = useState({ dialCode: '', format: '' });
  const [countryCode, setCountryCode] = useState('ind');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const toast = useToast();

  const handleGoogleSignUp = () => {
    window.location.href = '/api/auth/google/start';
  };

  const isPhoneValid = () => {
    if (!phone) return false;
    const cleanDigits = phone.replace(/\D/g, '');
    if (!countryData.format) {
      return cleanDigits.length >= 10;
    }
    const totalExpectedDigits = (countryData.format.match(/\./g) || []).length;
    return cleanDigits.length === totalExpectedDigits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPhoneValid()) {
      toast.push({ title: 'Invalid phone', description: 'Please enter a valid complete phone number.', type: 'error' });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email,
          password,
          phone: `+${phone}`,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.push({ title: 'Account created', description: 'Account created successfully!', type: 'success' });
        const displayName = normalizeDisplayName(data.user?.username) || normalizeDisplayName(username.trim()) || normalizeDisplayName(email.split('@')[0]) || 'User';
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', displayName);
        localStorage.setItem('name', displayName);
        try { syncLocalTasksWithServer(data.token).catch(() => {}); } catch {}
        router.push('/lists');
        router.refresh();
      } else if (response.status === 409 || data.message?.toLowerCase().includes('exist')) {
        toast.push({ title: 'Account exists', description: 'An account with this username, email, or phone number already exists.', type: 'error' });
      } else {
        toast.push({ title: 'Sign up failed', description: data.message || 'Registration failed. Invalid credentials or data format.', type: 'error' });
      }
    } catch (error) {
      console.error("Sign up execution error:", error);
      toast.push({ title: 'Sign up failed', description: 'Something went wrong with the registration process. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      
      {/* NEW: NAME INPUT FIELD BLOCK */}
      <div>
        <label htmlFor="username" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Name
        </label>
        <input
          id="username"
          type="text"
          required
          value={username}
          disabled={isLoading}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="What should we call you?"
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm transition-all duration-200 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Email
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

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Phone Number
        </label>
        <PhoneInput
          country={countryCode}
          value={phone}
          disabled={isLoading}
          onChange={(value, country: any) => {
            setPhone(value);
            setCountryCode(country.iso2);
            setCountryData({
              dialCode: country.dialCode,
              format: country.format
            });
          }}
          placeholder="          Enter phone number"
          inputClass="!w-full !h-[42px] !px-4 !py-2.5 !bg-white !border !border-gray-200 !rounded-lg !text-sm !transition-all !duration-200 !placeholder-gray-300 focus:!outline-none focus:!border-orange-400 focus:!ring-1 focus:!ring-orange-400"
          containerClass="!w-full"
          buttonClass="!border-gray-200 !rounded-l-lg !bg-white" 
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          disabled={isLoading}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm transition-all duration-200 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-[#27272A] hover:bg-black transition-colors duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing Up..." : "Sign Up"}
        </button>
      </div>

      <div className="relative flex py-1 items-center justify-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white px-3 relative z-10">
          OR
        </span>
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-100"></div>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-300 hover:border-gray-400 rounded-full text-base font-medium text-black transition-colors duration-150"
        >
          <span>Sign Up with Google</span>
          <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
        </button>
      </div>
    </form>
  );
}
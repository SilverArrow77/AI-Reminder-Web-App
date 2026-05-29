'use client';

import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  headline: React.ReactNode;
}

export default function AuthLayout({ children, headline }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-orange-50 flex flex-col justify-between overflow-hidden font-sans select-none">
      
      {/* Navbar */}
      <header className="relative z-10 w-full flex items-center px-12 py-6">
        <div className="flex items-center space-x-2 text-3xl font-bold text-black tracking-tight">
          <span>Promptly</span>
          <span className="text-2xl">🔔</span>
        </div>

        <nav className="hidden md:flex items-center space-x-10 bg-white/60 backdrop-blur-md px-10 py-2.5 rounded-full shadow-sm border border-white/40 text-sm font-medium text-gray-700 mx-auto mr-80">
          <a href="#" className="hover:text-black transition-colors px-5">Features</a>
          <a href="#" className="hover:text-black transition-colors px-5">Pricing</a>
          <a href="#" className="hover:text-black transition-colors px-5">Blog</a>
          <a href="#" className="hover:text-black transition-colors px-5">About</a>
        </nav>
      </header>

      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center px-12 xl:px-24 max-w-7xl w-full mx-auto pb-12">
        
        <div className="lg:col-span-7 mb-12 lg:mb-0">
          <h1 className="text-7xl xl:text-8xl font-black text-black tracking-tight leading-[1.1] drop-shadow-sm">
            {headline}
          </h1>
        </div>

        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-105 bg-white p-8 rounded-2xl shadow-xl shadow-orange-100/40 border border-gray-100">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
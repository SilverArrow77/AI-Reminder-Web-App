import React from 'react';
import SignUpForm from '@/components/ui/SignUpForm';
import AuthLayout from '@/components/ui/AuthLayout';

export default function SignUpPage() {
  return (
    <AuthLayout 
      headline={<>Join Us <br /> Today</>}
    >
      <SignUpForm />
    </AuthLayout>
  );
}
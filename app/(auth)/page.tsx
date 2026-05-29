import LoginForm from '../../components/ui/LoginForm';
import AuthLayout from '../../components/ui/AuthLayout';

export default function LoginPage() {
  return (
    <AuthLayout 
      headline={<>Your Warm <br /> Reminders</>}
    >
      <LoginForm />
    </AuthLayout>
  );
}
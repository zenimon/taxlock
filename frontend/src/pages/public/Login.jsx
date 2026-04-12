import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard';
import LoginForm from '../../components/auth/LoginForm';

const Login = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#534AB7] font-medium hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <LoginForm onSuccess={handleLoginSuccess} />
    </AuthCard>
  );
};

export default Login;

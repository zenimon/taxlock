import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard';
import SignupForm from '../../components/auth/SignupForm';

const Signup = () => {
  const navigate = useNavigate();

  const handleSignupSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start allocating smarter today"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-[#534AB7] font-medium hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm onSuccess={handleSignupSuccess} />
    </AuthCard>
  );
};

export default Signup;

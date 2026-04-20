import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const AuthCard = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={logo} alt="TaxFlow" className="h-12 w-12 rounded-xl mx-auto" />
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-gray-600">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCard;

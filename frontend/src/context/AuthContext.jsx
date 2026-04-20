import { createContext, useContext, useState } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const storedApiKey = localStorage.getItem('apiKey');
    const storedTenant = localStorage.getItem('tenant');

    if (storedApiKey && storedTenant) {
      try {
        return {
          isAuthenticated: true,
          tenant: JSON.parse(storedTenant),
          apiKey: storedApiKey,
          isLoading: false,
        };
      } catch {
        return {
          isAuthenticated: false,
          tenant: null,
          apiKey: null,
          isLoading: false,
        };
      }
    }
    return {
      isAuthenticated: false,
      tenant: null,
      apiKey: null,
      isLoading: false,
    };
  });

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { tenant, apiKey } = response.data;

    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('tenant', JSON.stringify(tenant));

    setAuth({
      isAuthenticated: true,
      tenant,
      apiKey,
      isLoading: false,
    });

    return response.data;
  };

  const signup = async (businessName, email, password) => {
    const response = await apiClient.post('/auth/register', {
      businessName,
      email,
      password,
    });
    const { tenant, apiKey } = response.data;

    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('tenant', JSON.stringify(tenant));

    setAuth({
      isAuthenticated: true,
      tenant,
      apiKey,
      isLoading: false,
    });

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('apiKey');
    localStorage.removeItem('tenant');
    setAuth({
      isAuthenticated: false,
      tenant: null,
      apiKey: null,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

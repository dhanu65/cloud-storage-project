import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import './AuthPage.css';

const AuthPage = ({ onLoginSuccess }) => {
  const [showLogin, setShowLogin] = useState(true);
  return (
    <div className="auth-container">
      {showLogin ? (
        <div>
          <Login onLoginSuccess={onLoginSuccess} />
          <div className="toggle-auth">
            Don't have an account?{' '}
            <button className="btn-toggle" onClick={() => setShowLogin(false)}>Register</button>
          </div>
        </div>
      ) : (
        <div>
          <Register />
          <div className="toggle-auth">
            Already have an account?{' '}
            <button className="btn-toggle" onClick={() => setShowLogin(true)}>Login</button>
          </div>
        </div>
      )}
    </div>
  );
};
export default AuthPage;
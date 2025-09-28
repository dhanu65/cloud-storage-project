import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { username, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', { username, password });
      localStorage.setItem('token', res.data.token);
      toast.success('Login successful!');
      onLoginSuccess();
      navigate('/dashboard');
    } catch (err) {
      toast.error('Login failed: Invalid Credentials');
    }
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      <form onSubmit={onSubmit} autoComplete="off">
        <div className="form-group">
          <label>Username</label>
          <input type="text" name="username" value={username} onChange={onChange} required autoComplete="off" />
        </div>
        <div className="form-group" style={{ position: 'relative' }}>
          <label>Password</label>
          <input type={showPassword ? 'text' : 'password'} name="password" value={password} onChange={onChange} minLength="6" required autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '40px', background: 'none', border: 'none', cursor: 'pointer' }}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <button type="submit" className="btn-submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
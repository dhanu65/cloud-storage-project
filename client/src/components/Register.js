import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { username, password } = formData;
  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = `${process.env.REACT_APP_API_URL}/api/users/register`;
      await axios.post(url, { username, password });
      toast.success('Registration successful! Please log in.');
    } catch (err) {
      toast.error('Registration failed: User may already exist.');
    }
  };

  return (
    <div className="auth-form">
      <h2>Register</h2>
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
        <button type="submit" className="btn-submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
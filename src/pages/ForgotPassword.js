import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const Api = "https://s-doctorbackend-admin.onrender.com"
  // const Api = "http://localhost:5000"

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${Api}/api/admin/forgot-password`, { email });
      toast.success('Reset token generated! Check console for token.');
      console.log('Reset Token:', response.data.resetToken);
      navigate('/reset-password', { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process request');
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[400px] h-[400px] rounded-full bg-blue-400/20 blur-3xl"></div>
        <div className="absolute top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-cyan-300/20 blur-3xl"></div>
        <div className="absolute -bottom-[10%] left-[10%] w-[450px] h-[450px] rounded-full bg-teal-300/20 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md p-10 bg-white/80 backdrop-blur-xl shadow-2xl rounded-[2rem] z-10 border border-white/50">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 tracking-tight mb-2">
            Reset Password
          </h2>
          <p className="text-gray-500 text-sm font-medium">Enter your email and we'll send you a link</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-cyan-500/30 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:scale-100 flex justify-center items-center"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {isLoading ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
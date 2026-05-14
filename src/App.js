import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import DoctorPanel from './pages/DoctorPanel';
import SavedAvailabilities from './pages/SavedAvailabilities';
import Login from './pages/Login';
// import Signup from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  const Api = "https://s-doctorbackend-admin.onrender.com"
  // const Api = "http://localhost:5000"

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      try {
        await axios.get(`${Api}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const PrivateRoute = ({ children }) => {
    if (isAuthenticated === null) return null;
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        {/* <Route path="/signup" element={<Signup />} /> */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/admin/panel"
          element={
            <PrivateRoute>
              <DoctorPanel />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/availabilities"
          element={
            <PrivateRoute>
              <SavedAvailabilities />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;

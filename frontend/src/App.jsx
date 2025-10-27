import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import BatchList from './pages/farmer/BatchList';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import Marketplace from './pages/Marketplace';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />

            <Route
              path="/farmer/dashboard"
              element={
                <ProtectedRoute requiredType="farmer">
                  <FarmerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/batches"
              element={
                <ProtectedRoute requiredType="farmer">
                  <BatchList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/buyer/dashboard"
              element={
                <ProtectedRoute requiredType="buyer">
                  <BuyerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/marketplace"
              element={
                <ProtectedRoute>
                  <Marketplace />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

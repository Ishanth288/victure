import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import UpdateProfile from './pages/UpdateProfile';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import PurchaseOrders from './pages/PurchaseOrders';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { Toaster } from 'sonner';
import VictureAI from "./components/chatbot/VictureAI";

function App() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              currentUser ? <Dashboard /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/dashboard"
            element={
              currentUser ? <Dashboard /> : <Navigate to="/login" />
            }
          />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/update-profile"
            element={
              currentUser ? <UpdateProfile /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/inventory"
            element={
              currentUser ? <Inventory /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/sales"
            element={currentUser ? <Sales /> : <Navigate to="/login" />}
          />
          <Route
            path="/purchase-orders"
            element={
              currentUser ? <PurchaseOrders /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/customers"
            element={
              currentUser ? <Customers /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/suppliers"
            element={
              currentUser ? <Suppliers /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/reports"
            element={currentUser ? <Reports /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={
              currentUser ? <Settings /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </Router>
      <Toaster />
      <VictureAI />
    </div>
  );
}

export default App;

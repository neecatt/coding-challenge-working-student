import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Tickets from './components/Tickets';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated, getCurrentUserFromStorage } from './api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    const hasToken = isAuthenticated();
    const currentUser = getCurrentUserFromStorage();
    
    if (hasToken && currentUser) {
      setUser(currentUser);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#666' }}>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/tickets" replace /> : <Login onLogin={checkAuth} />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/tickets" replace /> : <Register onRegister={checkAuth} />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/tickets" 
          element={
            <ProtectedRoute>
              <Tickets onLogout={checkAuth} />
            </ProtectedRoute>
          } 
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={<Navigate to={user ? "/tickets" : "/login"} replace />} 
        />
        
        {/* Catch all - redirect to login */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/tickets" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;

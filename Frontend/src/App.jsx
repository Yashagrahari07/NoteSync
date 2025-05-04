import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';
import LandingPage from './pages/LandingPage/LandingPage';
import JoinNote from './pages/JoinNote/JoinNote';
import EditNote from './pages/EditNote/EditNote';
import PrivateRoute from './components/PrivateRoute';

const NotFoundPage = () => (
  <div style={{ textAlign: 'center', marginTop: '50px' }}>
    <h1 style={{ fontSize: '3rem', color: '#ff6b6b' }}>404 - Page Not Found</h1>
    <p style={{ fontSize: '1.5rem', color: '#555' }}>
      Oops! The page you are looking for does not exist.
    </p>
    <a
      href="/"
      style={{
        display: 'inline-block',
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '5px',
      }}
    >
      Go Back to Home
    </a>
  </div>
);

const App = () => {
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('authToken='))
    ?.split('=')[1];

  return (
    <Router>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/signup" element={token ? <Navigate to="/dashboard" /> : <SignUp />} />

        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <LandingPage />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/edit-note/:noteId"
          element={
            <PrivateRoute>
              <EditNote />
            </PrivateRoute>
          }
        />
        <Route
          path="/join-note"
          element={
            <PrivateRoute>
              <JoinNote />
            </PrivateRoute>
          }
        />

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" />} />
      </Routes>
    </Router>
  );
};

export default App;

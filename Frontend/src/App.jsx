import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';
import CreateNote from './pages/CreateNote/CreateNote';
import LandingPage from './pages/LandingPage/LandingPage';

const routes = (
  <Router>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" exact element={<Home />} />
      <Route path="/login" exact element={<Login />} />
      <Route path="/signup" exact element={<SignUp />} />
      <Route path="/create-note/:id" element={<CreateNote />} />
    </Routes>
  </Router>
);

const App = () => {
  return (
    <>
      <div>{routes}</div>
    </>
  )
}

export default App

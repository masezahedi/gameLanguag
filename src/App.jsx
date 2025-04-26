import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AddWord from './pages/AddWord';
import WordList from './pages/WordList';
import Game from './pages/Game';
import LeitnerGame from './pages/LeitnerGame';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <Container className="py-4 flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          <Route 
            path="/add-word" 
            element={
              <ProtectedRoute>
                <AddWord />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/words" 
            element={
              <ProtectedRoute>
                <WordList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/game" 
            element={
              <ProtectedRoute>
                <Game />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leitner" 
            element={
              <ProtectedRoute>
                <LeitnerGame />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Container>
      <footer className="bg-dark text-white text-center py-3">
        <Container>
          <p className="mb-0">بازی حافظه زبان &copy; {new Date().getFullYear()}</p>
        </Container>
      </footer>
    </div>
  );
}

export default App;
import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen } from 'lucide-react';

function Navbar() {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="md">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <BookOpen className="me-2" />
          <span>بازی حافظه زبان</span>
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="navbar-nav" />
        <BootstrapNavbar.Collapse id="navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">صفحه اصلی</Nav.Link>
            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/add-word">افزودن لغت</Nav.Link>
                <Nav.Link as={Link} to="/words">لیست لغات</Nav.Link>
                <Nav.Link as={Link} to="/game">بازی حافظه</Nav.Link>
                <Nav.Link as={Link} to="/leitner">جعبه لایتنر</Nav.Link>
                <Nav.Item className="d-flex align-items-center">
                  <span className="text-light mx-2">{currentUser.username}</span>
                  <Button variant="outline-light" size="sm" onClick={handleLogout}>خروج</Button>
                </Nav.Item>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">ورود</Nav.Link>
                <Nav.Link as={Link} to="/register">ثبت‌نام</Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}

export default Navbar;
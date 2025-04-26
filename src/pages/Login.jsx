import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!username || !password) {
      return setError('لطفا تمام فیلدها را پر کنید');
    }

    try {
      setError('');
      setLoading(true);
      const result = await login(username, password);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('خطا در ورود به سیستم');
      console.error(err);
    }
    
    setLoading(false);
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">ورود به حساب کاربری</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>نام کاربری</Form.Label>
                  <Form.Control 
                    type="text" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="password">
                  <Form.Label>رمز عبور</Form.Label>
                  <Form.Control 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100" 
                  disabled={loading}
                >
                  {loading ? 'در حال ورود...' : 'ورود'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          
          <div className="text-center mt-3">
            حساب کاربری ندارید؟{' '}
            <Link to="/register">ثبت‌نام کنید</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
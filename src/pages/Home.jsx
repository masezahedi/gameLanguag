import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BookPlus, GamepadIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Nav } from 'react-bootstrap';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Container>
      <Row className="justify-content-center text-center mb-5">
        <Col md={10} lg={8}>
          <h1 className="display-4 mb-4">به بازی حافظه زبان خوش آمدید</h1>
          <p className="lead mb-5">
            لغات انگلیسی را به همراه ترجمه آنها اضافه کنید و با بازی کارت حافظه، آنها را به خاطر بسپارید.
          </p>
        </Col>
      </Row>

      {isAuthenticated ? (
        <div className="container mt-5">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">بازی حافظه</h5>
                  <p className="card-text">
                    در این بازی شما می‌توانید با کارت‌های حافظه، لغات را تمرین کنید.
                  </p>
                  <Link to="/game" className="btn btn-primary">
                    شروع بازی حافظه
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">جعبه لایتنر</h5>
                  <p className="card-text">
                    با استفاده از سیستم جعبه لایتنر، لغات را به صورت هدفمند و مؤثر مرور کنید.
                  </p>
                  <Link to="/leitner" className="btn btn-success">
                    شروع مرور با جعبه لایتنر
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">لیست لغات</h5>
                  <p className="card-text">
                    مدیریت و مشاهده لیست تمام لغات
                  </p>
                  <Link to="/words" className="btn btn-info">
                    مشاهده لیست لغات
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">افزودن لغت جدید</h5>
                  <p className="card-text">
                    اضافه کردن لغات جدید به مجموعه لغات
                  </p>
                  <Link to="/add-word" className="btn btn-warning">
                    افزودن لغت جدید
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title className="mb-4">برای استفاده از امکانات برنامه، لطفا وارد شوید</Card.Title>
                <div className="d-flex justify-content-center gap-3">
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/login')}
                  >
                    ورود
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/register')}
                  >
                    ثبت‌نام
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default Home;
import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Container, Row, Col, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function LeitnerGame() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    box1: 0,
    box2: 0,
    box3: 0,
    box4: 0,
    box5: 0
  });
  const [allWords, setAllWords] = useState([]);
  const [totalWords, setTotalWords] = useState(0);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await Promise.all([loadWords(), loadStats()]);
      } catch (err) {
        setError('خطا در بارگذاری اطلاعات');
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  const loadWords = async () => {
    try {
      const response = await axios.get('/api/leitner/words-for-review');
      const wordsForReview = response.data;
      setWords(wordsForReview);
      setError('');
    } catch (err) {
      console.error('خطا در دریافت لغات:', err);
      setError('خطا در بارگیری لغات');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/leitner/stats');
      setStats(response.data);
    } catch (err) {
      console.error('خطا در بارگیری آمار:', err);
    }
  };

  const loadTotalWords = async () => {
    try {
      const response = await axios.get('/api/words/total');
      setTotalWords(response.data.total);
    } catch (err) {
      console.error('خطا در دریافت تعداد کل لغات:', err);
    }
  };

  const handleAnswer = async (isCorrect) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/leitner/answer', {
        wordId: currentWord.id,
        isCorrect
      });

      if (response.data.success) {
        // حذف لغت فعلی از لیست لغات قابل مرور
        setWords(prevWords => prevWords.filter(w => w.id !== currentWord.id));
        
        // ریست کردن نمایش ترجمه برای لغت بعدی
        setShowTranslation(false);
        
        // بروزرسانی آمار
        loadStats();
        
        // نمایش پیام موفقیت
        setMessage({
          type: 'success',
          text: isCorrect ? 'آفرین! پاسخ صحیح بود.' : 'اشکال نداره! دفعه بعد بهتر میشه.'
        });
      }
    } catch (err) {
      console.error('خطا در ثبت پاسخ:', err);
      setMessage({
        type: 'danger',
        text: 'خطا در ثبت پاسخ. لطفاً دوباره تلاش کنید.'
      });
    } finally {
      setLoading(false);
    }
  };

  const BoxesInfo = ({ stats }) => (
    <Row className="mt-4 g-4">
      {Object.entries(stats).map(([box, count], index) => (
        <Col key={box} xs={6} md={4} lg={2}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="p-2">
              <h6 className="mb-2">جعبه {index + 1}</h6>
              <div className="mb-2">
                <span className="h4">{count}</span>
                <span className="text-muted small"> لغت</span>
              </div>
              <div className="text-muted small">
                {index === 0 && "مرور روزانه"}
                {index === 1 && "هر 2 روز"}
                {index === 2 && "هر 5 روز"}
                {index === 3 && "هر 8 روز"}
                {index === 4 && "هر 14 روز"}
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">در حال بارگیری...</p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <Container>
        <h2 className="text-center mb-4">جعبه لایتنر</h2>
        <Alert variant="info" className="text-center">
          {allWords.length === 0 
            ? 'هنوز هیچ لغتی اضافه نکرده‌اید.'
            : 'در حال حاضر لغتی برای مرور وجود ندارد.'}
        </Alert>
        <Card className="mb-4">
          <Card.Body>
            <h5>آمار کلی</h5>
            <p>تعداد کل لغات: {totalWords}</p>
          </Card.Body>
        </Card>
        <BoxesInfo stats={stats} />

        <Card className="mt-4">
          <Card.Header>
            <h5 className="mb-0">همه لغات</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {allWords.map((word) => (
                <Col key={word.id} xs={12} md={6} lg={4} className="mb-3">
                  <Card className="h-100">
                    <Card.Body>
                      <h6>{word.english_word}</h6>
                      <p className="text-muted mb-2">{word.translation}</p>
                      <small className="text-muted d-block">
                        جعبه: {word.box_number}
                      </small>
                      <small className="text-muted d-block">
                        مرور بعدی: {new Date(word.next_review).toLocaleDateString('fa-IR')}
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const currentWord = words[currentWordIndex];

  return (
    <Container>
      <h2 className="text-center mb-4">جعبه لایتنر</h2>
      
      <BoxesInfo stats={stats} />

      {error && error !== 'خطا در بارگیری لغات' && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card className="text-center mt-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <span>لغت {words.length} از {words.length}</span>
            <span>جعبه فعلی: {currentWord.box_number || 1}</span>
          </div>
        </Card.Header>
        <Card.Body>
          <Card.Title className="mb-4">{currentWord.english_word}</Card.Title>
          
          {!showTranslation ? (
            <Button 
              variant="primary" 
              onClick={() => setShowTranslation(true)}
              className="mb-3"
            >
              نمایش ترجمه
            </Button>
          ) : (
            <>
              <Card.Text className="mb-4 h5">
                {currentWord.translation}
              </Card.Text>
              <div className="d-flex justify-content-center gap-3">
                <Button 
                  variant="success" 
                  onClick={() => handleAnswer(true)}
                  disabled={loading}
                >
                  درست
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => handleAnswer(false)}
                  disabled={loading}
                >
                  غلط
                </Button>
              </div>
            </>
          )}
        </Card.Body>
        <Card.Footer className="text-muted">
          مرور بعدی: {new Date(currentWord.next_review).toLocaleDateString('fa-IR')}
        </Card.Footer>
      </Card>

      {/* نمایش پیشرفت */}
      <div className="mt-4 text-center">
        <p>
          {words.length} لغت باقی‌مانده برای مرور
        </p>
      </div>
    </Container>
  );
}

export default LeitnerGame; 
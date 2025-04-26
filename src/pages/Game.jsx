import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useGame } from '../contexts/GameContext';

function Game() {
  const { 
    cards, 
    flippedCards, 
    matchedPairs, 
    isLoading,
    gameCompleted,
    wordCount,
    fetchWordCount,
    startGame, 
    flipCard 
  } = useGame();
  
  const [selectedPairs, setSelectedPairs] = useState(4);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    fetchWordCount();
  }, []);

  const handleStartGame = async () => {
    setError('');
    
    if (wordCount < 2) {
      setError('حداقل 2 جفت لغت برای شروع بازی نیاز است');
      return;
    }
    
    const result = await startGame(selectedPairs);
    
    if (result.success) {
      setShowForm(false);
    } else {
      setError(result.message);
    }
  };

  const handlePlayAgain = () => {
    setShowForm(true);
  };

  const getCardClasses = (index) => {
    const isFlipped = flippedCards.includes(index) || matchedPairs.includes(cards[index].pairId);
    return `card-flip ${isFlipped ? 'flipped' : ''} ${
      matchedPairs.includes(cards[index].pairId) ? 'animate-success' : ''
    }`;
  };

  return (
    <Container>
      <h2 className="text-center mb-4">بازی حافظه</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {showForm ? (
        <Card className="shadow-sm mb-4">
          <Card.Body>
            {wordCount < 2 ? (
              <Alert variant="warning">
                شما باید حداقل 2 جفت لغت اضافه کنید تا بتوانید بازی را شروع کنید.
              </Alert>
            ) : (
              <>
                <p>
                  شما {wordCount} جفت لغت دارید. چند جفت می‌خواهید در بازی استفاده کنید؟
                </p>
                <Form.Group className="mb-3">
                  <Form.Label>تعداد جفت‌ها</Form.Label>
                  <Form.Control
                    type="number"
                    min={2}
                    max={wordCount}
                    value={selectedPairs}
                    onChange={(e) => setSelectedPairs(Math.max(2, Math.min(wordCount, parseInt(e.target.value))))}
                  />
                </Form.Group>
                <Button 
                  variant="primary" 
                  onClick={handleStartGame}
                  disabled={isLoading}
                >
                  {isLoading ? 'در حال بارگذاری...' : 'شروع بازی'}
                </Button>
              </>
            )}
          </Card.Body>
        </Card>
      ) : (
        <>
          {gameCompleted && (
            <Alert variant="success" className="mb-4">
              تبریک! شما تمام جفت‌ها را پیدا کردید.
              <Button 
                variant="outline-success" 
                size="sm" 
                className="ms-2"
                onClick={handlePlayAgain}
              >
                بازی مجدد
              </Button>
            </Alert>
          )}
          
          {isLoading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">در حال بارگذاری کارت‌ها...</p>
            </div>
          ) : (
            <Row xs={2} md={3} lg={4} className="g-4 mb-4">
              {cards.map((card, index) => (
                <Col key={index}>
                  <div className="memory-card-container">
                    <div 
                      className={getCardClasses(index)}
                      onClick={() => flipCard(index)}
                    >
                      <div className="card-front">
                        <div className="card-content">
                          <span className="question-mark">؟</span>
                        </div>
                      </div>
                      <div className="card-back">
                        <div className="card-content">
                          <span>{card.word}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
          
          <div className="text-center">
            <Button 
              variant="outline-secondary" 
              onClick={handlePlayAgain}
            >
              بازگشت
            </Button>
          </div>
        </>
      )}
    </Container>
  );
}

export default Game;
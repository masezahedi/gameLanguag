import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';

function AddWord() {
  const [englishWord, setEnglishWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!englishWord || !translation) {
      setMessage('لطفا هر دو فیلد را پر کنید');
      setMessageType('danger');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/words', { english_word: englishWord, translation });
      
      setMessage('لغت با موفقیت اضافه شد');
      setMessageType('success');
      setEnglishWord('');
      setTranslation('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'خطا در افزودن لغت');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">افزودن لغت جدید</h2>
              
              {message && <Alert variant={messageType}>{message}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="englishWord">
                  <Form.Label>لغت انگلیسی</Form.Label>
                  <Form.Control 
                    type="text" 
                    required 
                    value={englishWord}
                    onChange={(e) => setEnglishWord(e.target.value)}
                    placeholder="مثال: apple"
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="translation">
                  <Form.Label>ترجمه</Form.Label>
                  <Form.Control 
                    type="text" 
                    required 
                    value={translation}
                    onChange={(e) => setTranslation(e.target.value)}
                    placeholder="مثال: سیب"
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? 'در حال ذخیره...' : 'ذخیره لغت'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AddWord;
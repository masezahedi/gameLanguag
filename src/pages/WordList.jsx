import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { Pencil, Trash2, X, Check } from 'lucide-react';

function WordList() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingWord, setEditingWord] = useState(null);
  const [editForm, setEditForm] = useState({ english_word: '', translation: '' });

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      const response = await axios.get('/api/words');
      setWords(response.data);
    } catch (error) {
      setError('خطا در دریافت لیست لغات');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (word) => {
    setEditingWord(word.id);
    setEditForm({
      english_word: word.english_word,
      translation: word.translation
    });
  };

  const handleCancelEdit = () => {
    setEditingWord(null);
    setEditForm({ english_word: '', translation: '' });
  };

  const handleSaveEdit = async (id) => {
    try {
      await axios.put(`/api/words/${id}`, editForm);
      const updatedWords = words.map(word => 
        word.id === id ? { ...word, ...editForm } : word
      );
      setWords(updatedWords);
      setEditingWord(null);
      setEditForm({ english_word: '', translation: '' });
    } catch (error) {
      setError('خطا در ویرایش لغت');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این لغت اطمینان دارید؟')) {
      return;
    }

    try {
      await axios.delete(`/api/words/${id}`);
      setWords(words.filter(word => word.id !== id));
    } catch (error) {
      setError('خطا در حذف لغت');
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">در حال بارگذاری لیست لغات...</p>
      </div>
    );
  }

  return (
    <Container>
      <h2 className="text-center mb-4">لیست لغات</h2>
      
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      
      <Card className="shadow-sm">
        <Card.Body>
          {words.length === 0 ? (
            <p className="text-center mb-0">هنوز هیچ لغتی اضافه نکرده‌اید.</p>
          ) : (
            <div className="word-list">
              {words.map(word => (
                <div key={word.id} className="word-item p-3 border-bottom">
                  {editingWord === word.id ? (
                    <Row className="align-items-center">
                      <Col xs={12} md={5}>
                        <Form.Control
                          type="text"
                          value={editForm.english_word}
                          onChange={(e) => setEditForm({ ...editForm, english_word: e.target.value })}
                          placeholder="لغت انگلیسی"
                        />
                      </Col>
                      <Col xs={12} md={5}>
                        <Form.Control
                          type="text"
                          value={editForm.translation}
                          onChange={(e) => setEditForm({ ...editForm, translation: e.target.value })}
                          placeholder="ترجمه"
                          className="mt-2 mt-md-0"
                        />
                      </Col>
                      <Col xs={12} md={2} className="mt-2 mt-md-0 text-end">
                        <Button
                          variant="success"
                          size="sm"
                          className="me-2"
                          onClick={() => handleSaveEdit(word.id)}
                        >
                          <Check size={16} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <X size={16} />
                        </Button>
                      </Col>
                    </Row>
                  ) : (
                    <Row className="align-items-center">
                      <Col xs={12} md={5}>
                        <span className="fw-bold">{word.english_word}</span>
                      </Col>
                      <Col xs={12} md={5}>
                        <span className="text-muted">{word.translation}</span>
                      </Col>
                      <Col xs={12} md={2} className="text-end word-actions">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(word)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(word.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </Col>
                    </Row>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default WordList;
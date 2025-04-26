import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const GameContext = createContext();

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  async function fetchWordCount() {
    try {
      const response = await axios.get('/api/words/count');
      setWordCount(response.data.count);
      return response.data.count;
    } catch (error) {
      console.error('Error fetching word count:', error);
      return 0;
    }
  }

  async function startGame(pairs) {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/game/cards?pairs=${pairs}`);
      setCards(response.data);
      setFlippedCards([]);
      setMatchedPairs([]);
      setGameCompleted(false);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'خطا در شروع بازی' 
      };
    } finally {
      setIsLoading(false);
    }
  }

  function flipCard(index) {
    // Don't allow flipping if already two cards are flipped or the card is already flipped or matched
    if (
      flippedCards.length === 2 || 
      flippedCards.includes(index) || 
      matchedPairs.includes(cards[index].pairId)
    ) {
      return;
    }

    const newFlippedCards = [...flippedCards, index];
    setFlippedCards(newFlippedCards);

    // Check for a match if two cards are flipped
    if (newFlippedCards.length === 2) {
      const firstCardIndex = newFlippedCards[0];
      const secondCardIndex = newFlippedCards[1];
      const firstCard = cards[firstCardIndex];
      const secondCard = cards[secondCardIndex];

      if (
        firstCard.pairId === secondCard.pairId &&
        firstCard.type !== secondCard.type
      ) {
        // It's a match!
        setMatchedPairs([...matchedPairs, firstCard.pairId]);
        
        // Check if game is completed
        if (matchedPairs.length + 1 === cards.length / 2) {
          setGameCompleted(true);
        }
        
        // Reset flipped cards
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      } else {
        // Not a match, flip back after a delay
        setTimeout(() => {
          setFlippedCards([]);
        }, 1500);
      }
    }
  }

  const value = {
    cards,
    flippedCards,
    matchedPairs,
    isLoading,
    gameCompleted,
    wordCount,
    fetchWordCount,
    startGame,
    flipCard
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
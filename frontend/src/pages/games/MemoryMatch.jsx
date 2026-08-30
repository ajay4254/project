import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const EMOJI_POOL = ['🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍍', '🥝', '🥑', '🥕', '🌽', '🌻', '🌸', '🐘', '🦋', '⭐'];

export default function MemoryMatch() {
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'easy';
  const navigate = useNavigate();

  // Difficulty parameters
  const pairCount = difficulty === 'hard' ? 8 : difficulty === 'medium' ? 6 : 4;

  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [gameId, setGameId] = useState(1);
  const [gameFinished, setGameFinished] = useState(false);

  // Initialize Game
  useEffect(() => {
    // 1. Fetch game details to get actual game_id
    api.getGames().then(games => {
      const g = games.find(x => x.game_type === 'memory_match');
      if (g) {
        setGameId(g.id);
        api.startGameSession(g.id, difficulty).then(res => setSessionId(res.session_id));
      }
    }).catch(console.error);

    // 2. Setup cards
    const selectedEmojis = EMOJI_POOL.slice(0, pairCount);
    const cardDeck = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
      }));

    setCards(cardDeck);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setAttempts(0);
    setStartTime(Date.now());
    setGameFinished(false);
  }, [difficulty, pairCount]);

  // Handle card click
  const handleCardClick = (index) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedPairs.includes(cards[index].emoji)) {
      return;
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setAttempts(a => a + 1);
      const [first, second] = newFlipped;

      if (cards[first].emoji === cards[second].emoji) {
        // Match!
        const newMatches = [...matchedPairs, cards[first].emoji];
        setMatchedPairs(newMatches);
        setFlippedIndices([]);

        // Check victory
        if (newMatches.length === pairCount) {
          handleGameOver(attempts + 1, newMatches.length);
        }
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const handleGameOver = async (finalAttempts, correctCount) => {
    setGameFinished(true);
    const endTime = Date.now();
    const timeSpent = Math.max(5, Math.round((endTime - (startTime || endTime)) / 1000));

    // Calculate score: perfect score = 100%, penalties for extra attempts
    const minAttempts = pairCount;
    const efficiency = Math.max(0.3, Math.min(1.0, minAttempts / finalAttempts));
    const score = Math.round(efficiency * 100);

    const wrongAttempts = Math.max(0, finalAttempts - pairCount);

    try {
      const result = await api.submitGameResult(gameId, {
        game_id: gameId,
        session_id: sessionId,
        score,
        correct_answers: correctCount,
        wrong_answers: wrongAttempts,
        response_time: timeSpent,
        difficulty,
      });

      navigate(`/game-result?resultId=${result.id}`);
    } catch (err) {
      console.error('Failed to submit result:', err);
      // Fallback navigate with local state
      navigate(`/game-result?score=${score}&correct=${correctCount}&wrong=${wrongAttempts}&time=${timeSpent}&difficulty=${difficulty}&game=Memory+Matching`);
    }
  };

  return (
    <div className="page-container game-container">
      <div className="game-header">
        <h1>🃏 Memory Matching</h1>
        <p>Find all <strong>{pairCount} matching pairs</strong> by clicking on cards.</p>
        
        <div className="game-stats">
          <div className="game-stat">
            <div className="stat-value">{attempts}</div>
            <div className="stat-label">Attempts</div>
          </div>
          <div className="game-stat">
            <div className="stat-value">{matchedPairs.length} / {pairCount}</div>
            <div className="stat-label">Matched</div>
          </div>
          <div className="game-stat">
            <div className="stat-value"><span className="badge badge-stable">{difficulty.toUpperCase()}</span></div>
            <div className="stat-label">Difficulty</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className={`memory-grid ${difficulty}`}>
        {cards.map((card, idx) => {
          const isFlipped = flippedIndices.includes(idx);
          const isMatched = matchedPairs.includes(card.emoji);

          return (
            <div
              key={card.id}
              className={`memory-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
              onClick={() => handleCardClick(idx)}
            >
              {isFlipped || isMatched ? (
                <span>{card.emoji}</span>
              ) : (
                <span className="card-back">❓</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/games')}>
          ← Exit to Games Menu
        </button>
      </div>
    </div>
  );
}

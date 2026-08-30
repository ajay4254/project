import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GamesList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const navigate = useNavigate();

  useEffect(() => {
    api.getGames()
      .then(data => { setGames(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const handleStartGame = (gameType) => {
    navigate(`/games/${gameType}?difficulty=${selectedDifficulty}`);
  };

  return (
    <div className="page-container">
      <div className="text-center" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1>🎮 Cognitive Training Games</h1>
        <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)' }}>
          Choose a fun brain exercise to train your memory, recall, and attention.
        </p>
      </div>

      {/* Difficulty Selector */}
      <div className="card" style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
        <h3>Select Your Difficulty Level:</h3>
        <div className="difficulty-selector">
          <button
            className={`difficulty-btn easy ${selectedDifficulty === 'easy' ? 'active' : ''}`}
            onClick={() => setSelectedDifficulty('easy')}
          >
            🟢 Easy (Relaxed)
          </button>
          <button
            className={`difficulty-btn medium ${selectedDifficulty === 'medium' ? 'active' : ''}`}
            onClick={() => setSelectedDifficulty('medium')}
          >
            🟡 Medium (Standard)
          </button>
          <button
            className={`difficulty-btn hard ${selectedDifficulty === 'hard' ? 'active' : ''}`}
            onClick={() => setSelectedDifficulty('hard')}
          >
            🔴 Hard (Challenge)
          </button>
        </div>
      </div>

      {/* Game Cards */}
      <div className="game-select-grid">
        {/* Game 1 */}
        <div className="game-select-card" onClick={() => handleStartGame('memory_match')}>
          <div className="game-icon">🃏</div>
          <h2>Memory Matching</h2>
          <p>Flip cards and match identical symbols. Improves visual working memory and concentration.</p>
          <button className="btn btn-primary btn-lg btn-block">Play Matching 🚀</button>
        </div>

        {/* Game 2 */}
        <div className="game-select-card" onClick={() => handleStartGame('number_recall')}>
          <div className="game-icon">🔢</div>
          <h2>Number Recall</h2>
          <p>Remember a sequence of numbers shown briefly, then type them back. Enhances short-term memory.</p>
          <button className="btn btn-primary btn-lg btn-block">Play Recall 🚀</button>
        </div>

        {/* Game 3 */}
        <div className="game-select-card" onClick={() => handleStartGame('image_recall')}>
          <div className="game-icon">🖼️</div>
          <h2>Image Recall</h2>
          <p>Study a set of friendly icons, then identify which ones were shown. Boosts recognition and attention.</p>
          <button className="btn btn-primary btn-lg btn-block">Play Recognition 🚀</button>
        </div>
      </div>
    </div>
  );
}

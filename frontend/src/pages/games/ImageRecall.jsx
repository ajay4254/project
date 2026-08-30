import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ITEMS_POOL = [
  { emoji: '🍎', name: 'Apple' },
  { emoji: '🚗', name: 'Car' },
  { emoji: '☀️', name: 'Sun' },
  { emoji: '🏠', name: 'House' },
  { emoji: '🐶', name: 'Dog' },
  { emoji: '🌳', name: 'Tree' },
  { emoji: '☕', name: 'Tea' },
  { emoji: '🐘', name: 'Elephant' },
  { emoji: '🌸', name: 'Flower' },
  { emoji: '🔔', name: 'Bell' },
  { emoji: '⚽', name: 'Ball' },
  { emoji: '📚', name: 'Book' },
];

export default function ImageRecall() {
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'easy';
  const navigate = useNavigate();

  const targetCount = difficulty === 'hard' ? 6 : difficulty === 'medium' ? 5 : 4;
  const showDurationSeconds = difficulty === 'hard' ? 8 : difficulty === 'medium' ? 6 : 5;

  const [phase, setPhase] = useState('study'); // 'study' | 'select' | 'submitted'
  const [targetItems, setTargetItems] = useState([]);
  const [choiceOptions, setChoiceOptions] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [countdown, setCountdown] = useState(showDurationSeconds);
  const [startTime, setStartTime] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [gameId, setGameId] = useState(3);

  // Initialize Game
  useEffect(() => {
    // 1. Fetch game details
    api.getGames().then(games => {
      const g = games.find(x => x.game_type === 'image_recall');
      if (g) {
        setGameId(g.id);
        api.startGameSession(g.id, difficulty).then(res => setSessionId(res.session_id));
      }
    }).catch(console.error);

    // 2. Select target items and decoy items
    const shuffledPool = [...ITEMS_POOL].sort(() => Math.random() - 0.5);
    const targets = shuffledPool.slice(0, targetCount);
    const decoys = shuffledPool.slice(targetCount, targetCount + 4);
    const allChoices = [...targets, ...decoys].sort(() => Math.random() - 0.5);

    setTargetItems(targets);
    setChoiceOptions(allChoices);
    setSelectedItems([]);
    setPhase('study');
    setCountdown(showDurationSeconds);
  }, [difficulty, targetCount, showDurationSeconds]);

  // Countdown timer for study phase
  useEffect(() => {
    if (phase !== 'study') return;

    if (countdown <= 0) {
      setPhase('select');
      setStartTime(Date.now());
      return;
    }

    const timer = setInterval(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, countdown]);

  const toggleSelect = (item) => {
    if (selectedItems.some(x => x.name === item.name)) {
      setSelectedItems(selectedItems.filter(x => x.name !== item.name));
    } else {
      if (selectedItems.length < targetCount) {
        setSelectedItems([...selectedItems, item]);
      }
    }
  };

  const handleSubmit = async () => {
    setPhase('submitted');
    const endTime = Date.now();
    const timeSpent = Math.max(2, Math.round((endTime - (startTime || endTime)) / 1000));

    let correctCount = 0;
    const targetNames = targetItems.map(t => t.name);

    selectedItems.forEach(sel => {
      if (targetNames.includes(sel.name)) {
        correctCount++;
      }
    });

    const wrongCount = selectedItems.length - correctCount + (targetCount - correctCount);
    const score = Math.round((correctCount / targetCount) * 100);

    try {
      const result = await api.submitGameResult(gameId, {
        game_id: gameId,
        session_id: sessionId,
        score,
        correct_answers: correctCount,
        wrong_answers: wrongCount,
        response_time: timeSpent,
        difficulty,
      });

      navigate(`/game-result?resultId=${result.id}`);
    } catch (err) {
      console.error('Failed to submit result:', err);
      navigate(`/game-result?score=${score}&correct=${correctCount}&wrong=${wrongCount}&time=${timeSpent}&difficulty=${difficulty}&game=Image+Recall`);
    }
  };

  return (
    <div className="page-container game-container">
      <div className="game-header">
        <h1>🖼️ Image & Object Recall</h1>
        <p>Exercise your visual recognition and attention</p>
      </div>

      {phase === 'study' && (
        <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: 'var(--space-md)' }}>
            Study these {targetCount} items carefully:
          </h2>

          <div className="image-grid">
            {targetItems.map((item, idx) => (
              <div key={idx} className="image-card" style={{ cursor: 'default' }}>
                <span className="emoji">{item.emoji}</span>
                <span className="label">{item.name}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-xl)', fontSize: 'var(--font-size-lg)', color: 'var(--accent-orange)' }}>
            ⏳ Disappearing in <strong>{countdown}</strong> seconds...
          </div>
        </div>
      )}

      {phase === 'select' && (
        <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>
            Which items did you see?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
            Click to select <strong>{targetCount} items</strong> (Selected: {selectedItems.length}/{targetCount})
          </p>

          <div className="image-grid">
            {choiceOptions.map((item, idx) => {
              const isSelected = selectedItems.some(x => x.name === item.name);
              return (
                <div
                  key={idx}
                  className={`image-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleSelect(item)}
                >
                  <span className="emoji">{item.emoji}</span>
                  <span className="label">{item.name}</span>
                </div>
              );
            })}
          </div>

          <button
            className="btn btn-primary btn-lg btn-block"
            style={{ marginTop: 'var(--space-xl)', maxWidth: '400px', margin: 'var(--space-xl) auto 0 auto' }}
            onClick={handleSubmit}
            disabled={selectedItems.length === 0}
          >
            Submit Selections ({selectedItems.length}/{targetCount}) ✓
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/games')}>
          ← Exit to Games Menu
        </button>
      </div>
    </div>
  );
}

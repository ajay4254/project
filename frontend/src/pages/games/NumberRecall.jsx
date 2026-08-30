import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function NumberRecall() {
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'easy';
  const navigate = useNavigate();

  // Digit length based on difficulty
  const digitCount = difficulty === 'hard' ? 7 : difficulty === 'medium' ? 5 : 4;
  const showDurationSeconds = difficulty === 'hard' ? 7 : difficulty === 'medium' ? 6 : 5;

  const [phase, setPhase] = useState('memorize'); // 'memorize' | 'recall' | 'submitted'
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [countdown, setCountdown] = useState(showDurationSeconds);
  const [startTime, setStartTime] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [gameId, setGameId] = useState(2);

  // Initialize Game
  useEffect(() => {
    // 1. Fetch game details
    api.getGames().then(games => {
      const g = games.find(x => x.game_type === 'number_recall');
      if (g) {
        setGameId(g.id);
        api.startGameSession(g.id, difficulty).then(res => setSessionId(res.session_id));
      }
    }).catch(console.error);

    // 2. Generate random sequence of digits
    const seq = Array.from({ length: digitCount }, () => Math.floor(Math.random() * 10));
    setSequence(seq);
    setPhase('memorize');
    setCountdown(showDurationSeconds);
    setUserInput('');
  }, [difficulty, digitCount, showDurationSeconds]);

  // Countdown timer for memorize phase
  useEffect(() => {
    if (phase !== 'memorize') return;

    if (countdown <= 0) {
      setPhase('recall');
      setStartTime(Date.now());
      return;
    }

    const timer = setInterval(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setPhase('submitted');
    const endTime = Date.now();
    const timeSpent = Math.max(2, Math.round((endTime - (startTime || endTime)) / 1000));

    const userDigits = userInput.replace(/\s+/g, '').split('').map(Number);
    let correctCount = 0;
    for (let i = 0; i < sequence.length; i++) {
      if (userDigits[i] === sequence[i]) {
        correctCount++;
      }
    }

    const wrongCount = Math.max(0, sequence.length - correctCount);
    const score = Math.round((correctCount / sequence.length) * 100);

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
      navigate(`/game-result?score=${score}&correct=${correctCount}&wrong=${wrongCount}&time=${timeSpent}&difficulty=${difficulty}&game=Number+Recall`);
    }
  };

  return (
    <div className="page-container game-container">
      <div className="game-header">
        <h1>🔢 Number Recall</h1>
        <p>Strengthen your short-term numerical memory</p>
      </div>

      {phase === 'memorize' && (
        <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: 'var(--space-md)' }}>
            Remember these {digitCount} numbers:
          </h2>

          <div className="number-display">
            {sequence.map((num, i) => (
              <div key={i} className="number-digit">
                {num}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-xl)', fontSize: 'var(--font-size-lg)', color: 'var(--accent-orange)' }}>
            ⏳ Disappearing in <strong>{countdown}</strong> seconds...
          </div>
        </div>
      )}

      {phase === 'recall' && (
        <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
          <h2 style={{ marginBottom: 'var(--space-md)' }}>
            What numbers did you see?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
            Type the sequence of {digitCount} digits in order:
          </p>

          <form onSubmit={handleSubmit} className="number-input-area">
            <input
              type="text"
              className="form-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, '').slice(0, digitCount))}
              placeholder="e.g. 7392"
              autoFocus
              maxLength={digitCount}
              required
            />

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              style={{ marginTop: 'var(--space-xl)' }}
              disabled={userInput.length === 0}
            >
              Submit Answer ✓
            </button>
          </form>
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

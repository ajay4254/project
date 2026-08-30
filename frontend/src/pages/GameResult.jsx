import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GameResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resultId = searchParams.get('resultId');

  const [result, setResult] = useState({
    score: parseInt(searchParams.get('score') || '85', 10),
    correct_answers: parseInt(searchParams.get('correct') || '8', 10),
    wrong_answers: parseInt(searchParams.get('wrong') || '2', 10),
    response_time: parseFloat(searchParams.get('time') || '32'),
    difficulty: searchParams.get('difficulty') || 'easy',
    game_name: searchParams.get('game') || 'Cognitive Game',
    game_type: 'memory_match'
  });

  useEffect(() => {
    if (resultId) {
      api.getResult(resultId)
        .then(data => setResult(data))
        .catch(console.error);
    }
  }, [resultId]);

  const getPerformanceFeedback = (score) => {
    if (score >= 80) return { label: 'Good 🌟', color: 'var(--accent-green)', message: 'Outstanding performance! Your cognitive engagement is sharp.' };
    if (score >= 60) return { label: 'Moderate 👍', color: 'var(--accent-orange)', message: 'Well done! Consistent practice helps retain memory strength.' };
    return { label: 'Needs Attention 💪', color: 'var(--accent-red)', message: 'Good effort! Try an easier level next time to build confidence.' };
  };

  const perf = getPerformanceFeedback(result.score);

  return (
    <div className="page-container result-container">
      <div className="result-card">
        <div className="result-icon">
          {result.score >= 80 ? '🎉' : result.score >= 60 ? '👏' : '🌱'}
        </div>

        <h1>Game Completed!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>
          {result.game_name} ({result.difficulty})
        </p>

        <div className="result-score">
          {result.score}%
        </div>

        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <span className="badge" style={{ background: `${perf.color}20`, color: perf.color, fontSize: 'var(--font-size-base)', padding: '6px 18px' }}>
            Performance: {perf.label}
          </span>
          <p style={{ marginTop: 'var(--space-sm)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {perf.message}
          </p>
        </div>

        <div className="result-stats">
          <div className="result-stat">
            <div className="value" style={{ color: 'var(--accent-green)' }}>{result.correct_answers}</div>
            <div className="label">Correct</div>
          </div>
          <div className="result-stat">
            <div className="value" style={{ color: 'var(--accent-red)' }}>{result.wrong_answers}</div>
            <div className="label">Wrong</div>
          </div>
          <div className="result-stat">
            <div className="value" style={{ color: 'var(--primary)' }}>{Math.round(result.response_time)}s</div>
            <div className="label">Time Taken</div>
          </div>
        </div>

        <div className="result-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/games')}
          >
            Play Another Game 🎮
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => navigate('/dashboard')}
          >
            Back to Home 🏠
          </button>
        </div>
      </div>

      <div className="disclaimer">
        ℹ️ <strong>Note:</strong> Performance metrics are informational game scores and do not represent a clinical or medical diagnosis.
      </div>
    </div>
  );
}

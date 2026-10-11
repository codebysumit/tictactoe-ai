// Fixed minimax AI and episodic Monte Carlo reinforcement learning.

const AI = (() => {
  const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const STORAGE_KEY = 'tictactoe-reinforcement-v1';
  const DISCOUNT = 0.9;
  const LEARNING_RATE = 0.25;
  let qValues = {};
  let generation = 0;
  let episode = [];

  function winner(board) {
    for (const [a, b, c] of LINES) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return null;
  }

  const other = player => player === 'X' ? 'O' : 'X';

  function minimax(board, turn, me) {
    const result = winner(board);
    if (result) return result === me ? 1 : -1;
    if (board.every(Boolean)) return 0;

    const scores = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i]) continue;
      board[i] = turn;
      scores.push(minimax(board, other(turn), me));
      board[i] = '';
    }
    return turn === me ? Math.max(...scores) : Math.min(...scores);
  }

  function bestMoves(board, player) {
    let bestScore = -Infinity;
    const moves = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i]) continue;
      board[i] = player;
      const score = minimax(board, other(player), player);
      board[i] = '';
      if (score > bestScore) {
        bestScore = score;
        moves.length = 0;
        moves.push(i);
      } else if (score === bestScore) {
        moves.push(i);
      }
    }
    return moves;
  }

  function encode(board, player) {
    return board.map(cell => cell === player ? '1' : cell ? '-' : '0').join('');
  }

  function restoreProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);
    const validValues = data &&
      data.qValues &&
      typeof data.qValues === 'object' &&
      !Array.isArray(data.qValues) &&
      Object.entries(data.qValues).every(([state, values]) =>
        /^[10-]{9}$/.test(state) &&
        Array.isArray(values) &&
        values.length === 9 &&
        values.every(value => typeof value === 'number' && Number.isFinite(value))
      );
    if (!validValues || !Number.isInteger(data.generation) || data.generation < 0) {
      throw new Error('Saved reinforcement-learning data is invalid. Clear this site’s stored data to restart learning.');
    }
    qValues = data.qValues;
    generation = data.generation;
  }

  function startEpisode() {
    episode = [];
  }

  function getMove(board, player, strategy) {
    const legalMoves = board.map((cell, i) => cell ? -1 : i).filter(i => i >= 0);
    if (!legalMoves.length) return -1;

    if (strategy === 'reinforcement') {
      const state = encode(board, player);
      const values = qValues[state] || Array(9).fill(0);
      const explorationRate = Math.max(0.03, 0.2 / Math.sqrt(generation + 1));
      let move;
      if (Math.random() < explorationRate) {
        move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      } else {
        const bestValue = Math.max(...legalMoves.map(i => values[i]));
        const best = legalMoves.filter(i => values[i] === bestValue);
        move = best[Math.floor(Math.random() * best.length)];
      }
      episode.push({ state, action: move, ply: board.filter(Boolean).length });
      return move;
    }

    const moves = bestMoves(board.slice(), player);
    return moves[Math.floor(Math.random() * moves.length)];
  }

  async function learnFromOutcome(reward, onStatus) {
    if (!episode.length) return generation;

    const nextGeneration = generation + 1;
    const nextValues = { ...qValues };
    for (let i = 0; i < episode.length; i++) {
      const { state, action, ply } = episode[i];
      const values = nextValues[state] ? nextValues[state].slice() : Array(9).fill(0);
      const futureReward = reward * Math.pow(DISCOUNT, episode[episode.length - 1].ply - ply);
      values[action] += LEARNING_RATE * (futureReward - values[action]);
      nextValues[state] = values;
      onStatus(`Learning generation ${nextGeneration} · move ${i + 1}/${episode.length}`);
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      generation: nextGeneration,
      qValues: nextValues
    }));
    qValues = nextValues;
    generation = nextGeneration;
    episode = [];
    return generation;
  }

  function discardEpisode() {
    episode = [];
  }

  function hasEpisode() {
    return episode.length > 0;
  }

  return {
    winner,
    getMove,
    startEpisode,
    discardEpisode,
    hasEpisode,
    learnFromOutcome,
    restoreProgress,
    currentGeneration: () => generation
  };
})();

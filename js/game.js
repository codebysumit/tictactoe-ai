const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const infoEl = document.getElementById('aiInfo');
const modeEl = document.getElementById('mode');
const strategyEl = document.getElementById('strategy');
const sideEl = document.getElementById('side');

let board, current, over, aiThinking, isTraining;
let roundToken = 0;
let progressWarning = '';
const scores = { X: 0, O: 0, D: 0 };
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

// Build the 9 cells
const cells = [];
for (let i = 0; i < 9; i++) {
  const btn = document.createElement('button');
  btn.className = 'cell';
  btn.addEventListener('click', () => onCellClick(i));
  boardEl.appendChild(btn);
  cells.push(btn);
}

const isAI = () => modeEl.value === 'ai';
const humanSide = () => sideEl.value;
const aiSide = () => (humanSide() === 'X' ? 'O' : 'X');

function newRound() {
  if (isTraining) return;
  roundToken++;
  AI.discardEpisode();
  AI.startEpisode();
  board = Array(9).fill('');
  current = 'X';
  over = false;
  aiThinking = false;
  cells.forEach(c => { c.textContent = ''; c.className = 'cell'; });
  syncBoardControls();
  updateControls();
  updateLearningInfo();
  setStatus();
  maybeAIMove();
}

function updateControls() {
  document.getElementById('strategyBox').classList.toggle('hidden', !isAI());
  document.getElementById('sideBox').classList.toggle('hidden', !isAI());
}

function updateLearningInfo() {
  const generation = AI.currentGeneration();
  const summary = strategyEl.value === 'reinforcement'
    ? `Reinforcement learning · generation ${generation} · updates from AI game outcomes`
    : `Minimax · fixed strategy · reinforcement progress saved at generation ${generation}`;
  infoEl.textContent = progressWarning ? `${summary} · ${progressWarning}` : summary;
}

function setStatus(text) {
  if (text) { statusEl.textContent = text; return; }
  if (isTraining) {
    statusEl.textContent = 'Learning from the game result · gameplay is paused';
    return;
  }
  if (isAI()) {
    statusEl.textContent = current === humanSide() ? `Your turn (${current})` : 'AI is thinking...';
  } else {
    statusEl.textContent = `Player ${current}'s turn`;
  }
}

function syncBoardControls() {
  cells.forEach((cell, i) => {
    cell.disabled = isTraining || over || !!board[i] || (isAI() && current !== humanSide());
  });
}

function setTrainingState(active) {
  isTraining = active;
  [modeEl, strategyEl, sideEl, document.getElementById('newGame'), document.getElementById('resetScore')]
    .forEach(control => { control.disabled = active; });
  syncBoardControls();
  if (active) setStatus();
}

function onCellClick(i) {
  if (isTraining || over || aiThinking || board[i]) return;
  if (isAI() && current !== humanSide()) return;
  play(i);
  maybeAIMove();
}

function play(i) {
  board[i] = current;
  cells[i].textContent = current;
  cells[i].classList.add(current);
  cells[i].disabled = true;

  const w = AI.winner(board);
  if (w) {
    const line = LINES.find(([a, b, c]) => board[a] === w && board[b] === w && board[c] === w);
    line.forEach(k => cells[k].classList.add('win'));
    scores[w]++;
    finish(
      isAI() ? (w === humanSide() ? 'You win!' : 'AI wins!') : `Player ${w} wins!`,
      w === aiSide() ? 1 : -1
    );
    return;
  }
  if (board.every(c => c)) {
    scores.D++;
    finish("It's a draw.", 0);
    return;
  }
  current = current === 'X' ? 'O' : 'X';
  syncBoardControls();
  setStatus();
}

function finish(text, reward) {
  over = true;
  syncBoardControls();
  statusEl.textContent = text;
  updateScores();
  if (isAI() && strategyEl.value === 'reinforcement') trainFromOutcome(reward, text);
}

function updateScores() {
  document.getElementById('scoreX').textContent = scores.X;
  document.getElementById('scoreO').textContent = scores.O;
  document.getElementById('scoreD').textContent = scores.D;
}

async function trainFromOutcome(reward, resultText) {
  if (!AI.hasEpisode()) {
    infoEl.textContent = 'No AI move to learn from this round.';
    return;
  }
  setTrainingState(true);
  infoEl.textContent = `Generation ${AI.currentGeneration() + 1} · updating from game outcome`;
  try {
    const generation = await AI.learnFromOutcome(reward, message => {
      infoEl.textContent = message;
    });
    progressWarning = '';
    infoEl.textContent = `Reinforcement learning · generation ${generation} saved`;
  } catch (error) {
    infoEl.textContent = `Learning failed: ${error.message || error}. Previous progress is unchanged.`;
  } finally {
    setTrainingState(false);
    statusEl.textContent = resultText;
  }
}

function maybeAIMove() {
  if (isTraining || !isAI() || over || current !== aiSide()) return;
  aiThinking = true;
  setStatus();
  const scheduledRound = roundToken;
  setTimeout(() => {
    if (scheduledRound !== roundToken || isTraining || over) return;
    const move = AI.getMove(board.slice(), aiSide(), strategyEl.value);
    aiThinking = false;
    if (!over && move >= 0) {
      play(move);
    }
  }, 450);
}

document.getElementById('newGame').addEventListener('click', newRound);
document.getElementById('resetScore').addEventListener('click', () => {
  scores.X = scores.O = scores.D = 0;
  updateScores();
  newRound();
});
[modeEl, strategyEl, sideEl].forEach(el => el.addEventListener('change', newRound));

try {
  AI.restoreProgress();
} catch (error) {
  progressWarning = `Could not restore progress: ${error.message || error}`;
}
newRound();
if (infoEl.textContent === '') updateLearningInfo();

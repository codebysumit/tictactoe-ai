# Tic Tac Toe AI

A simple browser-based Tic Tac Toe game built for the **Use GitHub Copilot to Build a Simple Application** challenge. Play against the computer or switch to a two-player game.

## Features

- **Play vs AI:** play as X or O against the computer.
- **Choose an AI strategy:**
  - **Minimax:** a fixed strategy that evaluates possible moves.
  - **Reinforcement learning:** learns from the AI's moves and the final outcome of completed games. The AI receives a reward for a win, a penalty for a loss, and zero for a draw.
- **Two Players:** play locally with another person. These games do not train the AI.
- **Persistent learning:** reinforcement-learning progress is stored in the browser and retained across rounds and reloads.
- **Scoreboard:** tracks X wins, O wins, and draws.

## Run the game

Open `index.html` in a modern web browser. No build step or package installation is required.

Alternatively, serve the project directory with a local web server and open the address it provides.

## How to play

1. Select **Play vs AI** or **Two Players**.
2. In AI mode, choose an AI strategy and which side you want to play.
3. Select an empty square to place your mark.
4. Use **New Round** to start again or **Reset Score** to clear the scoreboard.

When reinforcement learning updates after an AI game, the board and controls are temporarily disabled. The page displays the current learning generation and update progress. To clear saved learning, remove this site's local storage entry named `tictactoe-reinforcement-v1` in your browser's developer tools.

## Technologies

- HTML
- CSS
- JavaScript
- Browser `localStorage` for reinforcement-learning progress

## Challenge

This project is a small interactive application inspired by the GitHub Copilot challenge prompt to build and share a simple application. It demonstrates a playable game with a choice of AI strategies and a browser-based learning loop.

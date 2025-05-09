// tetris.js

// Define the Tetris game object
const game = {
  canvas: null,
  ctx: null,
  theme: null,
  grid: [],
  currentPiece: null,
  nextPiece: null,
  score: 0,
  linesCleared: 0,
  level: 1,
  dropInterval: 1000,
  lastDropTime: 0,
  isGameOver: false,

  init(canvasElement, theme) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.theme = theme;
    this.resetGame();
    this.bindEvents();
    requestAnimationFrame(this.update.bind(this));
  },

  resetGame() {
    this.grid = this.createEmptyGrid();
    this.currentPiece = this.generateRandomPiece();
    this.nextPiece = this.generateRandomPiece();
    this.score = 0;
    this.linesCleared = 0;
    this.level = 1;
    this.dropInterval = 1000;
    this.lastDropTime = 0;
    this.isGameOver = false;
  },

  createEmptyGrid() {
    const rows = 20;
    const cols = 10;
    const grid = [];
    for (let y = 0; y < rows; y++) {
      grid[y] = [];
      for (let x = 0; x < cols; x++) {
        grid[y][x] = null;
      }
    }
    return grid;
  },

  generateRandomPiece() {
    const pieces = 'IJLOSTZ';
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    return new Piece(type);
  },

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (this.isGameOver) return;
      switch (e.code) {
        case 'ArrowLeft':
          this.movePiece(-1);
          break;
        case 'ArrowRight':
          this.movePiece(1);
          break;
        case 'ArrowDown':
          this.dropPiece();
          break;
        case 'ArrowUp':
          this.rotatePiece();
          break;
        case 'Space':
          this.hardDrop();
          break;
      }
    });
  },

  movePiece(direction) {
    this.currentPiece.x += direction;
    if (this.isCollision()) {
      this.currentPiece.x -= direction;
    }
  },

  rotatePiece() {
    this.currentPiece.rotate();
    if (this.isCollision()) {
      this.currentPiece.rotateBack();
    }
  },

  dropPiece() {
    this.currentPiece.y += 1;
    if (this.isCollision()) {
      this.currentPiece.y -= 1;
      this.lockPiece();
      this.clearLines();
      this.spawnNextPiece();
      if (this.isCollision()) {
        this.isGameOver = true;
      }
    }
    this.lastDropTime = performance.now();
  },

  hardDrop() {
    while (!this.isCollision()) {
      this.currentPiece.y += 1;
    }
    this.currentPiece.y -= 1;
    this.lockPiece();
    this.clearLines();
    this.spawnNextPiece();
    if (this.isCollision()) {
      this.isGameOver = true;
    }
  },

  lockPiece() {
    const { shape, x, y, color } = this.currentPiece;
    shape.forEach((row, dy) => {
      row.forEach((value, dx) => {
        if (value) {
          const px = x + dx;
          const py = y + dy;
          if (py >= 0 && py < this.grid.length && px >= 0 && px < this.grid[0].length) {
            this.grid[py][px] = color;
          }
        }
      });
    });
  },

  clearLines() {
    let lines = 0;
    outer: for (let y = this.grid.length - 1; y >= 0; y--) {
      for (let x = 0; x < this.grid[y].length; x++) {
        if (!this.grid[y][x]) {
          continue outer;
        }
      }
      const row = this.grid.splice(y, 1)[0].fill(null);
      this.grid.unshift(row);
      lines++;
      y++;
    }
    if (lines > 0) {
      this.linesCleared += lines;
      this.score += lines * 100;
      if (this.linesCleared >= this.level * 10) {
        this.level++;
        this.dropInterval *= 0.9;
      }
    }
  },

  spawnNextPiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.generateRandomPiece();
    this.currentPiece.x = Math.floor((this.grid[0].length - this.currentPiece.shape[0].length) / 2);
    this.currentPiece.y = 0;
  },

  isCollision() {
    const { shape, x, y } = this.currentPiece;
    for (let dy = 0; dy < shape.length; dy++) {
      for (let dx = 0; dx < shape[dy].length; dx++) {
        if (shape[dy][dx]) {
          const px = x + dx;
          const py = y + dy;
          if (
            px < 0 ||
            px >= this.grid[0].length ||
            py >= this.grid.length ||
            (py >= 0 && this.grid[py][px])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  },

  update(time) {
    if (this.isGameOver) {
      this.drawGameOver();
      return;
    }
    const deltaTime = time - this.lastDropTime;
    if (deltaTime > this.dropInterval) {
      this.dropPiece();
    }
    this.draw();
    requestAnimationFrame(this.update.bind(this));
  },

  draw() {
    const { ctx, canvas, grid, currentPiece, theme } = this;
    ctx.fillStyle = get_theme_var(theme, '--color-base00') || '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        if (cell) {
          this.drawCell(x, y, cell);
        }
      }
    }

    // Draw current piece
    const { shape, x: px, y: py, color } = currentPiece;
    shape.forEach((row, dy) => {
      row.forEach((value, dx) => {
        if (value) {
          this.drawCell(px + dx, py + dy, color);
        }
      });
    });

    // Draw score
    ctx.fillStyle = get_theme_var(theme, '--color-text') || '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${this.score}`, 10, 20);
    ctx.fillText(`Level: ${this.level}`, 10, 40);
  },

  drawCell(x, y, color) {
    const { ctx } = this;
    const size = 30;
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size, size);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x * size, y * size, size, size);
  },

  drawGameOver() {
    const { ctx, canvas, theme } = this;
    ctx.fillStyle = get_theme_var(theme, '--color-base00') || '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = get_theme_var(theme, '--color-text') || '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  },
};

// Define the Piece class
class Piece {
  constructor(type) {
    this.type = type;
    this.shape = this.getShape(type);
    this.color = this.getColor(type);
    this.x = 3;
    this.y = 0;
  }

  getShape(type) {
    const shapes = {
      I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      O: [
        [1, 1],
        [1, 1],
      ],
      S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
    };
    return shapes[type];
  }

  getColor(type) {
    const colors = {
      I: '#00f0f0',
      J: '#0000f0',
      L: '#f0a000',
      O: '#f0f000',
      S: '#00f000',
      T: '#a000f0',
      Z: '#f00000',
    };
    return colors[type];
  }
}


::contentReference[oaicite:21]{index=21}
 

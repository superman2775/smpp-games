(function () {
  // Game configuration
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 30;
  const LINES_PER_LEVEL = 10;
  const COLORS = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // I
    '#0DFF72', // S
    '#F538FF', // Z
    '#FF8E0D', // L
    '#FFE138', // J
    '#3877FF'  // O
  ];

  // Tetrimino shapes
  const SHAPES = [
    [],
    [[0,0], [1,0], [0,1], [1,1]],             // O
    [[0,0], [1,0], [2,0], [3,0]],             // I
    [[0,0], [1,0], [1,1], [2,1]],             // S
    [[1,0], [2,0], [0,1], [1,1]],             // Z
    [[0,0], [0,1], [1,1], [2,1]],             // J
    [[2,0], [0,1], [1,1], [2,1]],             // L
    [[1,0], [0,1], [1,1], [2,1]]              // T
  ];

  // Game variables
  let canvas, context;
  let board = [];
  let currentPiece;
  let nextPiece;
  let gameInterval;
  let dropCounter = 0;
  let dropInterval = 1000;
  let lastTime = 0;
  let score = 0;
  let lines = 0;
  let level = 0;

  // Initialize the game
  function init() {
    canvas = document.createElement('canvas');
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    context = canvas.getContext('2d');
    document.body.appendChild(canvas);

    // Initialize board
    for (let y = 0; y < ROWS; y++) {
      board[y] = [];
      for (let x = 0; x < COLS; x++) {
        board[y][x] = 0;
      }
    }

    // Generate first pieces
    currentPiece = createPiece();
    nextPiece = createPiece();

    // Start game loop
    update();
  }

  // Create a new piece
  function createPiece() {
    const typeId = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
    const shape = SHAPES[typeId];
    return {
      x: Math.floor(COLS / 2) - 1,
      y: 0,
      shape: shape,
      color: COLORS[typeId]
    };
  }

  // Draw the board and current piece
  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw board
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x] !== 0) {
          context.fillStyle = board[y][x];
          context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    }

    // Draw current piece
    currentPiece.shape.forEach(([dx, dy]) => {
      context.fillStyle = currentPiece.color;
      context.fillRect((currentPiece.x + dx) * BLOCK_SIZE, (currentPiece.y + dy) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    });
  }

  // Merge current piece into board
  function merge() {
    currentPiece.shape.forEach(([dx, dy]) => {
      board[currentPiece.y + dy][currentPiece.x + dx] = currentPiece.color;
    });
  }

  // Check for collisions
  function collide() {
    for (let i = 0; i < currentPiece.shape.length; i++) {
      const [dx, dy] = currentPiece.shape[i];
      const x = currentPiece.x + dx;
      const y = currentPiece.y + dy;
      if (x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y][x] !== 0)) {
        return true;
      }
    }
    return false;
  }

  // Move the piece
  function move(dir) {
    currentPiece.x += dir;
    if (collide()) {
      currentPiece.x -= dir;
    }
  }

  // Drop the piece
  function drop() {
    currentPiece.y++;
    if (collide()) {
      currentPiece.y--;
      merge();
      resetPiece();
      sweep();
    }
    dropCounter = 0;
  }

  // Rotate the piece
  function rotate() {
    const shape = currentPiece.shape;
    for (let i = 0; i < shape.length; i++) {
      const [x, y] = shape[i];
      shape[i] = [-y, x];
    }
    if (collide()) {
      for (let i = 0; i < shape.length; i++) {
        const [x, y] = shape[i];
        shape[i] = [y, -x];
      }
    }
  }

  // Reset the piece
  function resetPiece() {
    currentPiece = nextPiece;
    nextPiece = createPiece();
    if (collide()) {
      // Game over
      board = [];
      for (let y = 0; y < ROWS; y++) {
        board[y] = [];
        for (let x = 0; x < COLS; x++) {
          board[y][x] = 0;
        }
      }
      score = 0;
      lines = 0;
      level = 0;
      dropInterval = 1000;
    }
  }

  // Remove full lines
  function sweep() {
    outer: for (let y = ROWS - 1; y >= 0; y--) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x] === 0) {
          continue outer;
        }
      }
      const row = board.splice(y, 1)[0].fill(0);
      board.unshift(row);
      y++;
      lines++;
      score += 10;
      if (lines % LINES_PER_LEVEL === 0) {
        level++;
        dropInterval *= 0.9;
      }
    }
  }

  // Update game state
  function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      drop();
    }
    draw();
    requestAnimationFrame(update);
  }

  // Handle user input
  document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
      move(-1);
    } else if (event.keyCode === 39) {
      move(1);
    } else if (event.keyCode === 40) {
      drop();
    } else if (event.keyCode === 81) {
      rotate();
    }
  });

  // Start the game
  init();
})();

class TetrisWidget extends GameBase {
  constructor() {
    super("Tetris", "Classic Tetris", "Code Copilot");
  }

  init(container) {
    console.log("TetrisWidget initialized");

    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 400;
    canvas.style.width = "240px";
    canvas.style.height = "400px";
    container.appendChild(canvas);

    const scoreDisplay = document.createElement("div");
    scoreDisplay.style.color = "white";
    container.appendChild(scoreDisplay);

    const highscoreDisplay = document.createElement("div");
    highscoreDisplay.style.color = "yellow";
    container.appendChild(highscoreDisplay);

    const difficultySelect = document.createElement("select");
    [
      ["Easy", 1000],
      ["Medium", 500],
      ["Hard", 250]
    ].forEach(([label, val]) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = label;
      difficultySelect.appendChild(opt);
    });
    difficultySelect.onchange = () => {
      dropInterval = parseInt(difficultySelect.value);
      console.log("Difficulty changed to interval:", dropInterval);
    };
    container.appendChild(difficultySelect);

    const previewLabel = document.createElement("div");
    previewLabel.textContent = "Next:";
    previewLabel.style.color = "white";
    container.appendChild(previewLabel);

    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = 80;
    previewCanvas.height = 80;
    previewCanvas.style.border = "1px solid white";
    container.appendChild(previewCanvas);
    const previewCtx = previewCanvas.getContext("2d");
    previewCtx.scale(20, 20);

    const restartButton = document.createElement("button");
    restartButton.textContent = "Restart";
    restartButton.onclick = () => {
      console.log("Game restarted");
      arena.forEach(row => row.fill(0));
      player.score = 0;
      updateScore();
      playerReset();
    };
    container.appendChild(restartButton);

    const context = canvas.getContext('2d');
    context.scale(20, 20);

    let highscore = parseInt(localStorage.getItem("tetris-highscore") || "0", 10);

    function updateScore() {
      scoreDisplay.innerText = `Score: ${player.score}`;
      if (player.score > highscore) {
        highscore = player.score;
        localStorage.setItem("tetris-highscore", highscore);
        console.log("New highscore:", highscore);
      }
      highscoreDisplay.innerText = `Highscore: ${highscore}`;
    }

    function drawPreview() {
      previewCtx.clearRect(0, 0, 4, 4);
      drawMatrix(nextPiece, { x: 0.5, y: 0.5 }, previewCtx);
    }

    function arenaSweep() {
      let rowCount = 1;
      outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
          if (arena[y][x] === 0) continue outer;
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        rowCount *= 2;
      }
      updateScore();
    }

    function collide(arena, player) {
      const m = player.matrix;
      const o = player.pos;
      for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
          if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
            return true;
          }
        }
      }
      return false;
    }

    function createMatrix(w, h) {
      const matrix = [];
      while (h--) matrix.push(new Array(w).fill(0));
      return matrix;
    }

    function createPiece(type) {
      console.log("Creating piece:", type);
      if (type === 'T') return [[0,0,0],[1,1,1],[0,1,0]];
      if (type === 'O') return [[2,2],[2,2]];
      if (type === 'L') return [[0,3,0],[0,3,0],[0,3,3]];
      if (type === 'J') return [[0,4,0],[0,4,0],[4,4,0]];
      if (type === 'I') return [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]];
      if (type === 'S') return [[0,6,6],[6,6,0],[0,0,0]];
      if (type === 'Z') return [[7,7,0],[0,7,7],[0,0,0]];
    }

    function drawMatrix(matrix, offset, ctx = context) {
      matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            ctx.fillStyle = colors[value];
            ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
          }
        });
      });
    }

    function draw() {
      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      drawMatrix(arena, {x: 0, y: 0});
      drawMatrix(player.matrix, player.pos);
    }

    function merge(arena, player) {
      player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
      });
    }

    function playerDrop() {
      player.pos.y++;
      if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
      }
      dropCounter = 0;
    }

    function playerMove(dir) {
      player.pos.x += dir;
      if (collide(arena, player)) player.pos.x -= dir;
    }

    function playerReset() {
      player.matrix = nextPiece;
      const nextType = pieces[Math.floor(Math.random() * pieces.length)];
      nextPiece = createPiece(nextType);
      drawPreview();
      player.pos.y = 0;
      player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
      if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
      }
    }

    function playerRotate(dir) {
      const pos = player.pos.x;
      let offset = 1;
      rotate(player.matrix, dir);
      while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
          rotate(player.matrix, -dir);
          player.pos.x = pos;
          return;
        }
      }
    }

    function rotate(matrix, dir) {
      for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
          [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
      }
      if (dir > 0) matrix.forEach(row => row.reverse());
      else matrix.reverse();
    }

    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    function update(time = 0) {
      const deltaTime = time - lastTime;
      lastTime = time;
      dropCounter += deltaTime;
      if (dropCounter > dropInterval) playerDrop();
      draw();
      requestAnimationFrame(update);
    }

    const colors = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];
    const arena = createMatrix(12, 20);
    const pieces = 'TJLOSZI';
    let nextPiece = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    const player = {
      pos: {x: 0, y: 0},
      matrix: null,
      score: 0
    };

    document.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') playerMove(-1);
      else if (event.key === 'ArrowRight') playerMove(1);
      else if (event.key === 'ArrowDown') playerDrop();
      else if (event.key === 'q') playerRotate(-1);
      else if (event.key === 'w') playerRotate(1);
    });

    playerReset();
    update();
  }
}

registerWidget(new TetrisWidget());

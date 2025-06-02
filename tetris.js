
class TetrisWidget extends GameBase {

  init(container) {
    console.log("TetrisWidget initialized");

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.padding = "1em";
    wrapper.style.color = "#ccc";
    container.appendChild(wrapper);

    const title = document.createElement("h2");
    title.innerText = "Tetris++";
    title.style.margin = "0";
    wrapper.appendChild(title);

    const highscoreDisplay = document.createElement("div");
    highscoreDisplay.style.margin = "8px";
    wrapper.appendChild(highscoreDisplay);

    const playButton = document.createElement("button");
    playButton.innerText = "Play";
    playButton.style.padding = "0.5em 1.2em";
    playButton.style.borderRadius = "8px";
    playButton.style.border = "1px solid #88a";
    playButton.style.background = "transparent";
    playButton.style.color = "#ccc";
    playButton.style.cursor = "pointer";
    playButton.style.margin = "10px 0";
    wrapper.appendChild(playButton);

    const speedLabel = document.createElement("div");
    speedLabel.innerText = "Speed:";
    wrapper.appendChild(speedLabel);

    const difficultyDisplay = document.createElement("div");
    difficultyDisplay.style.marginTop = "4px";
    difficultyDisplay.innerText = "Extreme";
    wrapper.appendChild(difficultyDisplay);

    const highscore = parseInt(localStorage.getItem("tetris-highscore") || "0", 10);
    highscoreDisplay.innerText = `High Score: ${highscore}`;

    playButton.onclick = () => {
      container.innerHTML = "";
      const game = new TetrisRuntime(container, highscore);
      game.start();
    };
  }
}

class TetrisRuntime {
  constructor(container, highscore) {
    this.container = container;
    this.highscore = highscore;
  }

  start() {
    console.log("Starting full Tetris game...");
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 400;
    canvas.style.width = "240px";
    canvas.style.height = "400px";
    this.container.appendChild(canvas);

    const scoreDisplay = document.createElement("div");
    scoreDisplay.style.color = "white";
    this.container.appendChild(scoreDisplay);

    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = 80;
    previewCanvas.height = 80;
    previewCanvas.style.border = "1px solid white";
    previewCanvas.style.marginTop = "8px";
    this.container.appendChild(previewCanvas);
    const previewCtx = previewCanvas.getContext("2d");
    previewCtx.scale(20, 20);

    const context = canvas.getContext('2d');
    context.scale(20, 20);

    let highscore = this.highscore;

    const updateScore = () => {
      scoreDisplay.innerText = `Score: ${player.score}`;
      if (player.score > highscore) {
        highscore = player.score;
        localStorage.setItem("tetris-highscore", highscore);
      }
    };

    const drawMatrix = (matrix, offset, ctx = context) => {
      matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            ctx.fillStyle = colors[value];
            ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
          }
        });
      });
    };

    const drawPreview = () => {
      previewCtx.clearRect(0, 0, 4, 4);
      drawMatrix(nextPiece, { x: 0.5, y: 0.5 }, previewCtx);
    };

    const collide = (arena, player) => {
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
    };

    const merge = (arena, player) => {
      player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
      });
    };

    const createMatrix = (w, h) => Array.from({ length: h }, () => new Array(w).fill(0));

    const createPiece = type => {
      const pieces = {
        'T': [[0,0,0],[1,1,1],[0,1,0]],
        'O': [[2,2],[2,2]],
        'L': [[0,3,0],[0,3,0],[0,3,3]],
        'J': [[0,4,0],[0,4,0],[4,4,0]],
        'I': [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]],
        'S': [[0,6,6],[6,6,0],[0,0,0]],
        'Z': [[7,7,0],[0,7,7],[0,0,0]]
      };
      return pieces[type];
    };

    const rotate = (matrix, dir) => {
      for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
          [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
      }
      if (dir > 0) matrix.forEach(row => row.reverse());
      else matrix.reverse();
    };

    const player = {
      pos: { x: 0, y: 0 },
      matrix: null,
      score: 0
    };

    const pieces = 'TJLOSZI';
    let nextPiece = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    const arena = createMatrix(12, 20);

    const playerReset = () => {
      player.matrix = nextPiece;
      nextPiece = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
      drawPreview();
      player.pos.y = 0;
      player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
      if (collide(arena, player)) {
        const gameOverMsg = document.createElement('div');
        gameOverMsg.innerText = 'Game Over';
        gameOverMsg.style.position = 'absolute';
        gameOverMsg.style.top = '50%';
        gameOverMsg.style.left = '50%';
        gameOverMsg.style.transform = 'translate(-50%, -50%)';
        gameOverMsg.style.color = 'red';
        gameOverMsg.style.fontSize = '2em';
        gameOverMsg.style.background = '#000c';
        gameOverMsg.style.padding = '0.5em 1em';
        gameOverMsg.style.borderRadius = '8px';
        gameOverMsg.style.zIndex = '100';
        this.container.appendChild(gameOverMsg);
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart';
        restartButton.style.marginTop = '10px';
        restartButton.style.padding = '0.4em 1em';
        restartButton.style.fontSize = '1em';
        restartButton.style.border = '1px solid #fff';
        restartButton.style.background = 'transparent';
        restartButton.style.color = 'white';
        restartButton.style.cursor = 'pointer';
        restartButton.onclick = () => {
          this.container.removeChild(gameOverMsg);
          arena.forEach(row => row.fill(0));
          player.score = 0;
          updateScore();
          playerReset();
        };
        gameOverMsg.appendChild(document.createElement('br'));
        gameOverMsg.appendChild(restartButton);
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
      }
    };

    const playerDrop = () => {
      player.pos.y++;
      if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
      }
      dropCounter = 0;
    };

    const playerMove = dir => {
      player.pos.x += dir;
      if (collide(arena, player)) player.pos.x -= dir;
    };

    const playerRotate = dir => {
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
    };

    const arenaSweep = () => {
      let rowCount = 1;
      outer: for (let y = arena.length - 1; y >= 0; --y) {
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
    };

    let dropCounter = 0;
    let dropInterval = 100; 
    let lastTime = 0;
    const update = (time = 0) => {
      const deltaTime = time - lastTime;
      lastTime = time;
      dropCounter += deltaTime;
      if (dropCounter > dropInterval) playerDrop();
      draw();
      requestAnimationFrame(update);
    };

    const draw = () => {
      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      drawMatrix(arena, { x: 0, y: 0 });
      drawMatrix(player.matrix, player.pos);
    };

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') playerMove(-1);
      else if (e.key === 'ArrowRight') playerMove(1);
      else if (e.key === 'ArrowDown') playerDrop();
      else if (e.key === 'ArrowUp') playerRotate(1);
      else if (e.key === 'q') playerRotate(-1);
      else if (e.key === 'w') playerRotate(1);
    });

    playerReset();
    update();
  }
}

registerWidget(new TetrisWidget());

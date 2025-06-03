// Central difficulty definitions
const DIFFICULTY_LABELS = ["Impossible", "Easy", "Medium", "Hard", "Extreme"];
const DIFFICULTY_VALUES = [50, 1000, 500, 250, 100];

class TetrisWidget extends GameBase {
  start(container) {
    const game = new TetrisGame(container);
    game.init(container);
  }

  get title() {
    return "Tetris ++";
  }

  get options() {
    return DIFFICULTY_LABELS.map((label, index) => ({ label, value: DIFFICULTY_VALUES[index] }));
  }
}

export class TetrisGame {
  constructor(container) {
    this.container = container;
  }

  init(container) {
    console.log("TetrisWidget initialized");

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.padding = "1em";
    container.appendChild(wrapper);

    const title = document.createElement("h2");
    title.innerText = "Tetris++";
    wrapper.appendChild(title);

    const highscoreDisplay = document.createElement("div");
    wrapper.appendChild(highscoreDisplay);

    const playButton = document.createElement("button");
    playButton.innerText = "Play";
    wrapper.appendChild(playButton);

    const difficultyLabel = document.createElement("label");
    difficultyLabel.innerText = "Choose difficulty:";
    wrapper.appendChild(difficultyLabel);

    const difficultySlider = document.createElement("input");
    difficultySlider.type = "range";
    difficultySlider.min = "0";
    difficultySlider.max = "4";
    difficultySlider.step = "1";

    const difficultyText = document.createElement("div");
    const lastIndex = DIFFICULTY_VALUES.indexOf(parseInt(localStorage.getItem("tetris-last-speed") || "500"));
    difficultySlider.value = lastIndex >= 0 ? lastIndex : 2;
    difficultyText.innerText = DIFFICULTY_LABELS[difficultySlider.value];
    wrapper.appendChild(difficultyText);

    difficultySlider.oninput = () => {
      const idx = parseInt(difficultySlider.value);
      difficultyText.innerText = DIFFICULTY_LABELS[idx];
      difficultySlider.style.background = (DIFFICULTY_LABELS[idx] === "Impossible") ? "#f00" : "";
      const old = document.getElementById("impossible-warning");
      if (DIFFICULTY_LABELS[idx] === "Impossible") {
        if (!old) {
          const warning = document.createElement("div");
          warning.id = "impossible-warning";
          warning.innerText = "⚠️ CAUTION: You've entered a realm beyond human reaction time. Good luck.";
          wrapper.appendChild(warning);
        }
      } else if (old) old.remove();
    };

    wrapper.appendChild(difficultySlider);

    const highscore = parseInt(localStorage.getItem("tetris-highscore") || "0", 10);
    highscoreDisplay.innerText = `High Score: ${highscore}`;

    playButton.onclick = () => {
      const speed = DIFFICULTY_VALUES[difficultySlider.value];
      localStorage.setItem("tetris-last-speed", speed);
      container.innerHTML = "";
      const game = new TetrisRuntime(container, highscore, speed);
      game.start();
    };
  }
}

class TetrisRuntime {
  constructor(container, highscore, dropInterval = 1000) {
    this.container = container;
    this.highscore = highscore;
    this.dropInterval = dropInterval;
  }

  start(container = this.container) {
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

    const DIFFICULTY_LABELS = ["Easy", "Medium", "Hard", "Extreme", "Impossible"];
    const difficultyDisplay = document.createElement("div");
    let difficultyDisplayText = () => `Mode: ${difficultyLabels[difficultyValues.indexOf(dropInterval)]}`;
    difficultyDisplay.innerText = difficultyDisplayText();
    this.container.appendChild(difficultyDisplay);

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
        restartButton.onclick = () => {
          this.container.removeChild(gameOverMsg);
          const difficultyWrapper = document.createElement("div");
          const difficultySlider = document.createElement("input");
          difficultySlider.type = "range";
          difficultySlider.min = "0";
          difficultySlider.max = "4";
          difficultySlider.step = "1";
          const difficultyLabels = ["Easy", "Medium", "Hard", "Extreme", "Impossible"];
          const difficultyValues = [1000, 500, 250, 100, 50];
          const difficultyText = document.createElement("div");
          const lastIndex = difficultyValues.indexOf(parseInt(localStorage.getItem("tetris-last-speed") || "500"));
          if (lastIndex >= 0) difficultySlider.value = lastIndex.toString();
          else difficultySlider.value = "1";
          difficultyText.innerText = difficultyLabels[difficultySlider.value];
          difficultySlider.oninput = () => {
            const idx = parseInt(difficultySlider.value);
            difficultyText.innerText = difficultyLabels[idx];
            if (difficultyLabels[idx] === "Impossible") {
              difficultySlider.style.background = "#f00";
              if (!document.getElementById("impossible-warning")) {
                const warning = document.createElement("div");
                warning.id = "impossible-warning";
                warning.innerText = "⚠️ CAUTION: You've entered a realm beyond human reaction time. Good luck.";
                difficultyWrapper.appendChild(warning);
              }
            } else {
              difficultySlider.style.background = "";
              const old = document.getElementById("impossible-warning");
              if (old) old.remove();
            }
          };
          const confirmBtn = document.createElement("button");
          confirmBtn.innerText = "Start";
          confirmBtn.onclick = () => {
            dropInterval = difficultyValues[difficultySlider.value];
            localStorage.setItem("tetris-last-speed", difficultyValues[difficultySlider.value]);
            difficultyDisplay.innerText = difficultyDisplayText();
            this.container.innerHTML = "";
            const game = new TetrisRuntime(this.container, 0, dropInterval);
            game.start();
          };
          difficultyWrapper.appendChild(difficultyText);
          difficultyWrapper.appendChild(difficultySlider);
          difficultyWrapper.appendChild(confirmBtn);
          this.container.innerHTML = "";
          this.container.appendChild(difficultyWrapper);
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
    let dropInterval = this.dropInterval;
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
      if (dropInterval === 50) {
        context.strokeStyle = '#f00';
        for (let y = 0; y < 20; y++) {
          for (let x = 0; x < 12; x++) {
            context.strokeRect(x, y, 1, 1);
          }
        }
      }
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
    });

    playerReset();
    update();
  }
}
export { TetrisWidget };

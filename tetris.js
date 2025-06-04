// Central difficulty definitions
const DIFFICULTY_LABELS = ["Impossible", "Easy", "Medium", "Hard", "Extreme"];
const DIFFICULTY_VALUES = [50, 1000, 500, 250, 100];

class TetrisWidget extends GameBase {
  get title() {
    return "Tetris";
  }

  get name() {
    return "Tetris++";
  }

  get description() {
    return "A classic falling-block puzzle game with adjustable difficulty, including an Impossible mode.";
  }

  get options() {
    return DIFFICULTY_LABELS.map((label, index) => ({ label, value: DIFFICULTY_VALUES[index] }));
  }

  async init() {
    return await this.createContent();
  }

  async render() {
    return await this.createPreview();
  }

  async onMessage(msg) {
    console.log("TetrisWidget received message:", msg);
  }

  async onGameStart() {
    if (this.getOpt("speed") === 50) {
      const overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.top = 0;
      overlay.style.left = 0;
      overlay.style.right = 0;
      overlay.style.bottom = 0;
      overlay.style.background = "#300";
      overlay.style.color = "#f88";
      overlay.style.display = "flex";
      overlay.style.flexDirection = "column";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.zIndex = 100;

      const warning = document.createElement("div");
      warning.innerText = "⚠️ CAUTION: You've entered a realm beyond human reaction time.";
      warning.style.padding = "12px";
      warning.style.fontSize = "16px";
      overlay.appendChild(warning);

      const continueBtn = document.createElement("button");
      continueBtn.innerText = "Continue";
      continueBtn.onclick = () => overlay.remove();
      overlay.appendChild(continueBtn);

      const exitBtn = document.createElement("button");
      exitBtn.innerText = "Return to Menu";
      exitBtn.onclick = () => {
        overlay.remove();
        this.exit();
      };
      overlay.appendChild(exitBtn);

      this.canvas.parentNode?.appendChild(overlay);
      return;
    }

    this.highscore = parseInt(localStorage.getItem("tetris-highscore") || "0", 10);
    const canvas = this.canvas;
    const ctx = canvas.getContext("2d");
    this.ctx = ctx;
    this.score = 0;
    this.tickCount = 0;
    this.board = Array.from({ length: 20 }, () => Array(12).fill(0));

    this.player = {
      pos: { x: 5, y: 0 },
      matrix: this.createPiece('T'),
      score: 0,
      updateScore: () => {
        if (this.player.score > this.highscore) {
          this.highscore = this.player.score;
          localStorage.setItem("tetris-highscore", this.highscore);
        }
      }
    };

    this.arena = Array.from({ length: 20 }, () => Array(12).fill(0));
    this.colors = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];
  }

  onGameDraw(ctx, deltaTime) {
    ctx.font = "1px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText(`Score: ${this.player.score}`, 0.5, 1);
    ctx.fillText(`Highscore: ${this.highscore || 0}`, 0.5, 2);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawMatrix(ctx, this.arena, { x: 0, y: 0 });
    this.drawMatrix(ctx, this.player.matrix, this.player.pos);
  }

  async onKeyDown(e) {
    if (e.code === 'ArrowLeft') this.player.pos.x--;
    else if (e.code === 'ArrowRight') this.player.pos.x++;
    else if (e.code === 'ArrowDown') {
      this.player.pos.y++;
      this.player.score++;
      this.player.updateScore();
    }
    else if (e.code === 'ArrowUp') this.rotate(this.player.matrix, 1);
  }

  async onKeyUp(e) {
    console.log("KeyUp", e.code);
  }

  async onMouse(e) {
    console.log("Mouse", e.clientX, e.clientY);
  }

  get tickSpeed() {
    return this.getOpt("speed") || 500;
  }

  drawMatrix(ctx, matrix, offset) {
    matrix.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val !== 0) {
          ctx.fillStyle = this.colors[val];
          ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        }
      });
    });
  }

  createPiece(type) {
    const pieces = {
      T: [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
      O: [[2, 2], [2, 2]],
      L: [[0, 3, 0], [0, 3, 0], [0, 3, 3]],
      J: [[0, 4, 0], [0, 4, 0], [4, 4, 0]],
      I: [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]],
      S: [[0, 6, 6], [6, 6, 0], [0, 0, 0]],
      Z: [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
    };
    return pieces[type];
  }

  rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
      }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
  }
}

registerWidget(new TetrisWidget());

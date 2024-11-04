const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

// Carregar as imagens de fundo, da bola e das raquetes
const backgroundImage = new Image();
backgroundImage.src = 'sprites/fundo2.png';
const ballImage = new Image();
ballImage.src = 'sprites/bola.png';
const paddleImage = new Image();
paddleImage.src = 'sprites/barra02.png';

// Carregar o som de colisão
const bounceSound = new Audio('assets/bounce.wav');

// Configurações do jogo
const paddleWidth = 10, paddleHeight = 100;
const horizontalPaddleThickness = 5;
let playerY = (canvas.height - paddleHeight) / 2;
let computerY = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2, ballY = canvas.height / 2;
let ballSpeedX = 4, ballSpeedY = 4;
let ballRotationAngle = 0;
const rotationSpeed = 0.2;
const speedIncreaseFactor = 1.05;

// Variáveis de pontuação
let playerScore = 0;
let computerScore = 0;

// Variável para controlar a narração
let lastAnnouncedScore = { player: 0, computer: 0 };
let narrationTimeout; // Para gerenciar o tempo de espera entre as narrações
let isMuted = false; // Controle de silenciamento

// Função para tocar o som de colisão
function playBounceSound() {
  bounceSound.currentTime = 0;
  bounceSound.play();
}

// Função para anunciar a pontuação usando a Web Speech API
function announceScore() {
  if (isMuted) return; // Verifica se a narração está silenciada
  if ('speechSynthesis' in window) {
    const message = new SpeechSynthesisUtterance(
      `Jogador: ${playerScore} pontos. Computador: ${computerScore} pontos.`
    );
    message.lang = 'pt-BR';

    const voices = window.speechSynthesis.getVoices();
    const brazilianPortugueseVoice = voices.find(voice => 
      voice.lang === 'pt-BR' || voice.lang.startsWith('pt-BR')
    );

    if (brazilianPortugueseVoice) {
      message.voice = brazilianPortugueseVoice;
    } else {
      console.warn("Voz em português do Brasil não encontrada. Usando a voz padrão.");
    }

    window.speechSynthesis.speak(message);
  } else {
    console.log('A API de síntese de voz não é suportada neste navegador.');
  }
}

// Função para aplicar um ângulo aleatório à direção da bola
function randomizeDirection() {
  const angleVariation = (Math.random() * 0.6 - 0.3);
  ballSpeedY += angleVariation;
}

// Desenha o campo, raquetes e a bola
function draw() {
  context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  context.drawImage(paddleImage, 0, playerY, paddleWidth, paddleHeight);
  context.drawImage(paddleImage, canvas.width - paddleWidth, computerY, paddleWidth, paddleHeight);

  context.fillStyle = '#1E90FF';
  context.fillRect(0, 0, canvas.width, horizontalPaddleThickness);
  context.fillRect(0, canvas.height - horizontalPaddleThickness, canvas.width, horizontalPaddleThickness);

  context.save();
  context.translate(ballX + 10, ballY + 10);
  context.rotate(ballRotationAngle);
  context.drawImage(ballImage, -10, -10, 20, 20);
  context.restore();

  context.font = '24px Arial';
  context.fillStyle = '#fff';
  context.fillText(`Jogador: ${playerScore}`, 50, 30);
  context.fillText(`Computador: ${computerScore}`, canvas.width - 180, 30);
}

// Movimento da bola e verificação de colisões
function moveBall() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  ballRotationAngle += rotationSpeed;

  if (ballY <= 0 || ballY + 20 >= canvas.height) {
    ballSpeedY = -ballSpeedY;
    playBounceSound();
    randomizeDirection();
    ballRotationAngle += Math.PI / 4;
  }

  if (ballX <= paddleWidth && ballY >= playerY && ballY <= playerY + paddleHeight) {
    ballSpeedX = -ballSpeedX * speedIncreaseFactor;
    ballSpeedY *= speedIncreaseFactor;
    playBounceSound();
    ballRotationAngle += Math.PI / 4;
    randomizeDirection();
  }

  if (ballX + 20 >= canvas.width - paddleWidth && ballY >= computerY && ballY <= computerY + paddleHeight) {
    ballSpeedX = -ballSpeedX * speedIncreaseFactor;
    ballSpeedY *= speedIncreaseFactor;
    playBounceSound();
    ballRotationAngle += Math.PI / 4;
    randomizeDirection();
  }

  if (ballY <= horizontalPaddleThickness && ballX >= 0 && ballX <= canvas.width) {
    ballSpeedY = -ballSpeedY * speedIncreaseFactor;
    playBounceSound();
    ballRotationAngle += Math.PI / 4;
    randomizeDirection();
  }

  if (ballY + 20 >= canvas.height - horizontalPaddleThickness && ballX >= 0 && ballX <= canvas.width) {
    ballSpeedY = -ballSpeedY * speedIncreaseFactor;
    playBounceSound();
    ballRotationAngle += Math.PI / 4;
    randomizeDirection();
  }

  // Verificação de pontuação e narração ao marcar um ponto
  if (ballX < 0) {
    computerScore++;
    if (computerScore !== lastAnnouncedScore.computer) {
      if (narrationTimeout) clearTimeout(narrationTimeout);
      narrationTimeout = setTimeout(() => {
        announceScore();
        lastAnnouncedScore.computer = computerScore;
      }, 1000);
    }
    resetBall();
  } else if (ballX > canvas.width) {
    playerScore++;
    if (playerScore !== lastAnnouncedScore.player) {
      if (narrationTimeout) clearTimeout(narrationTimeout);
      narrationTimeout = setTimeout(() => {
        announceScore();
        lastAnnouncedScore.player = playerScore;
      }, 1000);
    }
    resetBall();
  }
}

// Movimento da raquete do computador
function moveComputerPaddle() {
  const centerY = computerY + paddleHeight / 2;
  if (centerY < ballY) {
    computerY += 4;
  } else if (centerY > ballY) {
    computerY -= 4;
  }
}

// Movimento das raquetes do jogador
function movePlayer(event) {
  const key = event.key;
  if (key === ' ' && playerY > 0) {
    playerY -= 10;
  } else if (key === 'Enter' && playerY < canvas.height - paddleHeight) {
    playerY += 10;
  }
}

// Reseta a bola para o centro do campo
function resetBall() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeedX = 4 * (Math.random() > 0.5 ? 1 : -1);
  ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1);
  ballRotationAngle = 0;
}

// Função principal do jogo
function gameLoop() {
  draw();
  moveBall();
  moveComputerPaddle();
  requestAnimationFrame(gameLoop);
}

// Inicia o jogo
backgroundImage.onload = () => {
  ballImage.onload = () => {
    paddleImage.onload = () => {
      document.addEventListener('keydown', movePlayer);
      gameLoop();
    };
  };
};

// Adiciona o botão de silenciar com o ID "#muteButton"
const muteButton = document.createElement('button');
muteButton.id = 'muteButton';
muteButton.innerText = 'Silenciar Narração';
document.body.appendChild(muteButton);

muteButton.addEventListener('click', () => {
  isMuted = !isMuted; // Alterna o estado de silenciamento
  muteButton.innerText = isMuted ? 'Ativar Narração' : 'Silenciar Narração'; // Atualiza o texto do botão
});

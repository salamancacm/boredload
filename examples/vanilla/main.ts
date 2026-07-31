import { mount } from 'boredload';

const slot = document.getElementById('loading-slot') as HTMLElement;
const content = document.getElementById('content') as HTMLElement;
const status = document.getElementById('status') as HTMLElement;
const button = document.getElementById('reload') as HTMLButtonElement;

const CONTINUE_LABEL = "Let's go →";

// Try ?game=orbit-dodger in the URL to switch minigames.
const gameParam = new URLSearchParams(location.search).get('game');

const game = mount(slot, {
  game: gameParam ?? 'dino-runner',
  threshold: 1000,
  minPlayMs: 2500,
  maxPlayMs: 15000,
  continueLabel: CONTINUE_LABEL,
  onGameOver: (score) => console.log('Game over, score:', score),
  onReadyToContinue: () => {
    status.textContent = `Content is ready — keep playing, or hit "${CONTINUE_LABEL}" whenever you want.`;
  },
  onExit: () => {
    content.hidden = false;
    status.textContent = '';
  },
});

function simulateLoad(): void {
  content.hidden = true;
  status.textContent = 'Loading...';
  game.setLoading(true);
  setTimeout(() => {
    // The real work finishes here, but the game doesn't disappear — the
    // player decides when to leave via the "Continue" button (or it
    // auto-dismisses after maxPlayMs).
    game.setLoading(false);
  }, 3000);
}

button.addEventListener('click', simulateLoad);
simulateLoad();

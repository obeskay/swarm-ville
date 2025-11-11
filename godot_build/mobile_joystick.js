/**
 * Mobile Virtual Joystick Controller
 * Provides touch-based WASD input emulation for mobile devices
 */

class MobileJoystick {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.joystickRadius = 80;
    this.joystickStickRadius = 40;
    this.joystickMargin = 30;
    this.isActive = false;
    this.currentX = 0;
    this.currentY = 0;

    // Create joystick container
    this.container = document.createElement('div');
    this.container.id = 'joystick-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: ${this.joystickMargin}px;
      left: ${this.joystickMargin}px;
      width: ${this.joystickRadius * 2}px;
      height: ${this.joystickRadius * 2}px;
      pointer-events: none;
      z-index: 1000;
      opacity: 0.7;
    `;

    // Create background circle
    this.background = document.createElement('div');
    this.background.id = 'joystick-background';
    this.background.style.cssText = `
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      position: absolute;
      pointer-events: auto;
    `;

    // Create stick
    this.stick = document.createElement('div');
    this.stick.id = 'joystick-stick';
    this.stick.style.cssText = `
      width: ${this.joystickStickRadius * 2}px;
      height: ${this.joystickStickRadius * 2}px;
      background: rgba(100, 200, 255, 0.6);
      border: 2px solid rgba(100, 200, 255, 1);
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    `;

    this.container.appendChild(this.background);
    this.container.appendChild(this.stick);
    document.body.appendChild(this.container);

    this.setupTouchHandlers();
  }

  setupTouchHandlers() {
    const background = this.background;

    background.addEventListener('touchstart', (e) => {
      this.isActive = true;
      this.handleTouchMove(e);
    });

    background.addEventListener('touchmove', (e) => {
      if (this.isActive) {
        this.handleTouchMove(e);
      }
    });

    background.addEventListener('touchend', (e) => {
      this.isActive = false;
      this.resetStick();
    });

    background.addEventListener('touchcancel', (e) => {
      this.isActive = false;
      this.resetStick();
    });
  }

  handleTouchMove(e) {
    e.preventDefault();

    if (e.touches.length === 0) return;

    const touch = e.touches[0];
    const rect = this.background.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate position relative to circle center
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;

    // Calculate distance and angle
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = this.joystickRadius - this.joystickStickRadius;

    // Limit stick to circle boundary
    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      dx = Math.cos(angle) * maxDistance;
      dy = Math.sin(angle) * maxDistance;
    }

    // Update stick position
    const offsetX = (dx / maxDistance) * 100;
    const offsetY = (dy / maxDistance) * 100;

    this.stick.style.transform = `translate(calc(-50% + ${offsetX}%), calc(-50% + ${offsetY}%))`;

    // Emit input events
    this.emitInputEvents(offsetX / 100, offsetY / 100);
  }

  resetStick() {
    this.stick.style.transform = 'translate(-50%, -50%)';
    this.currentX = 0;
    this.currentY = 0;
    this.emitInputEvents(0, 0);
  }

  emitInputEvents(x, y) {
    this.currentX = x;
    this.currentY = y;

    // Emit custom event with joystick data
    window.dispatchEvent(new CustomEvent('joystick-move', {
      detail: {
        x: x,
        y: y,
        isActive: this.isActive
      }
    }));

    // Simulate keyboard events for WASD
    this.emulateKeyboardInput(x, y);
  }

  emulateKeyboardInput(x, y) {
    // Determine which directions should be "pressed"
    const threshold = 0.5;
    const up = y < -threshold;
    const down = y > threshold;
    const left = x < -threshold;
    const right = x > threshold;

    // Dispatch synthetic keyboard events
    if (up) this.simulateKeyPress('KeyW');
    if (down) this.simulateKeyPress('KeyS');
    if (left) this.simulateKeyPress('KeyA');
    if (right) this.simulateKeyPress('KeyD');
  }

  simulateKeyPress(key) {
    // Create and dispatch keydown event
    const keydownEvent = new KeyboardEvent('keydown', {
      code: key,
      key: key === 'KeyW' ? 'w' : key === 'KeyA' ? 'a' : key === 'KeyS' ? 's' : 'd',
      keyCode: key === 'KeyW' ? 87 : key === 'KeyA' ? 65 : key === 'KeyS' ? 83 : 68,
      which: key === 'KeyW' ? 87 : key === 'KeyA' ? 65 : key === 'KeyS' ? 83 : 68,
      bubbles: true,
      cancelable: true,
    });

    window.dispatchEvent(keydownEvent);
  }

  hide() {
    this.container.style.display = 'none';
  }

  show() {
    this.container.style.display = 'block';
  }

  setPosition(bottom, left) {
    this.container.style.bottom = bottom + 'px';
    this.container.style.left = left + 'px';
  }
}

// Auto-initialize on mobile devices
window.addEventListener('DOMContentLoaded', () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    const canvas = document.getElementById('canvas');
    if (canvas) {
      // Wait for canvas to be ready
      setTimeout(() => {
        window.mobileJoystick = new MobileJoystick(canvas);
        console.log('[MobileJoystick] Virtual joystick initialized for mobile device');
      }, 1000);
    }
  }
});

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileJoystick;
}

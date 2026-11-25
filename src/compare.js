// Draggable before/after comparison for photos taken from the same position.
// - Mouse/pen: drag anywhere on the photo.
// - Touch: horizontal drags move the divider; vertical swipes scroll the page
//   (the frame uses `touch-action: pan-y`).
// - Keyboard: the divider is a slider (Arrow keys, Page Up/Down, Home/End).
export function initCompare(scope = document) {
  scope.querySelectorAll('[data-compare]').forEach((el) => {
    const frame = el.querySelector('.compare__frame');
    const handle = el.querySelector('.compare__handle');
    if (!frame || !handle) return;
    let pos = 50;
    let dragging = false;

    const set = (value) => {
      pos = Math.round(Math.min(100, Math.max(0, value)));
      frame.style.setProperty('--pos', `${pos}%`);
      handle.setAttribute('aria-valuenow', String(pos));
      handle.setAttribute('aria-valuetext', `${pos}% of the before photo shown`);
    };
    const fromEvent = (e) => {
      const r = frame.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    };

    // Touch waits for a clear sideways movement before moving the divider,
    // so a vertical swipe that starts on the photo just scrolls the page.
    let startX = 0;
    let pending = false;
    frame.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.pointerType === 'touch') {
        pending = true;
        startX = e.clientX;
        return;
      }
      dragging = true;
      frame.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    frame.addEventListener('pointermove', (e) => {
      if (pending && Math.abs(e.clientX - startX) > 8) {
        pending = false;
        dragging = true;
      }
      if (dragging) fromEvent(e);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) =>
      frame.addEventListener(t, () => (dragging = pending = false))
    );

    handle.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: -2, ArrowDown: -2, ArrowRight: 2, ArrowUp: 2, PageDown: -10, PageUp: 10 }[e.key];
      if (step !== undefined) set(pos + step);
      else if (e.key === 'Home') set(0);
      else if (e.key === 'End') set(100);
      else return;
      e.preventDefault();
    });

    set(Number(handle.getAttribute('aria-valuenow')) || 50);
  });
}

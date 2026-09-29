// Lightweight standalone confetti generator
(function() {
  function createConfetti(options = {}) {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const count = options.count || 90;
    const colors = options.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#fbbf24'];
    const particles = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: width * 0.5 + (Math.random() - 0.5) * 200,
        y: height * 0.4 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 1.2) * 12 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 15,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 50 + 90
      });
    }

    let animationId;
    function render() {
      ctx.clearRect(0, 0, width, height);
      let aliveCount = 0;

      particles.forEach((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.98; // drag
        p.rotation += p.rotSpeed;

        if (p.life > p.maxLife * 0.6) {
          p.opacity = 1 - (p.life - p.maxLife * 0.6) / (p.maxLife * 0.4);
        }

        if (p.opacity > 0 && p.y < height + 50) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      if (aliveCount > 0) {
        animationId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationId);
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }
    }

    render();
  }

  window.launchConfetti = createConfetti;
})();

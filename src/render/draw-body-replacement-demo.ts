export function drawBodyReplacementDemo(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timestamp: number
): void {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(0.5, '#7c3aed');
    gradient.addColorStop(1, '#ffffff');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const particleCount = 160;
    const time = timestamp * 0.001;

    for (let i = 0; i < particleCount; i++) {
        const seed = i * 97.137;
        const x = ((Math.sin(seed + time * 1.2) + 1) / 2) * width;
        const y = ((Math.cos(seed * 1.7 + time * 0.9) + 1) / 2) * height;
        const radius = 1 + ((Math.sin(seed * 2.3 + time * 2) + 1) / 2) * 5;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.2 + (radius / 6) * 0.6})`;
        ctx.fill;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < 18; i++) {
        const x = ((Math.sin(i * 12.1 + time) + 1) / 2) * width;
        const y = ((Math.cos(i * 7.9 + time * 0.7) + 1) / 2) * height;
        const glowRadius = 30 + ((Math.sin(time + i) + 1) / 2) * 60;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        glow.addColorStop(0, "rgba(255,255,255,0.35)");
        glow.addColorStop(0.4, "rgba(0,255,255,0.18)");
        glow.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}
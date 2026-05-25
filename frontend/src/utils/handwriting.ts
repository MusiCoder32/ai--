export interface HandwritingOptions {
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  randomness?: number;
}

export function drawHandwriting(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: HandwritingOptions = {}
): void {
  const {
    fontSize = 16,
    color = '#333333',
    lineHeight = 1.8,
    letterSpacing = 0,
    randomness = 0.3,
  } = options;

  ctx.font = `${fontSize}px "ZCOOL KuaiLe", "Ma Shan Zheng", cursive, sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';

  const chars = text.split('');
  let currentX = x;
  let currentY = y;
  const lineHeightPx = fontSize * lineHeight;
  const maxWidth = width;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    if (char === '\n' || currentX > x + maxWidth - fontSize) {
      currentX = x;
      currentY += lineHeightPx;
      if (currentY > y + height) break;
      if (char === '\n') continue;
    }

    const metrics = ctx.measureText(char);
    const charWidth = metrics.width;

    const offsetX = (Math.random() - 0.5) * randomness * 4;
    const offsetY = (Math.random() - 0.5) * randomness * 4;
    const rotation = (Math.random() - 0.5) * randomness * 0.1;
    const scale = 0.95 + Math.random() * randomness * 0.1;

    ctx.save();
    ctx.translate(currentX + charWidth / 2 + offsetX, currentY + fontSize / 2 + offsetY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    ctx.fillText(char, -charWidth / 2, -fontSize / 2);

    ctx.restore();

    currentX += charWidth + letterSpacing + (Math.random() - 0.5) * 2;
  }
}
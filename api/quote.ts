import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createCanvas } from "@napi-rs/canvas";
import {
  createCanvasId,
  uploadCanvas,
  saveCanvasMetadata,
  getCanvasById,
} from "../src/lib/canvas-helpers";
import {
  createCacheKey,
  getCachedCanvas,
  setCachedCanvas,
} from "../src/lib/cache";

function wrapText(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const { width } = ctx.measureText(test);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const text =
      (req.query.text as string) ?? "The only way to do great work is to love what you do.";
    const author = (req.query.author as string) ?? "Steve Jobs";
    const color = (req.query.color as string) ?? "#57f287";

    const cacheKey = createCacheKey("quote", { text, author, color });
    const cachedId = getCachedCanvas(cacheKey);

    if (cachedId) {
      const meta = await getCanvasById(cachedId);
      if (meta) {
        return res.status(200).json({
          success: true,
          message: "Canvas generated successfully",
          data: {
            id: meta.id,
            filename: meta.filename,
            url: `${process.env.BASE_URL}/output/${meta.id}?template=quote`,
          },
        });
      }
    }

    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.06;
    ctx.font = "bold 200px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("\u201C", 20, 220);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(60, 80);
    ctx.lineTo(60, height - 80);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("\u201C\u201D", 80, 100);

    ctx.fillStyle = "#f9fafb";
    ctx.font = "italic 26px sans-serif";
    const lines = wrapText(ctx, text.length > 200 ? text.slice(0, 200) + "\u2026" : text, 640);
    lines.forEach((line, i) => {
      ctx.fillText(line, 100, 130 + i * 40);
    });

    const authorY = 130 + lines.length * 40 + 40;
    ctx.fillStyle = color;
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(`\u2014 ${author}`, 100, authorY);

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 60) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - 60, height);
      ctx.stroke();
    }

    const buffer = canvas.toBuffer("image/png");
    const id = createCanvasId();
    const { filename, storagePath } = await uploadCanvas(id, "quote", buffer);
    await saveCanvasMetadata(id, "quote", filename, storagePath);
    setCachedCanvas(cacheKey, id);

    return res.status(200).json({
      success: true,
      message: "Canvas generated successfully",
      data: {
        id,
        filename,
        url: `${process.env.BASE_URL}/output/${id}?template=quote`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ success: false, message });
  }
}

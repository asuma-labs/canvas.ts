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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const name = (req.query.name as string) ?? "User";
    const color = (req.query.color as string) ?? "#5865F2";

    const cacheKey = createCacheKey("welcome", { name, color });
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
            url: `${process.env.BASE_URL}/output/${meta.id}?template=welcome`,
          },
        });
      }
    }

    const width = 800;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "#2c2f33");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.arc(80, height / 2, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(80, height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("👋", 60, height / 2 + 10);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "18px sans-serif";
    ctx.fillText("WELCOME", 180, height / 2 - 30);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText(name, 180, height / 2 + 20);

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "16px sans-serif";
    ctx.fillText("We're glad to have you here!", 180, height / 2 + 55);

    const buffer = canvas.toBuffer("image/png");
    const id = createCanvasId();
    const { filename, storagePath } = await uploadCanvas(id, "welcome", buffer);
    await saveCanvasMetadata(id, "welcome", filename, storagePath);
    setCachedCanvas(cacheKey, id);

    return res.status(200).json({
      success: true,
      message: "Canvas generated successfully",
      data: {
        id,
        filename,
        url: `${process.env.BASE_URL}/output/${id}?template=welcome`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ success: false, message });
  }
}

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
    const username = (req.query.username as string) ?? "Unknown";
    const bio = (req.query.bio as string) ?? "No bio provided";
    const level = parseInt((req.query.level as string) ?? "1", 10);
    const color = (req.query.color as string) ?? "#eb459e";

    const cacheKey = createCacheKey("profile", { username, bio, level, color });
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
            url: `${process.env.BASE_URL}/output/${meta.id}?template=profile`,
          },
        });
      }
    }

    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, 8);

    ctx.fillStyle = "#16213e";
    ctx.beginPath();
    ctx.roundRect(20, 20, width - 40, height - 40, 16);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    ctx.arc(width - 60, 60, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2a2a4a";
    ctx.beginPath();
    ctx.arc(100, height / 2 - 20, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(100, height / 2 - 20, 70, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("👤", 100, height / 2 - 5);
    ctx.textAlign = "left";

    ctx.fillStyle = color;
    ctx.font = "13px sans-serif";
    ctx.fillText(`LEVEL ${level}`, 200, height / 2 - 70);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(username, 200, height / 2 - 25);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "16px sans-serif";
    ctx.fillText(bio.length > 60 ? bio.slice(0, 60) + "…" : bio, 200, height / 2 + 20);

    ctx.fillStyle = "#2a2a4a";
    ctx.beginPath();
    ctx.roundRect(200, height / 2 + 50, 500, 10, 5);
    ctx.fill();

    const xpProgress = (level % 10) / 10;
    const gradient = ctx.createLinearGradient(200, 0, 700, 0);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "#ffffff");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(200, height / 2 + 50, 500 * xpProgress, 10, 5);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "12px sans-serif";
    ctx.fillText(`XP Progress: ${Math.round(xpProgress * 100)}%`, 200, height / 2 + 80);

    const buffer = canvas.toBuffer("image/png");
    const id = createCanvasId();
    const { filename, storagePath } = await uploadCanvas(id, "profile", buffer);
    await saveCanvasMetadata(id, "profile", filename, storagePath);
    setCachedCanvas(cacheKey, id);

    return res.status(200).json({
      success: true,
      message: "Canvas generated successfully",
      data: {
        id,
        filename,
        url: `${process.env.BASE_URL}/output/${id}?template=profile`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ success: false, message });
  }
}

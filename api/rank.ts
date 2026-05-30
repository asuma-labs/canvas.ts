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
    const username = (req.query.username as string) ?? "User";
    const rank = parseInt((req.query.rank as string) ?? "1", 10);
    const level = parseInt((req.query.level as string) ?? "1", 10);
    const xp = parseInt((req.query.xp as string) ?? "0", 10);
    const xpNeeded = parseInt((req.query.xpNeeded as string) ?? "100", 10);
    const color = (req.query.color as string) ?? "#fee75c";

    const cacheKey = createCacheKey("rank", { username, rank, level, xp, xpNeeded, color });
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
            url: `${process.env.BASE_URL}/output/${meta.id}?template=rank`,
          },
        });
      }
    }

    const width = 800;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#0f0f23");
    bgGradient.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 60; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 1.5;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#1e1e3a";
    ctx.beginPath();
    ctx.arc(90, height / 2, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(90, height / 2, 65, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏆", 90, height / 2 + 10);
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "14px sans-serif";
    ctx.fillText("RANK", 200, height / 2 - 65);

    ctx.fillStyle = color;
    ctx.font = "bold 52px sans-serif";
    ctx.fillText(`#${rank}`, 200, height / 2 - 20);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(username, 320, height / 2 - 30);

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Level ${level}`, 320, height / 2);

    const barX = 200;
    const barY = height / 2 + 30;
    const barW = 560;
    const barH = 18;
    const progress = Math.min(xp / xpNeeded, 1);

    ctx.fillStyle = "#2a2a4a";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 9);
    ctx.fill();

    const barGradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    barGradient.addColorStop(0, color);
    barGradient.addColorStop(1, "#ffffff");
    ctx.fillStyle = barGradient;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * progress, barH, 9);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "13px sans-serif";
    ctx.fillText(`${xp} / ${xpNeeded} XP`, barX, barY + barH + 20);

    const buffer = canvas.toBuffer("image/png");
    const id = createCanvasId();
    const { filename, storagePath } = await uploadCanvas(id, "rank", buffer);
    await saveCanvasMetadata(id, "rank", filename, storagePath);
    setCachedCanvas(cacheKey, id);

    return res.status(200).json({
      success: true,
      message: "Canvas generated successfully",
      data: {
        id,
        filename,
        url: `${process.env.BASE_URL}/output/${id}?template=rank`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ success: false, message });
  }
}

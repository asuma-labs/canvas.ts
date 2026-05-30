import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCanvasById, downloadCanvas } from "../../src/lib/canvas-helpers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query as { id: string };

    if (!id) {
      return res.status(400).json({ success: false, message: "Missing id parameter" });
    }

    const meta = await getCanvasById(id);

    if (!meta) {
      return res.status(404).json({ success: false, message: "Canvas not found" });
    }

    const now = new Date();
    if (new Date(meta.expires_at) < now) {
      return res.status(410).json({ success: false, message: "Canvas has expired" });
    }

    const buffer = await downloadCanvas(meta.storage_path);

    if (!buffer) {
      return res.status(404).json({ success: false, message: "Canvas file not found in storage" });
    }

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("X-Canvas-Id", meta.id);
    res.setHeader("X-Canvas-Template", meta.template);

    return res.status(200).send(buffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ success: false, message });
  }
}

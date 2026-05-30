import { randomUUID } from "crypto";
import { supabase, CanvasMetadata } from "./supabase";

const BUCKET = "canvas";
const BASE_URL = process.env.BASE_URL ?? "https://canvas-s.vercel.app";

export function createCanvasId(): string {
  return randomUUID();
}

export async function uploadCanvas(
  id: string,
  template: string,
  buffer: Buffer
): Promise<{ filename: string; storagePath: string; url: string }> {
  const filename = `canvas-${template}.png`;
  const storagePath = `${template}/${id}.png`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const url = `${BASE_URL}/output/${id}?template=${template}`;
  return { filename, storagePath, url };
}

export async function saveCanvasMetadata(
  id: string,
  template: string,
  filename: string,
  storagePath: string
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { error } = await supabase.from("canvas_metadata").insert({
    id,
    template,
    filename,
    storage_path: storagePath,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error(`Metadata save failed: ${error.message}`);
}

export async function getCanvasById(id: string): Promise<CanvasMetadata | null> {
  const { data, error } = await supabase
    .from("canvas_metadata")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as CanvasMetadata;
}

export async function downloadCanvas(storagePath: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) return null;
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

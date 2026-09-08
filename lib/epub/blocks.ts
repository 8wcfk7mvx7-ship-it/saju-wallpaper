import { createImageBlock, type ImageBlock } from "./types";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function imageBlockFromFile(file: File): Promise<ImageBlock> {
  const dataUrl = await readFileAsDataUrl(file);
  return createImageBlock(dataUrl, file.name.replace(/\.[^.]+$/, ""));
}

export async function imageBlocksFromFiles(files: FileList | File[]): Promise<ImageBlock[]> {
  const list = Array.from(files).filter(f => f.type.startsWith("image/"));
  return Promise.all(list.map(imageBlockFromFile));
}

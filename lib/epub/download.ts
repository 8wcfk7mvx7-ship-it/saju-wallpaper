function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function isNativePlatform(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

async function saveNative(blob: Blob, fileName: string): Promise<void> {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  const base64 = await blobToBase64(blob);
  const written = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  });
  await Share.share({
    title: fileName,
    url: written.uri,
  });
}

function saveWeb(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** iOS/Android 네이티브 앱에서는 공유 시트로, 웹에서는 일반 다운로드로 저장한다. */
export async function saveEpubFile(blob: Blob, fileName: string): Promise<void> {
  if (typeof window !== "undefined" && isNativePlatform()) {
    try {
      await saveNative(blob, fileName);
      return;
    } catch {
      // 네이티브 저장 실패 시 일반 다운로드로 대체
    }
  }
  saveWeb(blob, fileName);
}

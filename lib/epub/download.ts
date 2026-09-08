/**
 * 만들어진 EPUB 파일을 기기에 저장한다.
 *
 * 브라우저마다 되는 방법이 달라서 순서대로 시도한다.
 * - iOS/안드로이드 앱(Capacitor): 앱 문서 폴더에 파일로 쓴 뒤 공유 시트를 띄운다.
 *   (앱 안의 WebView는 <a download>가 막혀 있어서 이 방법이 유일하다)
 * - 모바일 브라우저: 파일 공유(Web Share)를 쓴다.
 * - 데스크톱 브라우저: 일반 다운로드.
 */

export type SaveMethod = "native-share" | "native-file" | "web-share" | "download";

export interface SaveResult {
  method: SaveMethod;
  /** 네이티브 앱에서 실제로 저장된 위치(있을 때만). */
  path?: string;
}

const EPUB_MIME = "application/epub+zip";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("파일을 읽지 못했어요."));
    reader.readAsDataURL(blob);
  });
}

/** Capacitor로 감싼 네이티브 앱(iOS/안드로이드) 안에서 실행 중인가. */
function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

/**
 * 앱의 문서 폴더에 저장하고 공유 시트를 띄운다.
 * Documents에 저장하는 이유는 앱을 껐다 켜도 남아 있고, "파일" 앱에서도 보이기 때문이다.
 * (Info.plist의 UIFileSharingEnabled / LSSupportsOpeningDocumentsInPlace와 함께 동작한다)
 */
async function saveNative(blob: Blob, fileName: string): Promise<SaveResult> {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);

  const base64 = await blobToBase64(blob);
  const written = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Documents,
    recursive: true,
  });

  // 파일은 이미 저장됐다. 공유 시트는 "다른 앱으로 보내기"를 위한 추가 단계일 뿐이라,
  // 사용자가 시트를 닫아도(취소해도) 저장 자체는 성공으로 본다.
  try {
    await Share.share({
      title: fileName,
      text: fileName,
      url: written.uri,
      dialogTitle: "EPUB 파일 저장/보내기",
    });
    return { method: "native-share", path: written.uri };
  } catch {
    return { method: "native-file", path: written.uri };
  }
}

/** 모바일 브라우저에서 파일 자체를 공유할 수 있는지. */
function canShareFile(file: File): boolean {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") return false;
  // 손가락으로 쓰는 기기에서만 공유 시트를 우선한다(데스크톱은 그냥 다운로드가 낫다).
  const isTouch = navigator.maxTouchPoints > 0;
  try {
    return isTouch && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function downloadInBrowser(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function saveEpubFile(blob: Blob, fileName: string): Promise<SaveResult> {
  if (isNativePlatform()) {
    // 앱 안에서는 대체 수단이 없으므로, 실패하면 조용히 넘기지 말고 그대로 알린다.
    return saveNative(blob, fileName);
  }

  const file = new File([blob], fileName, { type: EPUB_MIME });

  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file], title: fileName });
      return { method: "web-share" };
    } catch (err) {
      // 사용자가 공유를 취소한 경우에는 다운로드로 다시 시도하지 않는다.
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      // 그 밖의 실패는 일반 다운로드로 넘어간다.
    }
  }

  downloadInBrowser(blob, fileName);
  return { method: "download" };
}

// 독립 실행형 버전은 항상 일반 브라우저 다운로드로 저장한다(Capacitor 네이티브 앱이 아니므로).
export async function saveEpubFile(blob: Blob, fileName: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

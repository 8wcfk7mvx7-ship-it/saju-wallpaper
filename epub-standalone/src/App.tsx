import { useState } from "react";
import EpubWorkspace from "@/components/epub/EpubWorkspace";
import AppLibrary from "@/components/epub-app/AppLibrary";
import AppSettings from "@/components/epub-app/AppSettings";

type Screen = "library" | "editor" | "settings";

/**
 * 맥/윈도우 데스크톱 앱 화면.
 * 계정 없이 이 기기에만 저장하므로 로그인 화면 없이 바로 책장에서 시작한다.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>("library");
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [startNew, setStartNew] = useState(false);
  /** 편집기를 새로 마운트해 고른 원고를 다시 읽게 하는 값. */
  const [editorKey, setEditorKey] = useState(0);

  function openEditor(projectId: string | null, fresh: boolean) {
    setOpenProjectId(projectId);
    setStartNew(fresh);
    setEditorKey(k => k + 1);
    setScreen("editor");
  }

  if (screen === "editor") {
    return (
      <EpubWorkspace
        key={editorKey}
        layout="tablet"
        openProjectId={openProjectId}
        startNew={startNew}
        onExit={() => setScreen("library")}
      />
    );
  }

  if (screen === "settings") {
    return (
      <div style={{ height: "100vh" }}>
        <AppSettings isGuest onBack={() => setScreen("library")} onSignedOut={() => setScreen("library")} />
      </div>
    );
  }

  return (
    <div style={{ height: "100vh" }}>
      <AppLibrary
        wide
        onOpenProject={id => openEditor(id, false)}
        onContinueDraft={() => openEditor(null, false)}
        onNewBook={() => openEditor(null, true)}
        onOpenSettings={() => setScreen("settings")}
      />
    </div>
  );
}

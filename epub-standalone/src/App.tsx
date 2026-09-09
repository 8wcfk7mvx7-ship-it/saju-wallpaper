import { useEffect, useState } from "react";
import EpubWorkspace, { type WorkspaceLayout } from "@/components/epub/EpubWorkspace";
import AppLibrary from "@/components/epub-app/AppLibrary";
import AppSettings from "@/components/epub-app/AppSettings";

type Screen = "library" | "editor" | "settings";

/** 이 폭보다 넓으면 아이패드·데스크톱(분할 화면), 좁으면 아이폰(탭 화면). */
const WIDE_MIN_WIDTH = 700;

/**
 * 앱 화면(맥·윈도우 데스크톱, 아이폰·아이패드 공용).
 *
 * 서버에 붙지 않는 완전한 단독 앱이다. 계정도 인터넷도 필요 없고,
 * 원고는 그 기기에만 저장된다. 그래서 로그인 화면 없이 책장에서 바로 시작한다.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>("library");
  const [layout, setLayout] = useState<WorkspaceLayout>("tablet");
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [startNew, setStartNew] = useState(false);
  /** 편집기를 새로 마운트해 고른 원고를 다시 읽게 하는 값. */
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    function pickLayout() {
      setLayout(window.innerWidth >= WIDE_MIN_WIDTH ? "tablet" : "phone");
    }
    pickLayout();
    window.addEventListener("resize", pickLayout);
    return () => window.removeEventListener("resize", pickLayout);
  }, []);

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
        layout={layout}
        openProjectId={openProjectId}
        startNew={startNew}
        onExit={() => setScreen("library")}
      />
    );
  }

  if (screen === "settings") {
    return (
      <div style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)" }}>
        <AppSettings isGuest onBack={() => setScreen("library")} onSignedOut={() => setScreen("library")} />
      </div>
    );
  }

  return (
    <div style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)" }}>
      <AppLibrary
        wide={layout === "tablet"}
        onOpenProject={id => openEditor(id, false)}
        onContinueDraft={() => openEditor(null, false)}
        onNewBook={() => openEditor(null, true)}
        onOpenSettings={() => setScreen("settings")}
      />
    </div>
  );
}

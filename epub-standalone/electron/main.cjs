const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("node:path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: "이펍공장",
    // 맥에서 제목 표시줄을 앱 배경색과 이어지게 해서 창이 하나로 보이게 한다.
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: "#f7f1e3",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));

  // 앱 안에서 바깥 링크(약관 등)를 누르면 기본 브라우저로 연다.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  return win;
}

/** 맥 사용자가 기대하는 기본 메뉴(복사/붙여넣기/단축키)를 갖춘다. */
function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac
      ? [{
          label: "이펍공장",
          submenu: [
            { role: "about", label: "이펍공장 정보" },
            { type: "separator" },
            { role: "hide", label: "이펍공장 가리기" },
            { role: "hideOthers", label: "다른 항목 가리기" },
            { role: "unhide", label: "모두 보기" },
            { type: "separator" },
            { role: "quit", label: "이펍공장 종료" },
          ],
        }]
      : []),
    {
      label: "편집",
      submenu: [
        { role: "undo", label: "실행 취소" },
        { role: "redo", label: "다시 실행" },
        { type: "separator" },
        { role: "cut", label: "잘라내기" },
        { role: "copy", label: "복사" },
        { role: "paste", label: "붙여넣기" },
        { role: "selectAll", label: "전체 선택" },
      ],
    },
    {
      label: "보기",
      submenu: [
        { role: "resetZoom", label: "실제 크기" },
        { role: "zoomIn", label: "확대" },
        { role: "zoomOut", label: "축소" },
        { type: "separator" },
        { role: "togglefullscreen", label: "전체 화면" },
      ],
    },
    {
      label: "창",
      submenu: [
        { role: "minimize", label: "최소화" },
        { role: "close", label: "닫기" },
      ],
    },
    {
      label: "도움말",
      submenu: [
        {
          label: "이펍공장이란?",
          click: () => {
            dialog.showMessageBox({
              type: "info",
              title: "이펍공장",
              message: "이펍공장",
              detail:
                "글을 써서 전자책(EPUB) 파일로 만드는 프로그램입니다.\n\n" +
                "인터넷 없이도 작동하고, 원고는 이 컴퓨터에만 저장됩니다.\n" +
                "완성한 책은 EPUB 파일로 내보내 전자책 서점이나 리더기에 올릴 수 있습니다.",
              buttons: ["확인"],
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // 맥에서는 창을 닫아도 앱은 살아 있는 것이 일반적이다.
  if (process.platform !== "darwin") app.quit();
});

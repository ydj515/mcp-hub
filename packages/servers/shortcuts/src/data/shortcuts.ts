import type { Shortcut } from "../types/shortcut.js";

export const intellijShortcuts: Shortcut[] = [
  {
    category: "intellij",
    action: "문제 자동 수정",
    mac: "option + enter",
    win: "alt + enter",
    keywords: ["auto quick fix"]
  },
  {
    category: "intellij",
    action: "자동정렬",
    mac: "⌘ + option + l",
    win: "ctrl + alt + l",
    keywords: [
      "format",
      "auto format",
      "code format",
      "code align",
      "code beautify",
      "pretty",
      "command"
    ]
  },
  {
    category: "intellij",
    action: "파일 전체 자동정렬",
    mac: "⌘ + option + ⇧ + l",
    win: "ctrl + alt + ⇧ + l",
    keywords: [
      "format",
      "auto format",
      "code format",
      "code align",
      "code beautify",
      "pretty",
      "command"
    ]
  },
  {
    category: "intellij",
    action: "자동완성",
    mac: "ctrl + space",
    win: "ctrl + space",
    keywords: ["autocomplete", "auto complete"]
  },
  {
    category: "intellij",
    action: "generate getter, setter, constructor",
    mac: "⌘ + n",
    win: "alt + insert",
    keywords: ["generate", "getter", "setter", "constructor", "command"]
  },
  {
    category: "intellij",
    action: "파일 찾기",
    mac: "⌘ + ⇧ + o",
    win: "ctrl + ⇧ + n",
    keywords: ["file search", "find file", "command", "shift"]
  },
  {
    category: "intellij",
    action: "파일 및 여러가지 찾기",
    mac: "⇧ + ⇧",
    win: "⇧ + ⇧",
    keywords: ["search everywhere", "find all", "shift"]
  },
  {
    category: "intellij",
    action: "이전 커서",
    mac: "⌘ + [",
    win: "ctrl + alt + ←",
    keywords: ["cursor back", "go to previous cursor", "command"]
  },
  {
    category: "intellij",
    action: "다음 커서",
    mac: "⌘ + ]",
    win: "ctrl + alt + →",
    keywords: ["cursor forward", "go to next cursor", "command"]
  },
  {
    category: "intellij",
    action: "탭 이동(왼쪽)",
    mac: "⌘ + ⇧ + [",
    win: "alt + ←",
    keywords: ["tab move left", "command", "shift"]
  },
  {
    category: "intellij",
    action: "탭 이동(오른쪽)",
    mac: "⌘ + ⇧ + ]",
    win: "alt + →",
    keywords: ["tab move right", "command", "shift"]
  },
  {
    category: "intellij",
    action: "라인검색",
    mac: "⌘ + l",
    win: "ctrl + g",
    keywords: ["go to line", "command"]
  },
  {
    category: "intellij",
    action: "창 닫기",
    mac: "⌘ + w",
    win: "ctrl + f4",
    keywords: ["close window", "command"]
  },
  {
    category: "intellij",
    action: "한줄 삭제",
    mac: "⌘ + backspace",
    win: "ctrl + y",
    keywords: ["delete one line", "command"]
  },
  {
    category: "intellij",
    action: "한줄 복사",
    mac: "⌘ + d",
    win: "ctrl + d",
    keywords: ["duplicate one line", "copy one line", "command"]
  },
  {
    category: "intellij",
    action: "실행",
    mac: "ctrl + r",
    win: "⇧ + f10",
    keywords: ["run", "execute", "shift"]
  },
  {
    category: "intellij",
    action: "상위 implement 찾기",
    mac: "⌘ + U",
    win: "ctrl + U",
    keywords: ["find super", "implement", "command"]
  },
  {
    category: "intellij",
    action: "implement 구현된 곳 찾기",
    mac: "⌘ + option + B",
    win: "ctrl + alt + B",
    keywords: ["go to implementation", "interface", "implement", "command"]
  },
  {
    category: "intellij",
    action: "사용하는 곳 찾기 (팝업)",
    mac: "⌘ + option + F7",
    win: "ctrl + alt + F7",
    keywords: ["show usages", "find usage", "popup", "command"]
  },
  {
    category: "intellij",
    action: "최근 닫았던(열었던) 창 목록",
    mac: "⌘ + e",
    win: "ctrl + e",
    keywords: ["closed recent files", "command"]
  },
  {
    category: "intellij",
    action: "project structure 열기",
    mac: "⌘ + ;",
    win: "ctrl + alt + ⇧ + S",
    keywords: ["settings", "project structure", "command", "shift"]
  },
  {
    category: "intellij",
    action: "환경설정",
    mac: "⌘ + ,",
    win: "ctrl + alt + s",
    keywords: ["settings", "command"]
  },
  {
    category: "intellij",
    action: "왼쪽 프로젝트 창 보이기",
    mac: "⌘ + 1",
    win: "alt + 1",
    keywords: ["left project window view", "command"]
  },
  {
    category: "intellij",
    action: "터미널 열기",
    mac: "option + fn + f12",
    win: "alt + f12",
    keywords: ["open terminal"]
  },
  {
    category: "intellij",
    action: "액션 찾기",
    mac: "⌘ + ⇧ + A",
    win: "ctrl + ⇧ + A",
    keywords: ["find action", "command", "search action", "shift"]
  },
  {
    category: "intellij",
    action: "코드 이슈 간 이동",
    mac: "F2 / ⇧ + F2",
    win: "F2 / ⇧ + F2",
    keywords: ["navigate", "code issues", "error", "shift"]
  },
  {
    category: "intellij",
    action: "현재 문장 완성",
    mac: "⌘ + ⇧ + Enter",
    win: "ctrl + ⇧ + Enter",
    keywords: ["complete sentence", "complete statement", "command", "shift"]
  },
  {
    category: "intellij",
    action: "리팩토링 실행",
    mac: "ctrl + T",
    win: "ctrl + alt + ⇧ + T",
    keywords: ["refactor", "refactoring", "shift"]
  },
  {
    category: "intellij",
    action: "선택 영역 확장/축소",
    mac: "option + ↑ / option + ↓",
    win: "ctrl + W / ctrl + ⇧ + W",
    keywords: ["extend selection", "shrink selection", "shift"]
  },
  {
    category: "intellij",
    action: "라인/블록 주석 추가/제거",
    mac: "⌘ + / 또는 ⌘ + option + /",
    win: "ctrl + / 또는 ctrl + ⇧ + /",
    keywords: ["comment", "block comment", "line comment", "command", "shift"]
  },
  {
    category: "intellij",
    action: "선언부로 이동",
    mac: "⌘ + B",
    win: "ctrl + B",
    keywords: ["go to declaration", "declaration", "command"]
  },
  {
    category: "intellij",
    action: "사용처 찾기",
    mac: "option + F7",
    win: "alt + F7",
    keywords: ["find usages", "usage"]
  },
  {
    category: "intellij",
    action: "에디터 포커스",
    mac: "Esc",
    win: "Esc",
    keywords: ["focus on editor", "escape"]
  },
  {
    category: "intellij",
    action: "브레이크포인트 추가/제거 (토글)",
    mac: "⌘ + F8",
    win: "ctrl + F8",
    keywords: ["break point", "toggle breakpoint", "debug", "command"]
  },
  {
    category: "intellij",
    action: "모든 브레이크포인트 보기",
    mac: "⌘ + ⇧ + F8",
    win: "ctrl + ⇧ + F8",
    keywords: ["view breakpoints", "breakpoint list", "debug", "command", "shift"]
  },
  {
    category: "intellij",
    action: "브레이크포인트 비활성화 (토글)",
    mac: "option + 클릭 (브레이크포인트)",
    win: "alt + 클릭 (브레이크포인트)",
    keywords: ["disable breakpoint", "mute breakpoint", "debug"]
  },
  {
    category: "intellij",
    action: "북마크 추가/제거 (토글)",
    mac: "F3",
    win: "F11",
    keywords: ["bookmark", "toggle bookmark", "add bookmark", "remove bookmark"]
  },
  {
    category: "intellij",
    action: "북마크 목록 보기",
    mac: "⌘ + F3",
    win: "⇧ + F11",
    keywords: ["bookmark", "list bookmark", "show bookmarks", "command", "shift"]
  },
  {
    category: "intellij",
    action: "니모닉 북마크 추가 (숫자/문자 지정)",
    mac: "option + F3",
    win: "ctrl + F11",
    keywords: ["mnemonic bookmark", "numbered bookmark", "labeled bookmark"]
  },
  {
    category: "intellij",
    action: "숫자 북마크로 이동 (0~9)",
    mac: "ctrl + 0~9",
    win: "ctrl + 0~9",
    keywords: ["go to bookmark", "numbered bookmark", "navigate bookmark"]
  },
  // --- 디버깅 ---
  {
    category: "intellij",
    action: "디버그 실행",
    mac: "ctrl + D",
    win: "⇧ + F9",
    keywords: ["debug", "run debug", "shift"]
  },
  {
    category: "intellij",
    action: "Step Over (다음 줄)",
    mac: "F8",
    win: "F8",
    keywords: ["step over", "debug", "next line"]
  },
  {
    category: "intellij",
    action: "Step Into (함수 내부로)",
    mac: "F7",
    win: "F7",
    keywords: ["step into", "debug", "enter function"]
  },
  {
    category: "intellij",
    action: "Step Out (함수 밖으로)",
    mac: "⇧ + F8",
    win: "⇧ + F8",
    keywords: ["step out", "debug", "exit function", "shift"]
  },
  {
    category: "intellij",
    action: "Resume (계속 실행)",
    mac: "⌘ + option + R",
    win: "F9",
    keywords: ["resume", "continue", "debug", "command"]
  },
  {
    category: "intellij",
    action: "Evaluate Expression (디버그 중 식 평가)",
    mac: "option + F8",
    win: "alt + F8",
    keywords: ["evaluate", "expression", "debug", "inspect"]
  },
  {
    category: "intellij",
    action: "실행 중지",
    mac: "⌘ + F2",
    win: "ctrl + F2",
    keywords: ["stop", "terminate", "kill", "command"]
  },
  {
    category: "intellij",
    action: "Run Configuration 선택 실행",
    mac: "ctrl + option + R",
    win: "alt + ⇧ + F10",
    keywords: ["run config", "configuration", "shift"]
  },
  {
    category: "intellij",
    action: "Debug Configuration 선택 실행",
    mac: "ctrl + option + D",
    win: "alt + ⇧ + F9",
    keywords: ["debug config", "configuration", "shift"]
  },
  // --- 리팩토링 ---
  {
    category: "intellij",
    action: "이름 변경 (Rename)",
    mac: "⇧ + F6",
    win: "⇧ + F6",
    keywords: ["rename", "refactor", "이름 변경", "shift"]
  },
  {
    category: "intellij",
    action: "메서드 추출 (Extract Method)",
    mac: "⌘ + option + M",
    win: "ctrl + alt + M",
    keywords: ["extract method", "refactor", "command"]
  },
  {
    category: "intellij",
    action: "변수 추출 (Extract Variable)",
    mac: "⌘ + option + V",
    win: "ctrl + alt + V",
    keywords: ["extract variable", "refactor", "command"]
  },
  {
    category: "intellij",
    action: "상수 추출 (Extract Constant)",
    mac: "⌘ + option + C",
    win: "ctrl + alt + C",
    keywords: ["extract constant", "refactor", "command"]
  },
  {
    category: "intellij",
    action: "필드 추출 (Extract Field)",
    mac: "⌘ + option + F",
    win: "ctrl + alt + F",
    keywords: ["extract field", "refactor", "command"]
  },
  {
    category: "intellij",
    action: "파라미터 추출 (Extract Parameter)",
    mac: "⌘ + option + P",
    win: "ctrl + alt + P",
    keywords: ["extract parameter", "refactor", "command"]
  },
  {
    category: "intellij",
    action: "인라인 (Inline)",
    mac: "⌘ + option + N",
    win: "ctrl + alt + N",
    keywords: ["inline", "refactor", "command"]
  },
  {
    category: "intellij",
    action: "클래스/파일 이동 (Move)",
    mac: "F6",
    win: "F6",
    keywords: ["move class", "move file", "refactor"]
  },
  {
    category: "intellij",
    action: "시그니처 변경 (Change Signature)",
    mac: "⌘ + F6",
    win: "ctrl + F6",
    keywords: ["change signature", "refactor", "parameter", "command"]
  },
  {
    category: "intellij",
    action: "Safe Delete",
    mac: "⌘ + delete",
    win: "alt + delete",
    keywords: ["safe delete", "refactor", "command"]
  },
  // --- 네비게이션 ---
  {
    category: "intellij",
    action: "클래스 검색 (Go to Class)",
    mac: "⌘ + O",
    win: "ctrl + N",
    keywords: ["go to class", "find class", "command"]
  },
  {
    category: "intellij",
    action: "심볼 검색 (Go to Symbol)",
    mac: "⌘ + option + O",
    win: "ctrl + alt + ⇧ + N",
    keywords: ["go to symbol", "find symbol", "command", "shift"]
  },
  {
    category: "intellij",
    action: "타입 계층 구조 (Type Hierarchy)",
    mac: "ctrl + H",
    win: "ctrl + H",
    keywords: ["type hierarchy", "class hierarchy", "inheritance"]
  },
  {
    category: "intellij",
    action: "호출 계층 구조 (Call Hierarchy)",
    mac: "ctrl + option + H",
    win: "ctrl + alt + H",
    keywords: ["call hierarchy", "caller", "callee"]
  },
  {
    category: "intellij",
    action: "파일 구조 보기 (File Structure)",
    mac: "⌘ + F12",
    win: "ctrl + F12",
    keywords: ["file structure", "outline", "method list", "command"]
  },
  {
    category: "intellij",
    action: "테스트로 이동 / 테스트에서 원본으로",
    mac: "⌘ + ⇧ + T",
    win: "ctrl + ⇧ + T",
    keywords: ["go to test", "test", "create test", "command", "shift"]
  },
  {
    category: "intellij",
    action: "다음 메서드로 이동",
    mac: "ctrl + ⇧ + ↓",
    win: "alt + ↓",
    keywords: ["next method", "navigate method", "shift"]
  },
  {
    category: "intellij",
    action: "이전 메서드로 이동",
    mac: "ctrl + ⇧ + ↑",
    win: "alt + ↑",
    keywords: ["previous method", "navigate method", "shift"]
  },
  {
    category: "intellij",
    action: "최근 변경 파일 목록",
    mac: "⌘ + ⇧ + E",
    win: "ctrl + ⇧ + E",
    keywords: ["recent changes", "recently edited", "command", "shift"]
  },
  {
    category: "intellij",
    action: "파라미터 정보 보기",
    mac: "⌘ + P",
    win: "ctrl + P",
    keywords: ["parameter info", "hint", "command"]
  },
  {
    category: "intellij",
    action: "Quick Documentation (빠른 문서 보기)",
    mac: "F1",
    win: "ctrl + Q",
    keywords: ["documentation", "javadoc", "quick doc"]
  },
  {
    category: "intellij",
    action: "Quick Definition (빠른 정의 보기)",
    mac: "option + space",
    win: "ctrl + ⇧ + I",
    keywords: ["quick definition", "peek definition", "shift"]
  },
  // --- 편집 ---
  {
    category: "intellij",
    action: "코드 감싸기 (Surround With)",
    mac: "⌘ + option + T",
    win: "ctrl + alt + T",
    keywords: ["surround with", "wrap", "try catch", "if", "command"]
  },
  {
    category: "intellij",
    action: "Live Template 삽입",
    mac: "⌘ + J",
    win: "ctrl + J",
    keywords: ["live template", "snippet", "code template", "command"]
  },
  {
    category: "intellij",
    action: "코드 접기 (Fold)",
    mac: "⌘ + -",
    win: "ctrl + -",
    keywords: ["fold", "collapse", "hide code", "command"]
  },
  {
    category: "intellij",
    action: "코드 펼치기 (Unfold)",
    mac: "⌘ + +",
    win: "ctrl + +",
    keywords: ["unfold", "expand", "show code", "command"]
  },
  {
    category: "intellij",
    action: "전체 코드 접기",
    mac: "⌘ + ⇧ + -",
    win: "ctrl + ⇧ + -",
    keywords: ["fold all", "collapse all", "command", "shift"]
  },
  {
    category: "intellij",
    action: "전체 코드 펼치기",
    mac: "⌘ + ⇧ + +",
    win: "ctrl + ⇧ + +",
    keywords: ["unfold all", "expand all", "command", "shift"]
  },
  {
    category: "intellij",
    action: "줄 합치기 (Join Lines)",
    mac: "ctrl + ⇧ + J",
    win: "ctrl + ⇧ + J",
    keywords: ["join lines", "merge lines", "shift"]
  },
  {
    category: "intellij",
    action: "줄 위/아래로 이동",
    mac: "option + ⇧ + ↑ / ↓",
    win: "alt + ⇧ + ↑ / ↓",
    keywords: ["move line", "move statement", "shift"]
  },
  {
    category: "intellij",
    action: "구문 위/아래로 이동 (Move Statement)",
    mac: "⌘ + ⇧ + ↑ / ↓",
    win: "ctrl + ⇧ + ↑ / ↓",
    keywords: ["move statement", "move block", "command", "shift"]
  },
  {
    category: "intellij",
    action: "Column Selection Mode (세로 선택)",
    mac: "⌘ + ⇧ + 8",
    win: "alt + ⇧ + insert",
    keywords: ["column select", "vertical select", "block select", "command", "shift"]
  },
  {
    category: "intellij",
    action: "멀티 커서 추가",
    mac: "option + option(hold) + ↑ / ↓",
    win: "ctrl + ctrl(hold) + ↑ / ↓",
    keywords: ["multi cursor", "add caret", "multiple cursor"]
  },
  {
    category: "intellij",
    action: "대소문자 변환 (Toggle Case)",
    mac: "⌘ + ⇧ + U",
    win: "ctrl + ⇧ + U",
    keywords: ["toggle case", "uppercase", "lowercase", "command", "shift"]
  },
  {
    category: "intellij",
    action: "자동 import 최적화",
    mac: "ctrl + option + O",
    win: "ctrl + alt + O",
    keywords: ["optimize imports", "remove unused imports", "import"]
  },
  // --- Git ---
  {
    category: "intellij",
    action: "Git Commit",
    mac: "⌘ + K",
    win: "ctrl + K",
    keywords: ["git", "commit", "command"]
  },
  {
    category: "intellij",
    action: "Git Push",
    mac: "⌘ + ⇧ + K",
    win: "ctrl + ⇧ + K",
    keywords: ["git", "push", "command", "shift"]
  },
  {
    category: "intellij",
    action: "Git Pull / Update",
    mac: "⌘ + T",
    win: "ctrl + T",
    keywords: ["git", "pull", "update", "fetch", "command"]
  },
  {
    category: "intellij",
    action: "Git Log 보기",
    mac: "⌘ + 9",
    win: "alt + 9",
    keywords: ["git", "log", "history", "version control", "command"]
  },
  {
    category: "intellij",
    action: "Git Annotate (Blame)",
    mac: "우클릭 → Git → Annotate",
    win: "우클릭 → Git → Annotate",
    keywords: ["git", "blame", "annotate", "author"]
  },
  {
    category: "intellij",
    action: "Diff (변경 사항 비교)",
    mac: "⌘ + D (Version Control에서)",
    win: "ctrl + D (Version Control에서)",
    keywords: ["diff", "compare", "변경 비교", "command"]
  },
  {
    category: "intellij",
    action: "변경 롤백 (Rollback)",
    mac: "⌘ + option + Z",
    win: "ctrl + alt + Z",
    keywords: ["rollback", "revert", "git", "undo change", "command"]
  },
  // --- 빌드/도구 창 ---
  {
    category: "intellij",
    action: "프로젝트 빌드",
    mac: "⌘ + F9",
    win: "ctrl + F9",
    keywords: ["build", "compile", "make", "command"]
  },
  {
    category: "intellij",
    action: "도구 창 숨기기/보이기",
    mac: "⌘ + ⇧ + F12",
    win: "ctrl + ⇧ + F12",
    keywords: ["hide tool windows", "maximize editor", "command", "shift"]
  },
  {
    category: "intellij",
    action: "전체 화면 전환",
    mac: "ctrl + ⌘ + F",
    win: "F11",
    keywords: ["full screen", "전체 화면"]
  },
  // --- 같은 단어 선택 / 찾기 바꾸기 ---
  {
    category: "intellij",
    action: "같은 단어 순차 선택 (Add Selection for Next Occurrence)",
    mac: "ctrl + G",
    win: "alt + J",
    keywords: ["select next occurrence", "같은 단어", "순차 선택", "multi select"]
  },
  {
    category: "intellij",
    action: "모든 같은 단어 일괄 선택 (Select All Occurrences)",
    mac: "ctrl + ⌘ + G",
    win: "ctrl + alt + ⇧ + J",
    keywords: ["select all occurrences", "같은 단어 전체", "일괄 선택", "shift"]
  },
  {
    category: "intellij",
    action: "파일 내 찾기",
    mac: "⌘ + F",
    win: "ctrl + F",
    keywords: ["find", "search", "찾기", "command"]
  },
  {
    category: "intellij",
    action: "파일 내 바꾸기 (Replace)",
    mac: "⌘ + R",
    win: "ctrl + R",
    keywords: ["replace", "find and replace", "바꾸기", "command"]
  },
  {
    category: "intellij",
    action: "프로젝트 전체에서 찾기 (Find in Path)",
    mac: "⌘ + ⇧ + F",
    win: "ctrl + ⇧ + F",
    keywords: ["find in path", "global search", "프로젝트 검색", "command", "shift"]
  },
  {
    category: "intellij",
    action: "프로젝트 전체에서 바꾸기 (Replace in Path)",
    mac: "⌘ + ⇧ + R",
    win: "ctrl + ⇧ + R",
    keywords: ["replace in path", "global replace", "프로젝트 바꾸기", "command", "shift"]
  }
];

export const figmaShortcuts: Shortcut[] = [
  {
    category: "figma",
    action: "프레임 만들기",
    mac: "A",
    win: "A",
    keywords: ["frame", "create frame"]
  },
  {
    category: "figma",
    action: "사각형",
    mac: "R",
    win: "R",
    keywords: ["rectangle", "shape"]
  },
  {
    category: "figma",
    action: "원",
    mac: "O",
    win: "O",
    keywords: ["circle", "ellipse", "shape"]
  },
  {
    category: "figma",
    action: "선",
    mac: "L",
    win: "L",
    keywords: ["line", "draw line"]
  },
  {
    category: "figma",
    action: "텍스트",
    mac: "T",
    win: "T",
    keywords: ["text", "type", "font"]
  },
  {
    category: "figma",
    action: "펜툴",
    mac: "P",
    win: "P",
    keywords: ["pen tool", "draw path"]
  },
  {
    category: "figma",
    action: "이미지 삽입",
    mac: "⇧ + ⌘ + K",
    win: "⇧ + Ctrl + K",
    keywords: ["image", "insert image", "add image", "shift", "command"]
  },
  {
    category: "figma",
    action: "컴포넌트 만들기",
    mac: "⌘ + option + K",
    win: "Ctrl + Alt + K",
    keywords: ["component", "create component", "command"]
  },
  {
    category: "figma",
    action: "컴포넌트 분리",
    mac: "⌘ + option + B",
    win: "Ctrl + Alt + B",
    keywords: ["component", "detach", "ungroup component", "command"]
  },
  {
    category: "figma",
    action: "컴포넌트 인스턴스 찾기",
    mac: "⌘ + I",
    win: "Ctrl + I",
    keywords: ["component", "find instance", "command"]
  },
  {
    category: "figma",
    action: "라이브러리 열기",
    mac: "⌘ + option + O",
    win: "Ctrl + Alt + O",
    keywords: ["library", "open library", "component library", "command"]
  },
  {
    category: "figma",
    action: "오토레이아웃 추가",
    mac: "⇧ + A",
    win: "⇧ + A",
    keywords: ["auto layout", "add auto layout", "shift"]
  },
  {
    category: "figma",
    action: "오토레이아웃 제거",
    mac: "option + ⇧ + A",
    win: "alt + ⇧ + A",
    keywords: [
      "auto layout",
      "remove auto layout",
      "delete auto layout",
      "detach auto layout",
      "shift"
    ]
  },
  {
    category: "figma",
    action: "간격 조절",
    mac: "option + ↑/↓",
    win: "Alt + ↑/↓",
    keywords: ["spacing", "adjust spacing", "gap"]
  },
  {
    category: "figma",
    action: "패딩 조절",
    mac: "⌘ + option + ↑/↓",
    win: "Ctrl + Alt + ↑/↓",
    keywords: ["padding", "adjust padding", "command"]
  },
  {
    category: "figma",
    action: "좌측 정렬",
    mac: "option + A",
    win: "Alt + A",
    keywords: ["align", "left align"]
  },
  {
    category: "figma",
    action: "가운데 정렬",
    mac: "option + H",
    win: "Alt + H",
    keywords: ["align", "center align", "horizontal align"]
  },
  {
    category: "figma",
    action: "상하 정렬",
    mac: "option + W",
    win: "Alt + W",
    keywords: ["align", "vertical align", "top bottom align"]
  },
  {
    category: "figma",
    action: "그룹 만들기",
    mac: "⌘ + G",
    win: "Ctrl + G",
    keywords: ["group", "create group", "command"]
  },
  {
    category: "figma",
    action: "그룹 해제",
    mac: "⌘ + ⇧ + G",
    win: "Ctrl + ⇧ + G",
    keywords: ["ungroup", "release group", "command", "shift"]
  },
  {
    category: "figma",
    action: "뒤 객체 선택",
    mac: "⌘ + 클릭",
    win: "Ctrl + 클릭",
    keywords: ["select behind", "select under", "layer select", "command"]
  },
  {
    category: "figma",
    action: "다중 선택",
    mac: "⇧ + 클릭",
    win: "⇧ + 클릭",
    keywords: ["multi select", "multiple select", "select many", "shift"]
  },
  {
    category: "figma",
    action: "한 픽셀 이동",
    mac: "방향키",
    win: "방향키",
    keywords: ["move", "nudge", "1px"]
  },
  {
    category: "figma",
    action: "10px 이동",
    mac: "⇧ + 방향키",
    win: "⇧ + 방향키",
    keywords: ["move", "nudge", "10px", "shift"]
  },
  {
    category: "figma",
    action: "전체 보기",
    mac: "⇧ + 1",
    win: "⇧ + 1",
    keywords: ["zoom out", "fit view", "show all", "shift"]
  },
  {
    category: "figma",
    action: "선택 확대",
    mac: "⇧ + 2",
    win: "⇧ + 2",
    keywords: ["zoom to selection", "zoom in", "focus on object", "shift"]
  },
  {
    category: "figma",
    action: "실제 픽셀 보기",
    mac: "⌘ + 1",
    win: "Ctrl + 1",
    keywords: ["actual pixels", "zoom 100%", "pixel preview", "command"]
  },
  {
    category: "figma",
    action: "가이드 보기",
    mac: "⌘ + G",
    win: "Ctrl + G",
    keywords: ["guides", "show guides", "grid", "command"]
  },
  {
    category: "figma",
    action: "내보내기",
    mac: "⇧ + ⌘ + E",
    win: "⇧ + Ctrl + E",
    keywords: ["export", "save", "shift", "command"]
  },
  {
    category: "figma",
    action: "링크 복사",
    mac: "⌘ + L",
    win: "Ctrl + L",
    keywords: ["copy link", "share link", "url", "command"]
  },
  {
    category: "figma",
    action: "PDF로 내보내기",
    mac: "파일 메뉴 > Export 선택",
    win: "파일 메뉴 > Export 선택",
    keywords: ["export pdf", "save as pdf"]
  },
  {
    category: "figma",
    action: "단축키 보기",
    mac: "?",
    win: "?",
    keywords: ["shortcuts", "help", "hotkeys"]
  },
  {
    category: "figma",
    action: "설정 열기",
    mac: "⌘ + ,",
    win: "Ctrl + ,",
    keywords: ["settings", "preferences", "options", "command"]
  }
];

export const vscodeShortcuts: Shortcut[] = [
  {
    category: "vscode",
    action: "문제 자동 수정",
    mac: "⌘ + .",
    win: "ctrl + .",
    keywords: ["quick fix", "auto fix", "문제 해결", "command"]
  },
  {
    category: "vscode",
    action: "자동 정렬",
    mac: "⇧ + option + F",
    win: "⇧ + alt + F",
    keywords: ["format", "코드 정렬", "pretty", "code", "shift"]
  },
  {
    category: "vscode",
    action: "파일 탐색기 열기/닫기",
    mac: "⌘ + B",
    win: "ctrl + B",
    keywords: ["sidebar", "explorer", "파일 트리", "file", "command"]
  },
  {
    category: "vscode",
    action: "전체 선택",
    mac: "⌘ + A",
    win: "ctrl + A",
    keywords: ["select all", "find all", "command"]
  },
  {
    category: "vscode",
    action: "찾기",
    mac: "⌘ + F",
    win: "ctrl + F",
    keywords: ["search", "find", "command"]
  },
  {
    category: "vscode",
    action: "찾아서 바꾸기",
    mac: "⌘ + option + F",
    win: "ctrl + H",
    keywords: ["replace", "command"]
  },
  {
    category: "vscode",
    action: "전체 프로젝트에서 찾기",
    mac: "⌘ + ⇧ + F",
    win: "ctrl + ⇧ + F",
    keywords: ["global search", "command", "shift"]
  },
  {
    category: "vscode",
    action: "명령어 팔레트 열기",
    mac: "⌘ + ⇧ + P",
    win: "ctrl + ⇧ + P",
    keywords: ["command palette", "명령어", "command", "shift"]
  },
  {
    category: "vscode",
    action: "터미널 열기",
    mac: "ctrl + `",
    win: "ctrl + `",
    keywords: ["terminal", "터미널"]
  },
  {
    category: "vscode",
    action: "파일 열기",
    mac: "⌘ + P",
    win: "ctrl + P",
    keywords: ["go to file", "파일 검색", "command"]
  },
  {
    category: "vscode",
    action: "줄 복사",
    mac: "⇧ + option + ↓ / ↑",
    win: "⇧ + alt + ↓ / ↑",
    keywords: ["duplicate line", "shift"]
  },
  {
    category: "vscode",
    action: "줄 이동",
    mac: "option + ↓ / ↑",
    win: "alt + ↓ / ↑",
    keywords: ["move line", "go to line"]
  },
  {
    category: "vscode",
    action: "주석 토글",
    mac: "⌘ + /",
    win: "ctrl + /",
    keywords: ["toggle comment", "주석", "addcomment", "command"]
  },
  {
    category: "vscode",
    action: "멀티 커서(같은 단어 선택)",
    mac: "⌘ + D",
    win: "ctrl + D",
    keywords: ["multi cursor", "select next", "command"]
  },
  {
    category: "vscode",
    action: "파일 저장",
    mac: "⌘ + S",
    win: "ctrl + S",
    keywords: ["file save", "command"]
  },
  {
    category: "vscode",
    action: "전체 저장",
    mac: "⌘ + option + S",
    win: "ctrl + K, S",
    keywords: ["save all", "command"]
  },
  {
    category: "vscode",
    action: "새 터미널 열기",
    mac: "ctrl + ⇧ + `",
    win: "ctrl + ⇧ + `",
    keywords: ["new terminal", "shift"]
  },
  {
    category: "vscode",
    action: "미니맵 켜기/끄기",
    mac: "⌘ + ⇧ + P → 'toggle minimap'",
    win: "ctrl + ⇧ + P → 'toggle minimap'",
    keywords: ["minimap", "off", "on", "command", "shift"]
  },
  {
    category: "vscode",
    action: "이전 커서 위치로 이동",
    mac: "ctrl + -",
    win: "alt + ←",
    keywords: ["go back", "cursor history"]
  },
  {
    category: "vscode",
    action: "다음 커서 위치로 이동",
    mac: "ctrl + ⇧ + -",
    win: "alt + →",
    keywords: ["go forward", "cursor history", "shift"]
  },
  // --- 디버깅 ---
  {
    category: "vscode",
    action: "디버그 시작 / 계속",
    mac: "F5",
    win: "F5",
    keywords: ["debug", "start debug", "continue"]
  },
  {
    category: "vscode",
    action: "디버그 중지",
    mac: "⇧ + F5",
    win: "⇧ + F5",
    keywords: ["stop debug", "terminate", "shift"]
  },
  {
    category: "vscode",
    action: "Step Over (다음 줄)",
    mac: "F10",
    win: "F10",
    keywords: ["step over", "debug", "next line"]
  },
  {
    category: "vscode",
    action: "Step Into (함수 내부로)",
    mac: "F11",
    win: "F11",
    keywords: ["step into", "debug", "enter function"]
  },
  {
    category: "vscode",
    action: "Step Out (함수 밖으로)",
    mac: "⇧ + F11",
    win: "⇧ + F11",
    keywords: ["step out", "debug", "exit function", "shift"]
  },
  {
    category: "vscode",
    action: "브레이크포인트 토글",
    mac: "F9",
    win: "F9",
    keywords: ["breakpoint", "toggle breakpoint", "debug"]
  },
  {
    category: "vscode",
    action: "디버그 콘솔 열기",
    mac: "⌘ + ⇧ + Y",
    win: "ctrl + ⇧ + Y",
    keywords: ["debug console", "command", "shift"]
  },
  // --- 편집 ---
  {
    category: "vscode",
    action: "블록 주석 토글",
    mac: "⇧ + option + A",
    win: "⇧ + alt + A",
    keywords: ["block comment", "toggle block comment", "shift"]
  },
  {
    category: "vscode",
    action: "줄 삭제",
    mac: "⌘ + ⇧ + K",
    win: "ctrl + ⇧ + K",
    keywords: ["delete line", "remove line", "command", "shift"]
  },
  {
    category: "vscode",
    action: "아래에 빈 줄 삽입",
    mac: "⌘ + enter",
    win: "ctrl + enter",
    keywords: ["insert line below", "new line", "command"]
  },
  {
    category: "vscode",
    action: "위에 빈 줄 삽입",
    mac: "⌘ + ⇧ + enter",
    win: "ctrl + ⇧ + enter",
    keywords: ["insert line above", "new line", "command", "shift"]
  },
  {
    category: "vscode",
    action: "코드 접기 (Fold)",
    mac: "⌘ + option + [",
    win: "ctrl + ⇧ + [",
    keywords: ["fold", "collapse", "hide code", "command", "shift"]
  },
  {
    category: "vscode",
    action: "코드 펼치기 (Unfold)",
    mac: "⌘ + option + ]",
    win: "ctrl + ⇧ + ]",
    keywords: ["unfold", "expand", "show code", "command", "shift"]
  },
  {
    category: "vscode",
    action: "전체 코드 접기",
    mac: "⌘ + K → ⌘ + 0",
    win: "ctrl + K → ctrl + 0",
    keywords: ["fold all", "collapse all", "command"]
  },
  {
    category: "vscode",
    action: "전체 코드 펼치기",
    mac: "⌘ + K → ⌘ + J",
    win: "ctrl + K → ctrl + J",
    keywords: ["unfold all", "expand all", "command"]
  },
  {
    category: "vscode",
    action: "들여쓰기 증가",
    mac: "⌘ + ]",
    win: "ctrl + ]",
    keywords: ["indent", "increase indent", "tab", "command"]
  },
  {
    category: "vscode",
    action: "들여쓰기 감소",
    mac: "⌘ + [",
    win: "ctrl + [",
    keywords: ["outdent", "decrease indent", "untab", "command"]
  },
  {
    category: "vscode",
    action: "Emmet 약어 확장",
    mac: "tab",
    win: "tab",
    keywords: ["emmet", "abbreviation", "expand", "html"]
  },
  {
    category: "vscode",
    action: "매칭 괄호로 이동",
    mac: "⌘ + ⇧ + \\",
    win: "ctrl + ⇧ + \\",
    keywords: ["go to bracket", "matching bracket", "command", "shift"]
  },
  {
    category: "vscode",
    action: "정의로 이동 (Go to Definition)",
    mac: "F12",
    win: "F12",
    keywords: ["go to definition", "declaration"]
  },
  {
    category: "vscode",
    action: "정의 미리보기 (Peek Definition)",
    mac: "option + F12",
    win: "alt + F12",
    keywords: ["peek definition", "preview definition"]
  },
  {
    category: "vscode",
    action: "참조 찾기 (Find All References)",
    mac: "⇧ + F12",
    win: "⇧ + F12",
    keywords: ["find references", "find usage", "shift"]
  },
  {
    category: "vscode",
    action: "심볼 이름 변경 (Rename Symbol)",
    mac: "F2",
    win: "F2",
    keywords: ["rename", "rename symbol", "refactor"]
  },
  {
    category: "vscode",
    action: "같은 단어 전체 선택",
    mac: "⌘ + ⇧ + L",
    win: "ctrl + ⇧ + L",
    keywords: ["select all occurrences", "같은 단어", "command", "shift"]
  },
  {
    category: "vscode",
    action: "현재 줄 위/아래로 복사",
    mac: "⇧ + option + ↓ / ↑",
    win: "⇧ + alt + ↓ / ↑",
    keywords: ["copy line", "duplicate line", "shift"]
  },
  {
    category: "vscode",
    action: "줄 정렬 (오름차순)",
    mac: "⌘ + ⇧ + P → 'Sort Lines Ascending'",
    win: "ctrl + ⇧ + P → 'Sort Lines Ascending'",
    keywords: ["sort lines", "정렬", "command", "shift"]
  },
  {
    category: "vscode",
    action: "후행 공백 제거",
    mac: "⌘ + K → ⌘ + X",
    win: "ctrl + K → ctrl + X",
    keywords: ["trim whitespace", "trailing spaces", "command"]
  },
  {
    category: "vscode",
    action: "대소문자 변환 (대문자)",
    mac: "⌘ + ⇧ + P → 'Transform to Uppercase'",
    win: "ctrl + ⇧ + P → 'Transform to Uppercase'",
    keywords: ["uppercase", "대문자", "transform", "command", "shift"]
  },
  {
    category: "vscode",
    action: "대소문자 변환 (소문자)",
    mac: "⌘ + ⇧ + P → 'Transform to Lowercase'",
    win: "ctrl + ⇧ + P → 'Transform to Lowercase'",
    keywords: ["lowercase", "소문자", "transform", "command", "shift"]
  },
  // --- 멀티 커서 ---
  {
    category: "vscode",
    action: "멀티 커서 추가 (임의 위치)",
    mac: "option + 클릭",
    win: "alt + 클릭",
    keywords: ["multi cursor", "add cursor", "multiple cursor"]
  },
  {
    category: "vscode",
    action: "멀티 커서 (위/아래 추가)",
    mac: "⌘ + option + ↑ / ↓",
    win: "ctrl + alt + ↑ / ↓",
    keywords: ["multi cursor", "add cursor above below", "command"]
  },
  // --- 네비게이션 ---
  {
    category: "vscode",
    action: "워크스페이스 심볼 검색",
    mac: "⌘ + T",
    win: "ctrl + T",
    keywords: ["go to symbol workspace", "find symbol", "command"]
  },
  {
    category: "vscode",
    action: "파일 내 심볼 검색",
    mac: "⌘ + ⇧ + O",
    win: "ctrl + ⇧ + O",
    keywords: ["go to symbol file", "outline", "command", "shift"]
  },
  {
    category: "vscode",
    action: "라인으로 이동",
    mac: "ctrl + G",
    win: "ctrl + G",
    keywords: ["go to line", "라인 이동"]
  },
  {
    category: "vscode",
    action: "에디터 그룹 분할 (좌우)",
    mac: "⌘ + \\",
    win: "ctrl + \\",
    keywords: ["split editor", "에디터 분할", "command"]
  },
  {
    category: "vscode",
    action: "에디터 그룹 간 포커스 이동",
    mac: "⌘ + 1 / 2 / 3",
    win: "ctrl + 1 / 2 / 3",
    keywords: ["focus editor group", "switch editor", "command"]
  },
  {
    category: "vscode",
    action: "탭 닫기",
    mac: "⌘ + W",
    win: "ctrl + W",
    keywords: ["close tab", "close editor", "command"]
  },
  {
    category: "vscode",
    action: "닫은 탭 다시 열기",
    mac: "⌘ + ⇧ + T",
    win: "ctrl + ⇧ + T",
    keywords: ["reopen tab", "restore tab", "command", "shift"]
  },
  {
    category: "vscode",
    action: "최근 열었던 파일 목록",
    mac: "ctrl + tab",
    win: "ctrl + tab",
    keywords: ["recent files", "switch tab", "최근 파일"]
  },
  {
    category: "vscode",
    action: "Breadcrumbs 포커스",
    mac: "⌘ + ⇧ + .",
    win: "ctrl + ⇧ + .",
    keywords: ["breadcrumbs", "navigation", "command", "shift"]
  },
  {
    category: "vscode",
    action: "에러/경고 간 이동",
    mac: "F8 / ⇧ + F8",
    win: "F8 / ⇧ + F8",
    keywords: ["next error", "next warning", "navigate problems", "shift"]
  },
  {
    category: "vscode",
    action: "문제(Problems) 패널 열기",
    mac: "⌘ + ⇧ + M",
    win: "ctrl + ⇧ + M",
    keywords: ["problems panel", "errors", "warnings", "command", "shift"]
  },
  {
    category: "vscode",
    action: "출력(Output) 패널 열기",
    mac: "⌘ + ⇧ + U",
    win: "ctrl + ⇧ + U",
    keywords: ["output panel", "command", "shift"]
  },
  // --- Git ---
  {
    category: "vscode",
    action: "소스 제어 패널 열기",
    mac: "ctrl + ⇧ + G",
    win: "ctrl + ⇧ + G",
    keywords: ["source control", "git", "shift"]
  },
  {
    category: "vscode",
    action: "인라인 변경 사항 이동 (다음/이전)",
    mac: "option + F5 / option + ⇧ + F5",
    win: "alt + F5 / alt + ⇧ + F5",
    keywords: ["inline diff", "next change", "git", "shift"]
  },
  // --- 기타 ---
  {
    category: "vscode",
    action: "환경 설정 열기",
    mac: "⌘ + ,",
    win: "ctrl + ,",
    keywords: ["settings", "preferences", "설정", "command"]
  },
  {
    category: "vscode",
    action: "키보드 단축키 설정",
    mac: "⌘ + K → ⌘ + S",
    win: "ctrl + K → ctrl + S",
    keywords: ["keyboard shortcuts", "키 바인딩", "command"]
  },
  {
    category: "vscode",
    action: "확장 기능 열기",
    mac: "⌘ + ⇧ + X",
    win: "ctrl + ⇧ + X",
    keywords: ["extensions", "marketplace", "플러그인", "command", "shift"]
  },
  {
    category: "vscode",
    action: "Zen Mode (집중 모드)",
    mac: "⌘ + K → Z",
    win: "ctrl + K → Z",
    keywords: ["zen mode", "distraction free", "집중 모드", "command"]
  },
  {
    category: "vscode",
    action: "전체 화면 전환",
    mac: "ctrl + ⌘ + F",
    win: "F11",
    keywords: ["full screen", "전체 화면"]
  },
  {
    category: "vscode",
    action: "마크다운 미리보기 열기",
    mac: "⌘ + ⇧ + V",
    win: "ctrl + ⇧ + V",
    keywords: ["markdown preview", "미리보기", "command", "shift"]
  },
  {
    category: "vscode",
    action: "사이드바 포커스 이동 (탐색기/검색/Git/디버그/확장)",
    mac: "⌘ + ⇧ + E / ⌘ + ⇧ + F / ctrl + ⇧ + G / ⌘ + ⇧ + D / ⌘ + ⇧ + X",
    win: "ctrl + ⇧ + E / ctrl + ⇧ + F / ctrl + ⇧ + G / ctrl + ⇧ + D / ctrl + ⇧ + X",
    keywords: ["sidebar", "explorer", "search", "git", "debug", "extensions", "command", "shift"]
  },
  {
    category: "vscode",
    action: "패널 표시/숨기기",
    mac: "⌘ + J",
    win: "ctrl + J",
    keywords: ["toggle panel", "panel", "terminal", "command"]
  },
  {
    category: "vscode",
    action: "단어 줄바꿈 토글 (Word Wrap)",
    mac: "option + Z",
    win: "alt + Z",
    keywords: ["word wrap", "줄바꿈", "toggle wrap"]
  }
];

export const excelShortcuts: Shortcut[] = [
  {
    category: "excel",
    action: "현재 셀 편집",
    mac: "ctrl + U",
    win: "F2",
    keywords: ["edit cell", "cell input"]
  },
  {
    category: "excel",
    action: "자동 채우기 (선택 영역 아래로 복사)",
    mac: "⌘ + D",
    win: "ctrl + D",
    keywords: ["fill down", "copy down", "command"]
  },
  {
    category: "excel",
    action: "오른쪽으로 복사",
    mac: "⌘ + R",
    win: "ctrl + R",
    keywords: ["fill right", "copy right", "command"]
  },
  {
    category: "excel",
    action: "전체 선택",
    mac: "⌘ + A",
    win: "ctrl + A",
    keywords: ["select all", "highlight all", "command"]
  },
  {
    category: "excel",
    action: "새 줄 삽입",
    mac: "⌘ + ⇧ + K",
    win: "ctrl + ⇧ + +",
    keywords: ["insert row", "add row", "command", "shift"]
  },
  {
    category: "excel",
    action: "열/행 삭제",
    mac: "⌘ + -",
    win: "ctrl + -",
    keywords: [
      "delete row",
      "delete column",
      "remove row",
      "remove column",
      "command"
    ]
  },
  {
    category: "excel",
    action: "현재 날짜 입력",
    mac: "ctrl + ;",
    win: "ctrl + ;",
    keywords: ["insert date", "today", "current date"]
  },
  {
    category: "excel",
    action: "현재 시간 입력",
    mac: "ctrl + ⇧ + ;",
    win: "ctrl + ⇧ + ;",
    keywords: ["insert time", "now", "current time", "shift"]
  },
  {
    category: "excel",
    action: "저장",
    mac: "⌘ + S",
    win: "ctrl + S",
    keywords: ["save", "save file", "save as", "command"]
  },
  {
    category: "excel",
    action: "실행 취소",
    mac: "⌘ + Z",
    win: "ctrl + Z",
    keywords: ["undo", "cancel", "command"]
  },
  {
    category: "excel",
    action: "다시 실행",
    mac: "⌘ + Y",
    win: "ctrl + Y",
    keywords: ["redo", "repeat", "redo", "command"]
  },
  {
    category: "excel",
    action: "찾기",
    mac: "⌘ + F",
    win: "ctrl + F",
    keywords: ["find", "search", "command"]
  },
  {
    category: "excel",
    action: "바꾸기",
    mac: "⌘ + H",
    win: "ctrl + H",
    keywords: ["replace", "find and replace", "command"]
  },
  {
    category: "excel",
    action: "새 시트 삽입",
    mac: "⇧ + F11",
    win: "⇧ + F11",
    keywords: ["new sheet", "insert sheet", "shift"]
  },
  {
    category: "excel",
    action: "시트 사이 이동 (다음)",
    mac: "fn + ctrl + ↓",
    win: "ctrl + PageDown",
    keywords: ["next sheet", "move sheet"]
  },
  {
    category: "excel",
    action: "시트 사이 이동 (이전)",
    mac: "fn + ctrl + ↑",
    win: "ctrl + PageUp",
    keywords: ["previous sheet", "move sheet"]
  },
  {
    category: "excel",
    action: "선택 영역 테두리 설정",
    mac: "⌘ + option + 0",
    win: "ctrl + ⇧ + &",
    keywords: ["border", "set border", "command", "shift"]
  },
  {
    category: "excel",
    action: "서식 복사",
    mac: "⌘ + ⇧ + C, ⌘ + ⇧ + V",
    win: "ctrl + ⇧ + C, ctrl + ⇧ + V",
    keywords: [
      "copy format",
      "paste format",
      "format painter",
      "copy style",
      "paste style",
      "command",
      "shift"
    ]
  },
  {
    category: "excel",
    action: "셀 병합",
    mac: "⌘ + option + M",
    win: "alt + H + M + M",
    keywords: ["merge cells", "command"]
  },
  {
    category: "excel",
    action: "오름차순 정렬",
    mac: "ctrl + option + R",
    win: "alt + A + S + A",
    keywords: ["sort ascending", "sort A to Z", "오름차순"]
  },
  {
    category: "excel",
    action: "내림차순 정렬",
    mac: "ctrl + option + R",
    win: "alt + A + S + D",
    keywords: ["sort descending", "sort Z to A", "내림차순"]
  },
  {
    category: "excel",
    action: "정렬 대화상자 열기",
    mac: "fn + ctrl + option + R",
    win: "alt + D + S",
    keywords: ["custom sort", "sort dialog", "정렬 설정", "sort settings"]
  },
  {
    category: "excel",
    action: "함수 마법사 열기",
    mac: "⇧ + F3",
    win: "⇧ + F3",
    keywords: ["insert function", "함수 삽입", "shift"]
  },
  {
    category: "excel",
    action: "합계 함수 자동 입력",
    mac: "⌘ + ⇧ + T",
    win: "alt + =",
    keywords: ["autosum", "sum", "자동 합계", "command", "shift"]
  },
  {
    category: "excel",
    action: "수식 계산",
    mac: "fn + return",
    win: "F9",
    keywords: ["calculate formula", "evaluate formula", "계산"]
  },
  {
    category: "excel",
    action: "다음 인수로 이동 (함수 작성 중)",
    mac: "ctrl + ,",
    win: "ctrl + ,",
    keywords: ["function argument", "다음 인수", "next argument"]
  },
  {
    category: "excel",
    action: "셀 수식 표시/숨기기 토글",
    mac: "ctrl + `",
    win: "ctrl + `",
    keywords: ["toggle formula", "수식 보기", "show formula"]
  }
];

export const powerpointShortcuts: Shortcut[] = [
  {
    category: "powerpoint",
    action: "슬라이드 쇼 시작 (처음부터)",
    mac: "⌘ + ⇧ + return",
    win: "F5",
    keywords: [
      "start slideshow",
      "presentation",
      "슬라이드 쇼",
      "start slide show",
      "command",
      "shift"
    ]
  },
  {
    category: "powerpoint",
    action: "슬라이드 쇼 시작 (현재 슬라이드부터)",
    mac: "fn + return",
    win: "⇧ + F5",
    keywords: [
      "slideshow current",
      "현재 슬라이드 쇼",
      "current slide",
      "shift"
    ]
  },
  {
    category: "powerpoint",
    action: "새 슬라이드 삽입",
    mac: "⌘ + ⇧ + N",
    win: "ctrl + M",
    keywords: [
      "new slide",
      "insert slide",
      "슬라이드 추가",
      "add slide",
      "command",
      "shift"
    ]
  },
  {
    category: "powerpoint",
    action: "복사",
    mac: "⌘ + C",
    win: "ctrl + C",
    keywords: ["copy", "복사", "duplicate", "command"]
  },
  {
    category: "powerpoint",
    action: "붙여넣기",
    mac: "⌘ + V",
    win: "ctrl + V",
    keywords: ["paste", "붙여넣기", "insert", "command"]
  },
  {
    category: "powerpoint",
    action: "잘라내기",
    mac: "⌘ + X",
    win: "ctrl + X",
    keywords: ["cut", "잘라내기", "remove", "command"]
  },
  {
    category: "powerpoint",
    action: "실행 취소",
    mac: "⌘ + Z",
    win: "ctrl + Z",
    keywords: ["undo", "되돌리기", "cancel", "command"]
  },
  {
    category: "powerpoint",
    action: "다시 실행",
    mac: "⌘ + Y",
    win: "ctrl + Y",
    keywords: ["redo", "다시 실행", "command"]
  },
  {
    category: "powerpoint",
    action: "슬라이드 복제",
    mac: "⌘ + D",
    win: "ctrl + D",
    keywords: ["duplicate slide", "슬라이드 복제", "copy slide", "command"]
  },
  {
    category: "powerpoint",
    action: "슬라이드 삭제",
    mac: "fn + delete",
    win: "delete",
    keywords: ["delete slide", "슬라이드 삭제", "remove slide"]
  },
  {
    category: "powerpoint",
    action: "개체 정렬 - 가운데 정렬",
    mac: "option + ⌘ + E",
    win: "alt + H + G + A + C",
    keywords: ["align center", "가운데 정렬", "center", "command"]
  },
  {
    category: "powerpoint",
    action: "개체 정렬 - 중간 정렬",
    mac: "option + ⌘ + M",
    win: "alt + H + G + A + M",
    keywords: ["align middle", "중간 정렬", "center", "command"]
  },
  {
    category: "powerpoint",
    action: "텍스트 상자 삽입",
    mac: "⌘ + ⇧ + X",
    win: "alt + N + X",
    keywords: ["insert text box", "텍스트 상자", "command", "shift"]
  },
  {
    category: "powerpoint",
    action: "도형 삽입",
    mac: "⌘ + ⇧ + H",
    win: "alt + N + S + H",
    keywords: ["insert shape", "도형 삽입", "command", "shift"]
  },
  {
    category: "powerpoint",
    action: "슬라이드 간 이동 (이전/다음)",
    mac: "fn + ↑ / fn + ↓",
    win: "page up / page down",
    keywords: [
      "slide navigation",
      "다음 슬라이드",
      "이전 슬라이드",
      "next slide",
      "previous slide"
    ]
  },
  {
    category: "powerpoint",
    action: "전체 선택",
    mac: "⌘ + A",
    win: "ctrl + A",
    keywords: ["select all", "전체 선택", "command"]
  },
  {
    category: "powerpoint",
    action: "슬라이드 숨기기",
    mac: "⌘ + ⇧ + H",
    win: "ctrl + ⇧ + H",
    keywords: ["hide slide", "숨기기", "command", "shift"]
  },
  {
    category: "powerpoint",
    action: "서식 복사",
    mac: "⌘ + ⇧ + C / ⌘ + ⇧ + V",
    win: "ctrl + ⇧ + C / ctrl + ⇧ + V",
    keywords: [
      "copy format",
      "paste format",
      "서식 복사",
      "서식 붙여넣기",
      "command",
      "shift"
    ]
  },
  {
    category: "powerpoint",
    action: "도형 복제",
    mac: "⌘ + D",
    win: "ctrl + D",
    keywords: ["duplicate shape", "도형 복제", "copy shape", "command"]
  },
  {
    category: "powerpoint",
    action: "간격 유지 복사",
    mac: "⌘ + D 후 ⌘ + Y",
    win: "ctrl + D 후 ctrl + Y",
    keywords: ["duplicate spacing", "간격 유지", "반복 복사", "command"]
  },
  {
    category: "powerpoint",
    action: "동작 반복",
    mac: "⌘ + Y",
    win: "F4",
    keywords: ["repeat last action", "반복", "이전 작업 반복", "command"]
  },
  {
    category: "powerpoint",
    action: "빠른 복사 1 (일반)",
    mac: "⌘ + 드래그",
    win: "ctrl + 드래그",
    keywords: ["quick copy", "빠른 복사", "drag copy", "command"]
  },
  {
    category: "powerpoint",
    action: "빠른 복사 2 (수평/수직)",
    mac: "⌘ + ⇧ + 드래그",
    win: "ctrl + ⇧ + 드래그",
    keywords: [
      "quick copy aligned",
      "빠른 복사 수직 수평",
      "정렬 복사",
      "command",
      "shift"
    ]
  },
  {
    category: "powerpoint",
    action: "수평/수직 이동",
    mac: "⇧ + 드래그",
    win: "⇧ + 드래그",
    keywords: [
      "move horizontal",
      "move vertical",
      "수평 이동",
      "수직 이동",
      "shift"
    ]
  },
  {
    category: "powerpoint",
    action: "그룹화",
    mac: "⌘ + G",
    win: "ctrl + G",
    keywords: ["group", "그룹", "group objects", "command"]
  },
  {
    category: "powerpoint",
    action: "그룹 해제",
    mac: "⌘ + ⇧ + G",
    win: "ctrl + ⇧ + G",
    keywords: ["ungroup", "그룹 해제", "ungroup objects", "command", "shift"]
  },
  {
    category: "powerpoint",
    action: "도형 비율 유지 드래그",
    mac: "⇧ + 드래그",
    win: "⇧ + 드래그",
    keywords: ["keep shape ratio", "도형 비율 유지", "비율 축소 확대", "shift"]
  },
  {
    category: "powerpoint",
    action: "폰트 크기 조절",
    mac: "⌘ + [ / ⌘ + ]",
    win: "ctrl + [ / ctrl + ]",
    keywords: ["font size adjust", "폰트 크기", "글자 크기", "command"]
  },
  {
    category: "powerpoint",
    action: "글자 굵게",
    mac: "⌘ + B",
    win: "ctrl + B",
    keywords: ["bold text", "굵게", "볼드", "command"]
  },
  {
    category: "powerpoint",
    action: "기울기 효과",
    mac: "⌘ + I",
    win: "ctrl + I",
    keywords: ["italic text", "기울임", "이탤릭", "command"]
  },
  {
    category: "powerpoint",
    action: "밑줄 효과",
    mac: "⌘ + U",
    win: "ctrl + U",
    keywords: ["underline text", "밑줄", "강조선", "command"]
  },
  {
    category: "powerpoint",
    action: "텍스트 정렬",
    mac: "⌘ + L / E / R",
    win: "ctrl + L / E / R",
    keywords: ["text align", "좌측 정렬", "가운데 정렬", "우측 정렬", "command"]
  }
];

const hangulShortcuts: Shortcut[] = [
  {
    category: "한글",
    action: "글자 및 문단 모양 복사 및 붙여넣기",
    mac: "-",
    win: "alt + C (복사) → alt + C (붙여넣기)",
    keywords: ["서식 복사", "문단 복사", "글자 복사"]
  },
  {
    category: "한글",
    action: "문서 첫 페이지로 이동",
    mac: "-",
    win: "ctrl + page up",
    keywords: ["첫 페이지", "맨 위로", "문서 이동"]
  },
  {
    category: "한글",
    action: "글머리표 삽입",
    mac: "-",
    win: "ctrl + ⇧ + delete",
    keywords: ["글머리표", "bullets", "리스트", "shift"]
  },
  {
    category: "한글",
    action: "텍스트 정렬 (좌/중앙/우)",
    mac: "-",
    win: "ctrl + ⇧ + L / C / R",
    keywords: ["정렬", "좌측 정렬", "가운데 정렬", "우측 정렬", "shift"]
  },
  {
    category: "한글",
    action: "문단 모양 열기",
    mac: "-",
    win: "alt + T",
    keywords: ["문단 설정", "문단 모양"]
  },
  {
    category: "한글",
    action: "글자 모양 열기",
    mac: "-",
    win: "alt + L",
    keywords: ["글꼴 설정", "글자 모양"]
  },
  {
    category: "한글",
    action: "자간 증/감",
    mac: "-",
    win: "alt + ⇧ + W / N",
    keywords: ["자간", "글자 간격", "간격 조절", "shift"]
  },
  {
    category: "한글",
    action: "장평 증/감",
    mac: "-",
    win: "alt + ⇧ + K / J",
    keywords: ["장평", "자폭", "글자 너비", "shift"]
  },
  {
    category: "한글",
    action: "폰트 크기 증/감",
    mac: "-",
    win: "alt + ⇧ + E / R",
    keywords: ["폰트 크기", "글자 크기", "폰트 사이즈", "shift"]
  },
  {
    category: "한글",
    action: "들여쓰기 설정",
    mac: "-",
    win: "ctrl + ⇧ + F6",
    keywords: ["들여쓰기", "탭", "문단 들여쓰기", "shift"]
  },
  {
    category: "한글",
    action: "표/그림 캡션 달기",
    mac: "-",
    win: "ctrl + N + C",
    keywords: ["캡션", "설명 삽입", "표 설명"]
  },
  {
    category: "한글",
    action: "표 열/행 추가",
    mac: "-",
    win: "alt + insert",
    keywords: ["표 행 추가", "표 열 추가", "테이블 추가"]
  },
  {
    category: "한글",
    action: "표 열/행 삭제",
    mac: "-",
    win: "alt + delete",
    keywords: ["표 삭제", "행 삭제", "열 삭제"]
  },
  {
    category: "한글",
    action: "표 셀 병합",
    mac: "-",
    win: "M",
    keywords: ["셀 병합", "테이블 병합"]
  },
  {
    category: "한글",
    action: "표 셀 높이 동일하게",
    mac: "-",
    win: "H",
    keywords: ["셀 높이", "표 높이", "높이 정렬"]
  },
  {
    category: "한글",
    action: "표 셀 넓이 동일하게",
    mac: "-",
    win: "W",
    keywords: ["셀 넓이", "표 넓이", "너비 정렬"]
  },
  {
    category: "한글",
    action: "표에서 빠져나오기",
    mac: "-",
    win: "⇧ + esc",
    keywords: ["표 나가기", "테이블 종료", "셀 밖으로", "shift"]
  }
];

const wordShortcuts: Shortcut[] = [
  {
    category: "word",
    action: "굵게(Bold)",
    mac: "⌘ + B",
    win: "Ctrl + B",
    keywords: ["굵게", "볼드", "강조", "bold text", "command"]
  },
  {
    category: "word",
    action: "기울임(Italic)",
    mac: "⌘ + I",
    win: "Ctrl + I",
    keywords: ["기울임", "이탤릭", "italic", "italic text", "command"]
  },
  {
    category: "word",
    action: "밑줄(Underline)",
    mac: "⌘ + U",
    win: "Ctrl + U",
    keywords: ["밑줄", "언더라인", "underline", "underline text", "command"]
  },
  {
    category: "word",
    action: "폰트 크기 키우기/줄이기",
    mac: "⌘ + ] / ⌘ + [",
    win: "Ctrl + ] / Ctrl + [",
    keywords: [
      "폰트 크기",
      "텍스트 크기",
      "increase font",
      "decrease font",
      "font size",
      "command"
    ]
  },
  {
    category: "word",
    action: "가운데 / 좌측 / 우측 정렬",
    mac: "⌘ + E / ⌘ + L / ⌘ + R",
    win: "Ctrl + E / Ctrl + L / Ctrl + R",
    keywords: ["정렬", "align", "center", "left", "right", "justify", "command"]
  },
  {
    category: "word",
    action: "양쪽 정렬(Justify)",
    mac: "-",
    win: "Ctrl + J",
    keywords: ["양쪽 정렬", "justify", "align"]
  },
  {
    category: "word",
    action: "전체 선택(Select All)",
    mac: "⌘ + A",
    win: "Ctrl + A",
    keywords: ["전체 선택", "select all", "find", "command"]
  },
  {
    category: "word",
    action: "찾기 / 바꾸기",
    mac: "⌘ + F / ⌘ + H",
    win: "Ctrl + F / Ctrl + H",
    keywords: ["찾기", "바꾸기", "search", "replace", "command"]
  },
  {
    category: "word",
    action: "페이지 나누기(Page Break)",
    mac: "⌘ + Enter",
    win: "Ctrl + Enter",
    keywords: ["페이지 나누기", "page break", "command"]
  },
  {
    category: "word",
    action: "저장 / 인쇄",
    mac: "⌘ + S / ⌘ + P",
    win: "Ctrl + S / Ctrl + P",
    keywords: ["저장", "인쇄", "save", "print", "command"]
  },
  {
    category: "word",
    action: "실행 취소 / 다시 실행",
    mac: "⌘ + Z / ⌘ + Y",
    win: "Ctrl + Z / Ctrl + Y",
    keywords: ["undo", "redo", "실행 취소", "다시 실행", "command"]
  },
  {
    category: "word",
    action: "하이퍼링크 삽입",
    mac: "⌘ + K",
    win: "Ctrl + K",
    keywords: ["하이퍼링크", "링크 삽입", "link", "insert", "add", "command"]
  },
  {
    category: "word",
    action: "단어 단위 이동 & 선택",
    mac: "option + ←/→ / shift + option + ←/→",
    win: "Ctrl + ←/→ / Ctrl + Shift + ←/→",
    keywords: ["단어 이동", "단어 선택", "word navigation", "shift"]
  },
  {
    category: "word",
    action: "문단 단위 이동 & 선택",
    mac: "option + ↑/↓ / shift + option + ↑/↓",
    win: "Ctrl + ↑/↓ / Ctrl + Shift + ↑/↓",
    keywords: ["문단 이동", "문단 선택", "paragraph navigation", "shift"]
  },
  {
    category: "word",
    action: "문서 맨 앞으로 / 뒤로 이동",
    mac: "⌘ + ↑ / ⌘ + ↓",
    win: "Ctrl + Home / Ctrl + End",
    keywords: ["문서 시작", "문서 끝", "go to start", "go to end", "command"]
  },
  {
    category: "word",
    action: "페이지 위/아래로 스크롤",
    mac: "fn + ↑/↓",
    win: "Page Up / Page Down",
    keywords: ["페이지 이동", "스크롤"]
  },
  {
    category: "word",
    action: "KeyTips (리본탭 접근)",
    mac: "Control + Period",
    win: "Alt",
    keywords: ["KeyTips", "리본탭", "리본 접근"]
  },
  {
    category: "word",
    action: "리본 최소화/복원",
    mac: "-",
    win: "Ctrl + F1",
    keywords: ["리본", "ribbon", "토글"]
  }
];

export const allShortcuts: Shortcut[] = [
  ...intellijShortcuts,
  ...vscodeShortcuts,
  ...figmaShortcuts,
  ...excelShortcuts,
  ...powerpointShortcuts,
  ...hangulShortcuts,
  ...wordShortcuts
];

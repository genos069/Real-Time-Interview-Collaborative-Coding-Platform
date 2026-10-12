import React, { useRef, useEffect } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import nightOwlTheme from "../../themes/NightOwl.json";

export interface InterviewCodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  minimap?: boolean;
  wordWrap?: boolean;
  fontSize?: number;
  readOnly?: boolean;
  height?: string | number;
  onRunCode?: () => void;
  onToggleFullscreen?: () => void;
  onToggleCodeChat?: () => void;
  onToggleConsole?: () => void;
}

const MONACO_LANG_MAP: Record<string, string> = {
  Java: "java",
  java: "java",
  Python: "python",
  python: "python",
  Python3: "python",
  python3: "python",
  "C++": "cpp",
  "c++": "cpp",
  cpp: "cpp",
};

export const InterviewCodeEditor: React.FC<InterviewCodeEditorProps> = ({
  value,
  language,
  onChange,
  minimap = true,
  wordWrap = false,
  fontSize = 13.5,
  readOnly = false,
  height = "100%",
  onRunCode,
  onToggleFullscreen,
  onToggleCodeChat,
  onToggleConsole,
}) => {
  const editorRef = useRef<any>(null);
  const callbacksRef = useRef({
    onRunCode,
    onToggleFullscreen,
    onToggleCodeChat,
    onToggleConsole,
  });

  useEffect(() => {
    callbacksRef.current = {
      onRunCode,
      onToggleFullscreen,
      onToggleCodeChat,
      onToggleConsole,
    };
  }, [onRunCode, onToggleFullscreen, onToggleCodeChat, onToggleConsole]);

  const monacoLanguage = MONACO_LANG_MAP[language] || "plaintext";

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("night-owl", nightOwlTheme as any);
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme("night-owl", nightOwlTheme as any);
    monaco.editor.setTheme("night-owl");

    // 1. Run Code: Ctrl + Enter
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      callbacksRef.current.onRunCode?.();
    });

    // 2. Redo: Ctrl + Y and Ctrl + Shift + Z
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => {
      const redoAction = editor.getAction("redo");
      if (redoAction) {
        redoAction.run();
      } else {
        editor.trigger("keyboard", "redo", null);
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
      const redoAction = editor.getAction("redo");
      if (redoAction) {
        redoAction.run();
      } else {
        editor.trigger("keyboard", "redo", null);
      }
    });

    // 3. Duplicate Line: Ctrl + D
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      const copyLinesDown = editor.getAction("editor.action.copyLinesDownAction");
      if (copyLinesDown) {
        copyLinesDown.run();
      } else {
        editor.trigger("keyboard", "editor.action.copyLinesDownAction", null);
      }
    });

    // 4. Toggle Comment: Ctrl + /
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      const toggleComment = editor.getAction("editor.action.commentLine");
      if (toggleComment) {
        toggleComment.run();
      } else {
        editor.trigger("keyboard", "editor.action.commentLine", null);
      }
    });

    // 5. Editor Fullscreen: F10 & Alt + F11
    editor.addCommand(monaco.KeyCode.F10, () => {
      callbacksRef.current.onToggleFullscreen?.();
    });
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.F11, () => {
      callbacksRef.current.onToggleFullscreen?.();
    });

    // 6. Toggle Code / Chat: Ctrl + B
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      callbacksRef.current.onToggleCodeChat?.();
    });

    // 7. Toggle Console: Ctrl + J
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
      callbacksRef.current.onToggleConsole?.();
    });
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#011627",
      }}
    >
      <Editor
        height={height}
        language={monacoLanguage}
        value={value}
        theme="night-owl"
        beforeMount={handleBeforeMount}
        onMount={handleEditorMount}
        onChange={(val) => {
          if (onChange) {
            onChange(val ?? "");
          }
        }}
        options={{
          automaticLayout: true,
          fontSize,
          fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
          fontLigatures: true,
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          minimap: {
            enabled: minimap,
          },
          wordWrap: wordWrap ? "on" : "off",
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          renderLineHighlight: "all",
          tabSize: 4,
          insertSpaces: true,
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
          },
          padding: {
            top: 12,
            bottom: 12,
          },
          readOnly,
          folding: true,
          quickSuggestions: true,
          contextmenu: true,
        }}
        loading={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#94A3B8",
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
            }}
          >
            Loading Monaco Editor...
          </div>
        }
      />
    </div>
  );
};

export default InterviewCodeEditor;

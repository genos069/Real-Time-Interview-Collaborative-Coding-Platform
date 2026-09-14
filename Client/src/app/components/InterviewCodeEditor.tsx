import React, { useRef } from "react";
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
}) => {
  const editorRef = useRef<any>(null);

  const monacoLanguage = MONACO_LANG_MAP[language] || "plaintext";

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("night-owl", nightOwlTheme as any);
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme("night-owl", nightOwlTheme as any);
    monaco.editor.setTheme("night-owl");
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

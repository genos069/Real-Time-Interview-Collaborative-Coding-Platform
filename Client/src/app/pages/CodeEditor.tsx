import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import nightOwlTheme from "./../../themes/NightOwl.json";
import type { ReactNode } from "react";
import {
    Play, Send, ChevronDown, CheckCircle, XCircle,
    Clock, Cpu, RotateCcw, Bookmark, Plus,
    Code2, FlaskConical, Terminal, Loader2, Tag,
    FileText,
} from "lucide-react";
import {
    getQuestion,
    getStarterCode,
    getTestCases,
    runCode,
    submitCode,
} from "../../services/questionService";
import { useParams } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────────────────────

type Difficulty = "Easy" | "Medium" | "Hard";
interface Problem {
    id: string;
    title: string;
    category: string;
    difficulty: Difficulty;
    description: string;
    examples: string[];
    constraints: string[];
    tags: string[];
    starterCode: string;
}

interface ProblemDescriptionProps {
    questionId: string;
}

interface TestCase {
    id: number;
    input: string;
    expected: string;
}

interface RunOutput {
    input: string;
    expected: string;
    got: string;
    passed: boolean;
}

interface RunResult {
    status: string;
    output: string;
    error: string;
    runtime: string;
    memory: string;
    passedTestCases: number;
    totalTestCases: number;
}

// ── Static Data ────────────────────────────────────────────────────────────────



const LANGUAGES = ["Python3", "C++", "Java"];
const MONACO_LANGUAGES: Record<string, string> = {
    Python3: "python",
    JavaScript: "javascript",
    "C++": "cpp",
    Java: "java",
    Go: "go",
    Rust: "rust",
};





// ── Sub-components ─────────────────────────────────────────────────────────────

const DIFF_COLORS = { Easy: "#3fb950", Medium: "#d29922", Hard: "#f85149" };

function DiffBadge({ level }: { level: "Easy" | "Medium" | "Hard" }) {
    const color = DIFF_COLORS[level];
    return (
        <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color, backgroundColor: `${color}1a` }}
        >
      {level}
    </span>
    );
}

function TabBar({
                    tabs,
                    active,
                    onChange,
                    icons,
                }: {
    tabs: string[];
    active: string;
    onChange: (t: string) => void;
    icons?: Record<string, ReactNode>;
}) {
    return (
        <div className="flex items-center px-2 border-b border-border bg-card shrink-0">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => onChange(tab)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${active === tab
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {icons?.[tab]}
                    {tab}
                </button>
            ))}
        </div>
    );
}

function ProblemDescription({ questionId }: ProblemDescriptionProps) {
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                setLoading(true);
                const data = await getQuestion(questionId);
                console.log("Fetched Question Data:", data); // Log the fetched data for debugging
                setProblem(data);
            } catch (error) {
                console.error("Failed to load question:", error);
            } finally {
                setLoading(false);
            }
        };

        if (questionId) {
            fetchQuestion();
        }
    }, [questionId]);


    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                Loading question...
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="flex-1 flex items-center justify-center">
                Failed to load question.
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2.5">
          <span className="text-muted-foreground text-sm font-mono">
            {problem.id}.
          </span>
                    <h1 className="text-base font-semibold tracking-tight">
                        {problem.title}
                    </h1>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <DiffBadge level={problem.difficulty} />


                    <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                        <Bookmark size={14} />
                    </button>
                </div>
            </div>

            {/* Description */}
            <div className="text-sm leading-relaxed text-foreground/85 space-y-3">
                {problem.description.split("\n\n").map((para, i) => (
                    <p
                        key={i}
                        dangerouslySetInnerHTML={{
                            __html: para
                                .replace(
                                    /`([^`]+)`/g,
                                    '<code class="px-1.5 py-0.5 rounded bg-secondary font-mono text-[11px] text-foreground/90">$1</code>'
                                )
                                .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                                .replace(/_([^_]+)_/g, "<em>$1</em>"),
                        }}
                    />
                ))}
            </div>

            {/* Examples */}
            <div className="space-y-4">
                {problem.examples.map((example, index) => (
                    <div key={index}>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                            Example {index + 1}
                        </p>

                        <div className="rounded-md border border-border bg-secondary/30 p-3">
        <pre className="whitespace-pre-wrap text-xs font-mono">
          {example}
        </pre>
                        </div>
                    </div>
                ))}
            </div>

            {/* Constraints */}
            <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Constraints
                </p>

                <ul className="space-y-1.5">
                    {problem.constraints.map((constraint, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground mt-0.5 shrink-0">
                •
              </span>

                            <code className="font-mono text-foreground/85">
                                {constraint}
                            </code>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Topics */}
            <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Topics
                </p>

                <div className="flex flex-wrap gap-1.5">
                    {problem.tags.map((tag) => (
                        <span
                            key={tag}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        >
              <Tag size={10} />
                            {tag}
            </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Main App ───────────────────────────────────────────────────────────────────

export default function CodeEditor() {
    // Layout state
    const [leftPct, setLeftPct] = useState(42);
    const [bottomPx, setBottomPx] = useState(230);

    // Left panel
    const [leftTab, setLeftTab] = useState("description");

    // Right panel
    const [bottomTab, setBottomTab] = useState("testcases");
    const [lang, setLang] = useState("Python3");
    const [langOpen, setLangOpen] = useState(false);
    const [codes, setCodes] = useState<Record<string, string>>({});
    const [activeCase, setActiveCase] = useState(0);

    // Execution
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<RunResult | null>(null);
    const [resultType, setResultType] = useState<"run" | "submit">("run");

    const { id: questionId } = useParams<{ id: string }>();
    //temp
    console.log("Question ID:", questionId);
    const [testCases, setTestCases] = useState<any[]>([]);
    const currentTestCase = testCases[activeCase];

    // Drag refs
    const containerRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);
    const horizDragging = useRef(false);
    const vertDragging = useRef(false);
    // Coding Timer
    const sessionStart = useRef<number>(Date.now());

    const handleEditorMount = (_editor: any, monaco: any) => {
        monaco.editor.defineTheme(
            "night-owl",
            nightOwlTheme as any
        );

        monaco.editor.setTheme("night-owl");
    };

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (horizDragging.current && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const pct = ((e.clientX - rect.left) / rect.width) * 100;
                setLeftPct(Math.min(68, Math.max(22, pct)));
            }
            if (vertDragging.current && rightRef.current) {
                const rect = rightRef.current.getBoundingClientRect();
                const px = rect.bottom - e.clientY;
                setBottomPx(Math.min(480, Math.max(80, px)));
            }
        };
        const onUp = () => {
            horizDragging.current = false;
            vertDragging.current = false;
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, []);
    useEffect(() => {
        if (!questionId) return;

        const loadEditor = async () => {
            try {
                const starter = await getStarterCode(questionId, lang);
                const cases = await getTestCases(questionId);

                setCodes({
                    [lang]: starter.code,
                });

                setTestCases(cases);
                // Start Coding Timer
                sessionStart.current = Date.now();
            } catch (err) {
                console.error(err);
            }
        };

        loadEditor();
    }, [questionId]);

    const handleLangChange = async (l: string) => {
        setLang(l);
        setLangOpen(false);

        if (!questionId) return;

        try {
            const starter = await getStarterCode(questionId, l);

            setCodes((prev) => ({
                ...prev,
                [l]: starter.code,
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleRun = async () => {
        if (!questionId) return;

        try {
            setRunning(true);
            setBottomTab("output");
            setResult(null);

            const response = await runCode({
                questionId,
                language: lang,
                code: codes[lang],
            });

            setResultType("run");
            setResult(response);
        } catch (err) {
            console.error(err);
        } finally {
            setRunning(false);
        }
    };

    const handleSubmit = async () => {
        if (!questionId) return;

        try {
            setSubmitting(true);
            setBottomTab("output");
            setResult(null);

            const codingTimeSeconds = Math.floor(
                (Date.now() - sessionStart.current) / 1000
            );

            const response = await submitCode(questionId, {
                language: lang,
                code: codes[lang],
                codingTimeSeconds,
            });

// Reset timer after a successful submission
            sessionStart.current = Date.now();

            setResultType("submit");
            setResult(response);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
            {/* ── Navbar ── */}
            <nav
                className="flex items-center justify-between px-4 shrink-0 border-b border-border"
                style={{ height: 48 }}
            >
                {/* Left: brand + nav */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #00d4b8 0%, #3fb950 100%)" }}
                        >
                            <Code2 size={13} className="text-white" />
                        </div>
                        <span className="font-semibold text-sm tracking-tight">CodeGear</span>
                    </div>
                    <div className="w-px h-4 bg-border" />
                    {/* <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-secondary">
                        <ChevronLeft size={13} />
                        Prev
                    </button>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-secondary">
                        Next
                        <ChevronRight size={13} />
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-secondary">
                        <FileText size={13} />
                        Problem List
                    </button> */}
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2">
                    {/* <div className="text-xs text-muted-foreground hidden md:block">
                        <span className="text-foreground font-medium">1</span> / 3506
                    </div> */}
                    <div className="w-px h-4 bg-border hidden md:block" />
                    <button
                        onClick={handleRun}
                        disabled={running || submitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-secondary hover:bg-secondary/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {running ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <Play size={12} />
                        )}
                        Run
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={running || submitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#3fb950", color: "#0d1b2a" }}
                    >
                        {submitting ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <Send size={12} />
                        )}
                        Submit
                    </button>
                </div>
            </nav>

            {/* ── Body ── */}
            <div ref={containerRef} className="flex flex-1 overflow-hidden">
                {/* ── Left Panel ── */}
                <div
                    style={{ width: `${leftPct}%` }}
                    className="flex flex-col overflow-hidden border-r border-border min-w-0"
                >
                    <TabBar
                        tabs={["description", "solutions", "submissions"]}
                        active={leftTab}
                        onChange={setLeftTab}
                    />

                    {leftTab === "description" && <ProblemDescription questionId={questionId!} />}

                    {leftTab === "solutions" && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Code2 size={28} className="opacity-25" />
                            <p className="text-sm">Editorial solutions available after solving</p>
                        </div>
                    )}

                    {leftTab === "submissions" && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <FileText size={28} className="opacity-25" />
                            <p className="text-sm">No submissions yet</p>
                        </div>
                    )}
                </div>

                {/* Horizontal drag handle */}
                <div
                    className="w-1 shrink-0 cursor-col-resize transition-colors hover:bg-primary/60 active:bg-primary"
                    style={{ background: "var(--border)" }}
                    onMouseDown={() => {
                        horizDragging.current = true;
                    }}
                />

                {/* ── Right Panel ── */}
                <div ref={rightRef} className="flex-1 flex flex-col overflow-hidden min-w-0">
                    {/* Editor toolbar */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
                        {/* Language selector */}
                        <div className="relative">
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-secondary hover:bg-secondary/70 transition-colors"
                            >
                                {lang}
                                <ChevronDown size={11} />
                            </button>
                            {langOpen && (
                                <div className="absolute top-full left-0 mt-1 w-36 rounded-md border border-border bg-card shadow-2xl z-50 overflow-hidden">
                                    {LANGUAGES.map((l) => (
                                        <button
                                            key={l}
                                            onClick={() => handleLangChange(l)}
                                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-secondary ${l === lang ? "text-primary" : "text-foreground"
                                            }`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Reset to starter code"
                            onClick={async () => {
                                if (!questionId) return;

                                try {
                                    const starter = await getStarterCode(questionId, lang);

                                    setCodes((prev) => ({
                                        ...prev,
                                        [lang]: starter.code,
                                    }));
                                } catch (err) {
                                    console.error(err);
                                }
                            }}
                        >
                            <RotateCcw size={13} />
                        </button>
                    </div>

                    {/* ── Monaco Editor ── */}
                    <div
                        className="flex-1 overflow-hidden"
                        style={{ background: "#0d1b2a" }}
                    >
                        <Editor
                            height="100%"
                            language={MONACO_LANGUAGES[lang]}
                            value={codes[lang]}
                            onChange={(value) =>
                                setCodes((prev) => ({
                                    ...prev,
                                    [lang]: value || "",
                                }))
                            }
                            onMount={handleEditorMount}
                            options={{
                                bracketPairColorization: {
                                    enabled: true,
                                },

                                guides: {
                                    bracketPairs: true,
                                },

                                folding: true,

                                quickSuggestions: true,

                                suggestOnTriggerCharacters: true,

                                formatOnPaste: true,

                                formatOnType: true,
                                fontSize: 14,
                                fontFamily: "JetBrains Mono, monospace",
                                minimap: {
                                    enabled: false,
                                },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                wordWrap: "off",
                                lineNumbers: "on",
                                tabSize: 4,
                                insertSpaces: true,
                                renderLineHighlight: "all",
                                cursorBlinking: "smooth",
                                roundedSelection: true,
                                smoothScrolling: true,
                                padding: {
                                    top: 16,
                                },
                            }}
                        />
                    </div>

                    {/* Vertical drag handle */}
                    <div
                        className="h-1 shrink-0 cursor-row-resize transition-colors hover:bg-primary/60 active:bg-primary"
                        style={{ background: "var(--border)" }}
                        onMouseDown={() => {
                            vertDragging.current = true;
                        }}
                    />

                    {/* ── Bottom Panel ── */}
                    <div
                        style={{ height: bottomPx }}
                        className="flex flex-col overflow-hidden shrink-0"
                    >
                        <TabBar
                            tabs={["testcases", "output"]}
                            active={bottomTab}
                            onChange={setBottomTab}
                            icons={{
                                testcases: <FlaskConical size={12} />,
                                output: (
                                    <span className="flex items-center gap-1">
                    <Terminal size={12} />
                                        {result && (
                                            <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        result.passedTestCases === result.totalTestCases ? "#3fb950" : "#f85149",
                                                }}
                                            />
                                        )}
                  </span>
                                ),
                            }}
                        />

                        <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
                            {/* ── Test Cases Tab ── */}
                            {bottomTab === "testcases" && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-1.5">
                                        {testCases.map((tc, i) => (
                                            <button
                                                key={tc.id}
                                                onClick={() => setActiveCase(i)}
                                                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${activeCase === i
                                                    ? "bg-secondary text-foreground"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                                }`}
                                            >
                                                Case {i + 1}
                                            </button>
                                        ))}
                                        <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-1">
                                            <Plus size={12} />
                                        </button>
                                    </div>

                                    <div className="space-y-2.5">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1.5">Input</p>
                                            <div className="rounded-md border border-border bg-secondary/30 p-2.5 font-mono text-xs text-foreground/85 leading-5 whitespace-pre">
                                                {currentTestCase?.input || "No input available"}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1.5">Expected Output</p>
                                            <div className="rounded-md border border-border bg-secondary/30 p-2.5 font-mono text-xs text-foreground/85 leading-5">
                                                {currentTestCase?.expected || "No expected output"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Output Tab ── */}
                            {bottomTab === "output" && (
                                <div>
                                    {(running || submitting) && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                                            <Loader2 size={13} className="animate-spin text-primary" />
                                            {running ? "Running test cases…" : "Submitting solution…"}
                                        </div>
                                    )}

                                    {!running && !submitting && !result && (
                                        <p className="text-xs text-muted-foreground py-2">
                                            Click <strong className="text-foreground">Run</strong> to test your code against the sample cases.
                                        </p>
                                    )}

                                    {!running && !submitting && result && (
                                        <div className="space-y-3">
                                            {/* Result banner */}
                                            {resultType === "submit" ? (
                                                <div
                                                    className="rounded-md p-3 border"
                                                    style={{
                                                        backgroundColor:
                                                            result.status === "Accepted"
                                                                ? "rgba(63,185,80,0.08)"
                                                                : "rgba(248,81,73,0.08)",
                                                        borderColor:
                                                            result.status === "Accepted"
                                                                ? "rgba(63,185,80,0.25)"
                                                                : "rgba(248,81,73,0.25)",
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {result.status === "Accepted" ? (
                                                            <CheckCircle size={15} style={{ color: "#3fb950" }} />
                                                        ) : (
                                                            <XCircle size={15} style={{ color: "#f85149" }} />
                                                        )}
                                                        <span
                                                            className="font-semibold text-sm"
                                                            style={{
                                                                color:
                                                                    result.status === "Accepted" ? "#3fb950" : "#f85149",
                                                            }}
                                                        >
                                                            {result.status || (result.passedTestCases === result.totalTestCases ? "Accepted" : "Wrong Answer")}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mb-2">
                                                        {result.passedTestCases} / {result.totalTestCases} test cases passed
                                                    </p>
                                                    <div className="flex items-center gap-5">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock size={11} />
                              Runtime:{" "}
                                <span className="text-foreground ml-0.5">{result.runtime}</span>
                            </span>
                                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Cpu size={11} />
                              Memory:{" "}
                                                            <span className="text-foreground ml-0.5">{result.memory}</span>
                            </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 py-1">
                                                    {result.status === "success" || result.status === "Accepted" ? (
                                                        <>
                                                            <CheckCircle
                                                                size={14}
                                                                style={{ color: "#3fb950" }}
                                                            />
                                                            <span className="text-sm font-medium text-green-500">
                                                                Code Executed Successfully
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle
                                                                size={14}
                                                                style={{ color: "#f85149" }}
                                                            />
                                                            <span className="text-sm font-medium text-red-500">
                                                                {result.status || "Execution Failed"}
                                                            </span>
                                                        </>
                                                    )}

                                                    <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {result.runtime}
                                                    </span>

                                                </div>
                                            )}

                                            {/* Per-case results */}
                                            <div className="space-y-3">

                                                <div className="rounded-md border border-border bg-secondary/20 p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">
                                                        Status
                                                    </p>

                                                    <p
                                                        className={`font-medium ${
                                                            result.status === "Accepted" || result.status === "success"
                                                                ? "text-green-500"
                                                                : "text-red-500"
                                                        }`}
                                                    >
                                                        {result.status}
                                                    </p>
                                                </div>

                                                <div className="rounded-md border border-border bg-secondary/20 p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">
                                                        Output
                                                    </p>

                                                    <pre className="text-xs whitespace-pre-wrap font-mono">
      {result.output || "No Output"}
    </pre>
                                                </div>

                                                <div className="rounded-md border border-border bg-secondary/20 p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">
                                                        Error
                                                    </p>

                                                    <pre className="text-xs whitespace-pre-wrap font-mono text-red-400">
      {result.error || "No Errors"}
    </pre>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">

                                                    <div className="rounded-md border border-border bg-secondary/20 p-3">
                                                        <p className="text-xs text-muted-foreground">
                                                            Runtime
                                                        </p>

                                                        <p>{result.runtime} s</p>
                                                    </div>

                                                    <div className="rounded-md border border-border bg-secondary/20 p-3">
                                                        <p className="text-xs text-muted-foreground">
                                                            Memory
                                                        </p>

                                                        <p>{result.memory} KB</p>
                                                    </div>

                                                </div>

                                                {resultType === "submit" && (
                                                    <div className="rounded-md border border-border bg-secondary/20 p-3">
                                                        <p className="text-xs text-muted-foreground">
                                                            Test Cases
                                                        </p>

                                                        <p>
                                                            {result.passedTestCases} / {result.totalTestCases} Passed
                                                        </p>
                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
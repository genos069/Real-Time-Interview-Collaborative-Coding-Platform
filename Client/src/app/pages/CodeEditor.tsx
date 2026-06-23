import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import {
  Play, Send, ChevronDown, CheckCircle, XCircle,
  Clock, Cpu, RotateCcw, Bookmark, Plus,
  Code2, FlaskConical, Terminal, Loader2, Tag,
  ThumbsUp, MessageSquare, FileText,
  ChevronLeft, ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

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
  type: "run" | "submit";
  passed: number;
  total: number;
  runtime: string;
  memory: string;
  outputs: RunOutput[];
}

// ── Static Data ────────────────────────────────────────────────────────────────

const PROBLEM = {
  id: 1,
  title: "Two Sum",
  difficulty: "Easy" as "Easy" | "Medium" | "Hard",
  acceptance: "52.3%",
  likes: 54821,
  tags: ["Array", "Hash Table"],
  description: `Given an array of integers \`nums\` and an integer \`target\`, return _indices of the two numbers such that they add up to \`target\`_.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: null },
    { input: "nums = [3,3], target = 6", output: "[0,1]", explanation: null },
  ],
  constraints: [
    "2 ≤ nums.length ≤ 10⁴",
    "-10⁹ ≤ nums[i] ≤ 10⁹",
    "-10⁹ ≤ target ≤ 10⁹",
    "Only one valid answer exists.",
  ],
};

const LANGUAGES = ["Python3", "JavaScript", "C++", "Java", "Go", "Rust"];

const STARTER_CODE: Record<string, string> = {
  Python3: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`,
  JavaScript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
};`,
  "C++": `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.count(complement)) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
  Java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{ seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
  Go: `func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if j, ok := seen[complement]; ok {
            return []int{j, i}
        }
        seen[num] = i
    }
    return nil
}`,
  Rust: `use std::collections::HashMap;

impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        let mut seen: HashMap<i32, i32> = HashMap::new();
        for (i, &num) in nums.iter().enumerate() {
            let complement = target - num;
            if let Some(&j) = seen.get(&complement) {
                return vec![j, i as i32];
            }
            seen.insert(num, i as i32);
        }
        vec![]
    }
}`,
};

const TEST_CASES: TestCase[] = [
  { id: 1, input: "nums = [2,7,11,15]\ntarget = 9", expected: "[0,1]" },
  { id: 2, input: "nums = [3,2,4]\ntarget = 6", expected: "[1,2]" },
  { id: 3, input: "nums = [3,3]\ntarget = 6", expected: "[0,1]" },
];

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
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
            active === tab
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

function ProblemDescription() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-muted-foreground text-sm font-mono">{PROBLEM.id}.</span>
          <h1 className="text-base font-semibold tracking-tight">{PROBLEM.title}</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DiffBadge level={PROBLEM.difficulty} />
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ThumbsUp size={12} />
            <span>{PROBLEM.likes.toLocaleString()}</span>
          </button>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MessageSquare size={12} />
            {PROBLEM.acceptance} acceptance
          </span>
          <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
            <Bookmark size={14} />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="text-sm leading-relaxed text-foreground/85 space-y-3">
        {PROBLEM.description.split("\n\n").map((para, i) => (
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
        {PROBLEM.examples.map((ex, i) => (
          <div key={i}>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
              Example {i + 1}
            </p>
            <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-1.5">
              <div className="font-mono text-xs leading-5">
                <span className="text-muted-foreground">Input:&nbsp;&nbsp;</span>
                <span className="text-foreground/90">{ex.input}</span>
              </div>
              <div className="font-mono text-xs leading-5">
                <span className="text-muted-foreground">Output:&nbsp;</span>
                <span className="text-foreground/90">{ex.output}</span>
              </div>
              {ex.explanation && (
                <div className="pt-1.5 mt-1.5 border-t border-border text-xs text-muted-foreground leading-5">
                  <span className="text-foreground/70">Explanation: </span>
                  {ex.explanation}
                </div>
              )}
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
          {PROBLEM.constraints.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
              <code className="font-mono text-foreground/85">{c}</code>
            </li>
          ))}
        </ul>
      </div>

      {/* Tags */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
          Topics
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PROBLEM.tags.map((tag) => (
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
  const [code, setCode] = useState(STARTER_CODE["Python3"]);
  const [activeCase, setActiveCase] = useState(0);

  // Execution
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  // Drag refs
  const containerRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const horizDragging = useRef(false);
  const vertDragging = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleLangChange = (l: string) => {
    setLang(l);
    setCode(STARTER_CODE[l]);
    setLangOpen(false);
  };

  const handleRun = async () => {
    setRunning(true);
    setBottomTab("output");
    setResult(null);
    await new Promise((r) => setTimeout(r, 1300));
    setResult({
      type: "run",
      passed: 3,
      total: 3,
      runtime: "48 ms",
      memory: "17.4 MB",
      outputs: TEST_CASES.map((tc) => ({
        input: tc.input,
        expected: tc.expected,
        got: tc.expected,
        passed: true,
      })),
    });
    setRunning(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setBottomTab("output");
    setResult(null);
    await new Promise((r) => setTimeout(r, 2100));
    setResult({
      type: "submit",
      passed: 57,
      total: 57,
      runtime: "48 ms",
      memory: "17.4 MB",
      outputs: TEST_CASES.map((tc) => ({
        input: tc.input,
        expected: tc.expected,
        got: tc.expected,
        passed: true,
      })),
    });
    setSubmitting(false);
  };

  const lines = code.split("\n");
  const lineHeight = 22;

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
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-secondary">
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
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground hidden md:block">
            <span className="text-foreground font-medium">1</span> / 3506
          </div>
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

          {leftTab === "description" && <ProblemDescription />}

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
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-secondary ${
                        l === lang ? "text-primary" : "text-foreground"
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
              onClick={() => setCode(STARTER_CODE[lang])}
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* ── Code Editor ── */}
          <div className="flex-1 overflow-auto scrollbar-hide min-h-0" style={{ background: "#0d1b2a" }}>
            <div className="flex" style={{ minHeight: "100%" }}>
              {/* Line numbers */}
              <div
                className="select-none shrink-0 pt-4 pb-4 pr-3 pl-4 text-right font-mono text-muted-foreground/35 sticky left-0 z-10"
                style={{
                  fontSize: 12,
                  lineHeight: `${lineHeight}px`,
                  background: "#0d1b2a",
                  minWidth: "3rem",
                }}
              >
                {lines.map((_, i) => (
                  <div key={i} style={{ height: lineHeight }}>
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-transparent text-foreground/90 resize-none outline-none py-4 pr-6 caret-primary font-mono"
                style={{
                  fontSize: 12,
                  lineHeight: `${lineHeight}px`,
                  height: `${lines.length * lineHeight + 32}px`,
                  minHeight: "100%",
                  overflow: "hidden",
                  whiteSpace: "pre",
                  tabSize: 4,
                }}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const next = code.substring(0, start) + "    " + code.substring(end);
                    setCode(next);
                    setTimeout(() => {
                      if (textareaRef.current) {
                        textareaRef.current.selectionStart = start + 4;
                        textareaRef.current.selectionEnd = start + 4;
                      }
                    }, 0);
                  }
                }}
              />
            </div>
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
                            result.passed === result.total ? "#3fb950" : "#f85149",
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
                    {TEST_CASES.map((tc, i) => (
                      <button
                        key={tc.id}
                        onClick={() => setActiveCase(i)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          activeCase === i
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
                        {TEST_CASES[activeCase].input}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Expected Output</p>
                      <div className="rounded-md border border-border bg-secondary/30 p-2.5 font-mono text-xs text-foreground/85 leading-5">
                        {TEST_CASES[activeCase].expected}
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
                      {result.type === "submit" ? (
                        <div
                          className="rounded-md p-3 border"
                          style={{
                            backgroundColor:
                              result.passed === result.total
                                ? "rgba(63,185,80,0.08)"
                                : "rgba(248,81,73,0.08)",
                            borderColor:
                              result.passed === result.total
                                ? "rgba(63,185,80,0.25)"
                                : "rgba(248,81,73,0.25)",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {result.passed === result.total ? (
                              <CheckCircle size={15} style={{ color: "#3fb950" }} />
                            ) : (
                              <XCircle size={15} style={{ color: "#f85149" }} />
                            )}
                            <span
                              className="font-semibold text-sm"
                              style={{
                                color:
                                  result.passed === result.total ? "#3fb950" : "#f85149",
                              }}
                            >
                              {result.passed === result.total ? "Accepted" : "Wrong Answer"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {result.passed} / {result.total} test cases passed
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
                          {result.passed === result.total ? (
                            <CheckCircle size={14} style={{ color: "#3fb950" }} />
                          ) : (
                            <XCircle size={14} style={{ color: "#f85149" }} />
                          )}
                          <span
                            className="text-sm font-medium"
                            style={{
                              color:
                                result.passed === result.total ? "#3fb950" : "#f85149",
                            }}
                          >
                            {result.passed === result.total
                              ? `All ${result.total} test cases passed`
                              : `${result.total - result.passed} / ${result.total} failed`}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                            <Clock size={10} /> {result.runtime}
                          </span>
                        </div>
                      )}

                      {/* Per-case results */}
                      <div className="space-y-2">
                        {result.outputs.map((out, i) => (
                          <div
                            key={i}
                            className="rounded-md border p-2.5"
                            style={{
                              borderColor: out.passed
                                ? "rgba(63,185,80,0.2)"
                                : "rgba(248,81,73,0.3)",
                              backgroundColor: out.passed
                                ? "rgba(63,185,80,0.04)"
                                : "rgba(248,81,73,0.06)",
                            }}
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              {out.passed ? (
                                <CheckCircle size={11} style={{ color: "#3fb950" }} />
                              ) : (
                                <XCircle size={11} style={{ color: "#f85149" }} />
                              )}
                              <span className="text-xs font-medium text-muted-foreground">
                                Case {i + 1}
                              </span>
                            </div>
                            <div className="font-mono text-xs space-y-0.5 leading-5">
                              <div>
                                <span className="text-muted-foreground">Input:&nbsp;&nbsp;&nbsp;</span>
                                <span className="text-foreground/80">
                                  {out.input.replace("\n", ", ")}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Output:&nbsp;&nbsp;</span>
                                <span
                                  style={{ color: out.passed ? "#3fb950" : "#f85149" }}
                                >
                                  {out.got}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Expected: </span>
                                <span className="text-foreground/80">{out.expected}</span>
                              </div>
                            </div>
                          </div>
                        ))}
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

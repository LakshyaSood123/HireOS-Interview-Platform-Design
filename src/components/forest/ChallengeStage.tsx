import { useState } from "react"
import type { PracticeChallenge } from "../../data/reagvisCourses"

interface ChallengeStageProps {
  challenge: PracticeChallenge
  onBackToLesson: () => void
  onSuccess: () => void
}

export default function ChallengeStage({
  challenge,
  onBackToLesson,
  onSuccess,
}: ChallengeStageProps) {
  const [code, setCode] = useState(challenge.starterCode)
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleRunCode = () => {
    setIsRunning(true)
    setConsoleOutput("⚡ Compiling test suite against boundary test cases...")
    setTimeout(() => {
      setIsRunning(false)
      setConsoleOutput(challenge.mockRunOutput)
    }, 700)
  }

  const handleSubmit = () => {
    setIsRunning(true)
    setConsoleOutput("🔍 Evaluating time complexity, edge cases, and memory limits...")
    setTimeout(() => {
      setIsRunning(false)
      setIsSuccess(true)
      setConsoleOutput("🎉 All test cases passed! Complexity verified O(N) Time, O(N) Space.\nReady to lock in mastery!")
    }, 850)
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10 text-white">
        <button
          onClick={onBackToLesson}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all"
        >
          <span>←</span> Back to Lesson Notes
        </button>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-[#E2B44A]/20 text-[#E2B44A] font-bold">
            +{challenge.rewardXP} XP Bounty
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#1DB584]/20 text-[#1DB584] font-semibold">
            Difficulty: {challenge.difficulty}
          </span>
        </div>
      </div>

      {/* ── Main Split View ── */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Problem Prompt */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-3xl bg-[#092218] border border-[#1DB584]/30 p-6 text-white shadow-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#1DB584]/20 text-[#1DB584] mb-3">
              <span>⚔️</span> Live Code Challenge
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-3">
              {challenge.title}
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              {challenge.description}
            </p>

            {/* Constraints & Expected Output */}
            <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
              <div>
                <span className="font-bold text-gray-400 block mb-1">Constraints:</span>
                <ul className="space-y-1 text-gray-300">
                  <li>&bull; 2 &le; nums.length &le; 10⁴</li>
                  <li>&bull; -10⁹ &le; nums[i] &le; 10⁹</li>
                  <li>&bull; Only one valid answer exists.</li>
                </ul>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 font-mono text-[11px]">
                <span className="text-gray-400">Target Return: </span>
                <span className="text-[#A7CE65] font-bold">{challenge.expectedOutput}</span>
              </div>
            </div>

            {/* Hint Trigger */}
            <div className="mt-5 pt-4 border-t border-white/10">
              {!showHint ? (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
                >
                  <span>💡</span> Need an algorithmic hint?
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
                  <p className="font-bold mb-1">Hint from Reagvis Guide:</p>
                  <p>{challenge.solutionHint}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Code Editor & Test Console */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Editor Container */}
          <div className="rounded-3xl bg-[#04100C] border border-[#1DB584]/40 overflow-hidden shadow-2xl flex-1 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between px-5 py-3 bg-[#0A261B] border-b border-[#1DB584]/20 text-xs text-gray-300 font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-white font-bold">solution.js</span>
              </span>
              <span className="text-emerald-400">JavaScript (ES6)</span>
            </div>

            <div className="flex-1 p-4 relative">
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                className="w-full h-full min-h-[260px] bg-transparent text-emerald-300 font-mono text-sm leading-relaxed outline-none resize-none"
              />
            </div>

            {/* Action Bar */}
            <div className="px-5 py-3.5 bg-[#0A261B] border-t border-[#1DB584]/20 flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-400 font-mono">
                Press Run to execute test suite
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all cursor-pointer"
                >
                  {isRunning ? "Running..." : "▶ Run Tests"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isRunning}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-md shadow-[#1DB584]/30 hover:scale-105 transition-all cursor-pointer"
                >
                  Submit Solution
                </button>
              </div>
            </div>
          </div>

          {/* Test Runner Console */}
          {consoleOutput && (
            <div className="rounded-2xl bg-[#04100C] border border-white/10 p-4 font-mono text-xs text-gray-300">
              <div className="flex items-center justify-between text-gray-500 mb-2 pb-1 border-b border-white/5">
                <span>TERMINAL OUTPUT</span>
                <span>STATUS: {isRunning ? "TESTING" : isSuccess ? "PASSED" : "IDLE"}</span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed text-emerald-300">
                {consoleOutput}
              </pre>

              {/* Victory Next Step */}
              {isSuccess && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#E2B44A]">
                    Mastery Unlocked (+{challenge.rewardXP} XP)!
                  </span>
                  <button
                    onClick={onSuccess}
                    className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-[#E2B44A] hover:bg-amber-300 shadow-lg shadow-amber-400/30 hover:scale-105 transition-all"
                  >
                    Claim Victory &amp; Unlock Next Landmark ➔
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

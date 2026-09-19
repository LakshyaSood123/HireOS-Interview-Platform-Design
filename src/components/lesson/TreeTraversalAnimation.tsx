import type { TreePreorderState } from "../../learning/animations/treePreorderStates"
import AnimationPlayback from "./AnimationPlayback"

interface TreeTraversalAnimationProps {
  title: string
  states: TreePreorderState[]
}

const TREE_NODES = [
  { value: 1, x: 160, y: 34 },
  { value: 2, x: 96, y: 104 },
  { value: 3, x: 224, y: 104 },
  { value: 4, x: 56, y: 174 },
  { value: 5, x: 136, y: 174 },
]

const TREE_EDGES = [
  [1, 2],
  [1, 3],
  [2, 4],
  [2, 5],
]

interface SvgNode {
  value: number
  x: number
  y: number
}

function findNode(value: number): SvgNode {
  const node = TREE_NODES.find(item => item.value === value)
  if (!node) throw new Error(`Missing tree node ${value}`)
  return node
}

export default function TreeTraversalAnimation({ title, states }: TreeTraversalAnimationProps) {
  return (
    <AnimationPlayback
      title={title}
      states={states}
      getOperation={state => state.operation}
      getMessage={state => state.message}
      traceId="tree-preorder-traversal"
    >
      {state => (
        <div className="grid gap-4 md:grid-cols-[1fr_0.85fr]">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <svg viewBox="0 0 320 220" className="h-56 w-full">
              {TREE_EDGES.map(([from, to]) => {
                const a = findNode(from)
                const b = findNode(to)
                return (
                  <line
                    key={`${from}-${to}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                )
              })}
              {TREE_NODES.map(node => {
                const visited = state.visited.includes(node.value)
                const current = state.current === node.value
                return (
                  <g key={node.value}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="23"
                      fill={current ? "#1DB584" : visited ? "rgba(167,206,101,0.28)" : "rgba(0,0,0,0.35)"}
                      stroke={current ? "#A7CE65" : "rgba(255,255,255,0.16)"}
                      strokeWidth="3"
                    />
                    <text x={node.x} y={node.y + 5} textAnchor="middle" className="fill-white text-sm font-black">
                      {node.value}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">Preorder Sequence</div>
            <div className="flex flex-wrap gap-2">
              {state.sequence.map(value => (
                <span key={value} className="rounded-lg bg-[#1DB584] px-3 py-2 text-sm font-black text-white">
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </AnimationPlayback>
  )
}

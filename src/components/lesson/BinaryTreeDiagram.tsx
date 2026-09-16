import { useMemo, useState } from "react"
import type { TraversalVisual, TreeVizNode } from "../../learning/types"

interface PositionedNode {
  value: number
  x: number
  y: number
  left?: PositionedNode
  right?: PositionedNode
}

/** Assigns x via inorder position (so the drawing always looks like a
 * correctly-shaped binary tree) and y via depth. Simple, no external layout
 * library — this only ever needs to render small teaching examples. */
function layout(node: TreeVizNode | undefined, depth: number, counter: { next: number }): PositionedNode | undefined {
  if (!node) return undefined
  const left = layout(node.left, depth + 1, counter)
  const x = counter.next++
  const right = layout(node.right, depth + 1, counter)
  return { value: node.value, x, y: depth, left, right }
}

function collectEdges(node: PositionedNode | undefined, edges: [PositionedNode, PositionedNode][] = []) {
  if (!node) return edges
  if (node.left) {
    edges.push([node, node.left])
    collectEdges(node.left, edges)
  }
  if (node.right) {
    edges.push([node, node.right])
    collectEdges(node.right, edges)
  }
  return edges
}

function collectNodes(node: PositionedNode | undefined, out: PositionedNode[] = []) {
  if (!node) return out
  out.push(node)
  collectNodes(node.left, out)
  collectNodes(node.right, out)
  return out
}

type TraversalKind = "preorder" | "inorder" | "postorder"

/** Trees-specific by necessity — a small binary tree diagram with a
 * preorder/inorder/postorder toggle (PART 6). Reused across every Trees
 * checkpoint that includes a `visual`; not part of the generic lesson
 * component set since a SQL or networking lesson has no equivalent. */
export default function BinaryTreeDiagram({ visual }: { visual: TraversalVisual }) {
  const [active, setActive] = useState<TraversalKind>("preorder")

  const root = useMemo(() => layout(visual.tree, 0, { next: 0 }), [visual.tree])
  const nodes = useMemo(() => collectNodes(root), [root])
  const edges = useMemo(() => collectEdges(root), [root])

  const maxX = Math.max(1, ...nodes.map(n => n.x))
  const maxY = Math.max(1, ...nodes.map(n => n.y))
  const cellW = 64
  const cellH = 64
  const width = (maxX + 1) * cellW
  const height = (maxY + 1) * cellH + 30

  const px = (x: number) => x * cellW + cellW / 2
  const py = (y: number) => y * cellH + 30

  const sequence = visual[active]
  const orderIndex = new Map(sequence.map((v, i) => [v, i]))

  const tabs: { key: TraversalKind; label: string }[] = [
    { key: "preorder", label: "Preorder" },
    { key: "inorder", label: "Inorder" },
    { key: "postorder", label: "Postorder" },
  ]

  return (
    <div className="rounded-2xl border border-[#1DB584]/25 bg-[#092218] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              active === tab.key
                ? "bg-[#1DB584] text-white"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <svg width={width} height={height} className="mx-auto block">
          {edges.map(([from, to], i) => (
            <line
              key={i}
              x1={px(from.x)}
              y1={py(from.y)}
              x2={px(to.x)}
              y2={py(to.y)}
              stroke="#2C4A3A"
              strokeWidth={2}
            />
          ))}
          {nodes.map(n => {
            const idx = orderIndex.get(n.value)
            return (
              <g key={`${n.x}-${n.y}`}>
                <circle
                  cx={px(n.x)}
                  cy={py(n.y)}
                  r={18}
                  fill={idx !== undefined ? "#1DB584" : "#0F3524"}
                  stroke="#1DB584"
                  strokeWidth={1.5}
                />
                <text x={px(n.x)} y={py(n.y) + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff">
                  {n.value}
                </text>
                {idx !== undefined && (
                  <text x={px(n.x)} y={py(n.y) - 24} textAnchor="middle" fontSize={11} fontWeight={700} fill="#A7CE65">
                    {idx + 1}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{tabs.find(t => t.key === active)?.label}:</span>
        {sequence.map((v, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="w-6 h-6 rounded-full bg-[#1DB584]/20 text-[#A7CE65] text-xs font-black flex items-center justify-center">
              {v}
            </span>
            {i < sequence.length - 1 && <span className="text-gray-600 text-xs">→</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

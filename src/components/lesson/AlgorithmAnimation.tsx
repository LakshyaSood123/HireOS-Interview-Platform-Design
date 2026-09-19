import type { AlgorithmAnimationSpec } from "../../learning/types"
import ArrayTraversalVisual, { type ArrayTraversalState } from "./ArrayTraversalVisual"

interface RegisteredAnimation {
  title: string
  states: ArrayTraversalState[]
}

const animations: Record<AlgorithmAnimationSpec["id"], RegisteredAnimation> = {
  "arrays-in-place-reversal": {
    title: "Index, update, then reverse with two indices",
    states: [
      {
        operation: "SCAN",
        values: [4, 8, 1, 9, 3, 6],
        activeIndex: 0,
        message: "Read nums[0] directly by index.",
      },
      {
        operation: "UPDATE",
        values: [4, 8, 1, 7, 3, 6],
        activeIndex: 3,
        message: "Update index 3 from 9 to 7.",
      },
      {
        operation: "REVERSE_SWAP",
        values: [4, 8, 1, 7, 3, 6],
        leftIndex: 0,
        rightIndex: 5,
        message: "Reverse: swap the two ends.",
      },
      {
        operation: "REVERSED",
        values: [6, 3, 7, 1, 8, 4],
        message: "Final reversed order after symmetric swaps.",
      },
    ],
  },
}

interface AlgorithmAnimationProps {
  animation: AlgorithmAnimationSpec
}

export default function AlgorithmAnimation({ animation }: AlgorithmAnimationProps) {
  const registered = animations[animation.id]

  if (!registered) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-100">
        Animation unavailable: {animation.id}
      </div>
    )
  }

  return (
    <ArrayTraversalVisual
      title={animation.title ?? registered.title}
      states={registered.states}
    />
  )
}

import type { AlgorithmAnimationSpec } from "../../learning/types"
import type { ReactElement } from "react"
import { arraysInPlaceStates } from "../../learning/animations/arraysInPlaceStates"
import { validateAnimationStates } from "../../learning/animations/animationValidators"
import { binarySearchStates } from "../../learning/animations/binarySearchStates"
import { linkedListReversalStates } from "../../learning/animations/linkedListReversalStates"
import {
  complexityStates,
  hashingStates,
  intervalsStates,
  prefixSumStates,
  twoPointersStates,
} from "../../learning/animations/patternBasicsStates"
import { recursionFactorialStates } from "../../learning/animations/recursionFactorialStates"
import { slidingWindowStates } from "../../learning/animations/slidingWindowStates"
import { treePreorderStates } from "../../learning/animations/treePreorderStates"
import ArrayTraversalVisual from "./ArrayTraversalVisual"
import BinarySearchAnimation from "./BinarySearchAnimation"
import LinkedListAnimation from "./LinkedListAnimation"
import PatternBasicsAnimation from "./PatternBasicsAnimation"
import RecursionAnimation from "./RecursionAnimation"
import SlidingWindowAnimation from "./SlidingWindowAnimation"
import TreeTraversalAnimation from "./TreeTraversalAnimation"

interface RegisteredAnimation<TState> {
  title: string
  states: TState[]
  render: (title: string, states: TState[]) => ReactElement
}

const animations = {
  "arrays-in-place-reversal": {
    title: "Index, update, then reverse with two indices",
    states: arraysInPlaceStates,
    render: (title, states) => <ArrayTraversalVisual title={title} states={states} />,
  },
  "complexity-growth": {
    title: "Relative growth of five complexity classes",
    states: complexityStates,
    render: (title, states) => <PatternBasicsAnimation title={title} states={states} kind="complexity" />,
  },
  "hashing-frequency-map": {
    title: "Key to hash to bucket to frequency update",
    states: hashingStates,
    render: (title, states) => <PatternBasicsAnimation title={title} states={states} kind="hashing" />,
  },
  "two-pointers-opposite-sum": {
    title: "Move the pointer justified by the current sum",
    states: twoPointersStates,
    render: (title, states) => <PatternBasicsAnimation title={title} states={states} kind="two-pointers" />,
  },
  "sliding-window-variable": {
    title: "Variable window: expand right, shrink until valid",
    states: slidingWindowStates,
    render: (title, states) => <SlidingWindowAnimation title={title} states={states} />,
  },
  "prefix-sum-range-query": {
    title: "Build prefix values, then subtract before the range",
    states: prefixSumStates,
    render: (title, states) => <PatternBasicsAnimation title={title} states={states} kind="prefix-sum" />,
  },
  "binary-search-decision": {
    title: "Compare mid, discard half, then find the target",
    states: binarySearchStates,
    render: (title, states) => <BinarySearchAnimation title={title} states={states} />,
  },
  "intervals-merge-overlap": {
    title: "Merge overlapping intervals",
    states: intervalsStates,
    render: (title, states) => <PatternBasicsAnimation title={title} states={states} kind="intervals" />,
  },
  "linked-list-reversal": {
    title: "Reverse a linked list with prev, curr, and next",
    states: linkedListReversalStates,
    render: (title, states) => <LinkedListAnimation title={title} states={states} />,
  },
  "recursion-factorial-unwind": {
    title: "Factorial calls grow, hit the base case, then unwind",
    states: recursionFactorialStates,
    render: (title, states) => <RecursionAnimation title={title} states={states} />,
  },
  "tree-preorder-traversal": {
    title: "Preorder traversal: root, left, right",
    states: treePreorderStates,
    render: (title, states) => <TreeTraversalAnimation title={title} states={states} />,
  },
} satisfies Record<AlgorithmAnimationSpec["id"], RegisteredAnimation<any>>

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

  const validationErrors = validateAnimationStates(animation.id, registered.states)

  if (validationErrors.length) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-100">
        Animation invalid: {validationErrors.join(" ")}
      </div>
    )
  }

  return registered.render(animation.title ?? registered.title, registered.states)
}

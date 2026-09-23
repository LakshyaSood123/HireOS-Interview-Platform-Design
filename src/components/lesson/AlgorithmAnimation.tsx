import type { AlgorithmAnimationSpec } from "../../learning/types"
import type { ReactElement } from "react"
import { advancedAnimationStates } from "../../learning/animations/advancedAnimationStates"
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
import { fastSlowPointerStates, hashingComplementStates, monotonicSearchStates } from "../../learning/animations/studyExpansionStates"
import { treePreorderStates } from "../../learning/animations/treePreorderStates"
import AdvancedConceptAnimation from "./AdvancedConceptAnimation"
import ComplementLookupAnimation from "./ComplementLookupAnimation"
import FastSlowPointerAnimation from "./FastSlowPointerAnimation"
import MonotonicConditionAnimation from "./MonotonicConditionAnimation"
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
  "hashing-complement-lookup": {
    title: "Complement lookup replaces pair-by-pair scanning",
    states: hashingComplementStates,
    render: (title, states) => <ComplementLookupAnimation title={title} states={states} />,
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
  "binary-search-monotonic-condition": {
    title: "Search a monotonic condition for the first valid answer",
    states: monotonicSearchStates,
    render: (title, states) => <MonotonicConditionAnimation title={title} states={states} />,
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
  "linked-list-fast-slow-cycle": {
    title: "Fast and slow pointers meet inside a cycle",
    states: fastSlowPointerStates,
    render: (title, states) => <FastSlowPointerAnimation title={title} states={states} />,
  },
  "stack-queue-lifo-fifo": {
    title: "LIFO stack versus FIFO queue",
    states: advancedAnimationStates["stack-queue-lifo-fifo"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="stack-queue-lifo-fifo" />,
  },
  "heap-insert-bubble": {
    title: "Insert leaf, compare parent, swap upward",
    states: advancedAnimationStates["heap-insert-bubble"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="heap-insert-bubble" />,
  },
  "trie-prefix-branch": {
    title: "Reuse shared prefix before branching",
    states: advancedAnimationStates["trie-prefix-branch"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="trie-prefix-branch" />,
  },
  "recursion-factorial-unwind": {
    title: "Factorial calls grow, hit the base case, then unwind",
    states: recursionFactorialStates,
    render: (title, states) => <RecursionAnimation title={title} states={states} />,
  },
  "backtracking-choose-undo": {
    title: "Choose, explore, dead end, undo, alternate",
    states: advancedAnimationStates["backtracking-choose-undo"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="backtracking-choose-undo" />,
  },
  "tree-preorder-traversal": {
    title: "Preorder traversal: root, left, right",
    states: treePreorderStates,
    render: (title, states) => <TreeTraversalAnimation title={title} states={states} />,
  },
  "bst-search-invariant": {
    title: "Use the BST invariant to choose one direction",
    states: advancedAnimationStates["bst-search-invariant"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="bst-search-invariant" />,
  },
  "graph-adjacency-build": {
    title: "Edges and adjacency list represent the same graph",
    states: advancedAnimationStates["graph-adjacency-build"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="graph-adjacency-build" />,
  },
  "dfs-bfs-frontier": {
    title: "Same graph, different frontier discipline",
    states: advancedAnimationStates["dfs-bfs-frontier"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="dfs-bfs-frontier" />,
  },
  "grid-graph-frontier": {
    title: "Traversal grows from one start through a frontier",
    states: advancedAnimationStates["grid-graph-frontier"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="grid-graph-frontier" />,
  },
  "topological-sort-kahn": {
    title: "Kahn's algorithm processes zero-indegree nodes",
    states: advancedAnimationStates["topological-sort-kahn"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="topological-sort-kahn" />,
  },
  "union-find-compression": {
    title: "Find root, then compress the parent chain",
    states: advancedAnimationStates["union-find-compression"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="union-find-compression" />,
  },
  "greedy-interval-selection": {
    title: "Select the earliest-finishing compatible interval",
    states: advancedAnimationStates["greedy-interval-selection"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="greedy-interval-selection" />,
  },
  "dp-1d-fill": {
    title: "Fill each state from previously solved states",
    states: advancedAnimationStates["dp-1d-fill"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="dp-1d-fill" />,
  },
  "dp-2d-grid-paths": {
    title: "Grid paths: each cell is top plus left",
    states: advancedAnimationStates["dp-2d-grid-paths"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="dp-2d-grid-paths" />,
  },
  "dp-take-skip": {
    title: "Take versus skip, then merge with max",
    states: advancedAnimationStates["dp-take-skip"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="dp-take-skip" />,
  },
  "pattern-recognition-clues": {
    title: "Clues suggest a pattern but do not guarantee one",
    states: advancedAnimationStates["pattern-recognition-clues"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="pattern-recognition-clues" />,
  },
  "timed-problem-phases": {
    title: "Calm phase budgets for timed problems",
    states: advancedAnimationStates["timed-problem-phases"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="timed-problem-phases" />,
  },
  "company-mission-review": {
    title: "Target, solve, then review misses by root cause",
    states: advancedAnimationStates["company-mission-review"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="company-mission-review" />,
  },
  "final-mastery-readiness": {
    title: "Five capstone abilities converge into readiness",
    states: advancedAnimationStates["final-mastery-readiness"],
    render: (title, states) => <AdvancedConceptAnimation title={title} states={states} traceId="final-mastery-readiness" />,
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

export interface RecursionFactorialState {
  operation: "CALL" | "BASE_CASE" | "UNWIND" | "COMPLETE"
  stack: string[]
  detail: string
  message: string
}

export const recursionFactorialStates: RecursionFactorialState[] = [
  {
    operation: "CALL",
    stack: ["factorial(3)", "factorial(2)"],
    detail: "Each call waits for a smaller factorial result.",
    message: "factorial(3) calls factorial(2), which keeps shrinking toward the base case.",
  },
  {
    operation: "BASE_CASE",
    stack: ["factorial(3)", "factorial(2)", "factorial(1)", "factorial(0)"],
    detail: "factorial(0) = 1",
    message: "The base case answers directly, so recursion stops growing.",
  },
  {
    operation: "UNWIND",
    stack: ["factorial(3)", "factorial(2)"],
    detail: "factorial(1)=1; factorial(2)=2",
    message: "Calls now return upward, multiplying as the stack unwinds.",
  },
  {
    operation: "COMPLETE",
    stack: [],
    detail: "factorial(3) = 3 x 2 = 6",
    message: "The original call receives the final value after every frame returns.",
  },
]

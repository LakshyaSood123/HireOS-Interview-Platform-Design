// MODULE 6 — Optimization for Machine Learning (11 checkpoints) in Optimization Ridge.
//
// What "training a model" means mathematically, taught intuition-first. Recurring examples
// (consistent with Calculus for Learning):
//   - a one-weight objective        L(w) = (w - 3)^2                  (minimum at w = 3)
//   - a two-weight objective        L(w1, w2) = (w1 - 3)^2 + 2 (w2 - 1)^2   (minimum at (3, 1))
//   - a budget constraint           w1 + w2 <= 2   (equality: w1 + w2 = 2)
//                                   best feasible point (5/3, 1/3), loss 8/3
// Plain readable formulas; Python uses only the standard library. Quick Check answer
// positions are deliberately varied.

import type { CheckpointSpec } from "./builder.js";

export const optimizationModuleSpecs: CheckpointSpec[] = [
  {
    id: "optimization-1",
    title: "Objective Functions",
    subtitle: "Turning 'better' into one number that training can chase",
    prerequisites: [],
    theory: [
      {
        heading: "Training needs a target",
        body: "To train a model you must say, in a single number, what 'better' means. That number comes from an objective function: a rule that takes a candidate solution, here the model's parameters, and returns a score. Optimization is the search for the candidate with the best score.",
      },
      {
        heading: "A tiny example",
        body: "Take one parameter w and the objective L(w) = (w − 3)². Feed in a candidate and read off its score: w = 0 scores 9, w = 2 scores 1, w = 3 scores 0, and w = 5 scores 4. We decided that lower is better, so w = 3 is the best of these four.",
      },
      {
        heading: "Minimize or maximize",
        body: "We choose the direction. Here lower is better, so we minimize. Maximizing a quantity is the same as minimizing its negative, which is why a likelihood we want to maximize is usually turned into a negative log-likelihood we minimize.",
      },
      {
        heading: "See the whole objective",
        body: "Plot the score for every possible w and you get a bowl whose lowest point is at w = 3. The best w is the minimizer and the lowest score, 0, is the minimum value. In real training we cannot see the whole bowl; optimization is about finding the bottom without being told where it is.",
      },
      {
        heading: "Why it matters for ML",
        body: "A model's parameters are the inputs of the objective, so training means searching parameter space for parameters with a better objective value. Later lessons show that the objective can contain more than the error alone, but it always plays this role: one number that tells the search which parameters are better.",
      },
    ],
    learnMore:
      "Worked example: the objective values of w = 0, 2, 3, 5 are 9, 1, 0, 4. Searching a fine grid of w from 0 to 6 in steps of 0.1 finds the best at w = 3.0 with value 0.0, as the picture of the bowl suggests.",
    python: `def objective(w):
    return (w - 3) ** 2

for w in [0, 2, 3, 5]:
    print(w, objective(w))      # 0 9 / 2 1 / 3 0 / 5 4

candidates = [i / 10 for i in range(0, 61)]     # 0.0, 0.1, ... 6.0
best = min(candidates, key=objective)
print(best, objective(best))    # 3.0 0.0`,
    quickCheck: {
      question: "A model has one parameter w and the objective L(w) = (w − 3)², which we want to minimize. Candidates w = 0, 2 and 5 are compared. Which statement is correct?",
      options: [
        "w = 5 is best, because it is the largest value",
        "w = 2 is best of the three, because its objective value, 1, is the lowest",
        "w = 0 is best, because it is where the search starts",
        "All three are equally good, because only the minimum matters",
      ],
      correctIndex: 1,
      explanation:
        "The objective scores 9, 1 and 4 for w = 0, 2 and 5. Since lower is better, w = 2 is the best of these candidates. (The best overall is w = 3, with score 0.)",
    },
  },
  {
    id: "optimization-2",
    title: "Loss Functions",
    subtitle: "How wrong is the model? One rule that turns mistakes into a number",
    prerequisites: ["optimization-1"],
    theory: [
      {
        heading: "Prediction and error",
        body: "A model makes a prediction ŷ, and the true answer is y. The error is ŷ − y. Example: the model ŷ = w × x with w = 2, applied to three houses of size x = 1, 2, 3 whose true prices are y = 3, 5, 9. The predictions are 2, 4, 6 and the errors are −1, −1, −3.",
      },
      {
        heading: "Loss measures how wrong",
        body: "A loss function turns an error into a single non-negative number by a chosen rule. The squared error is loss = (ŷ − y)². The three losses are 1, 1 and 9. Squaring ignores the sign of the error and punishes big mistakes much more: the house that is off by 3 costs nine times as much as a house that is off by 1.",
      },
      {
        heading: "One score for the whole dataset",
        body: "Training needs one number for the whole dataset, so we average the per-example losses: mean squared error = (1 + 1 + 9) / 3 ≈ 3.67. A better weight w = 3 gives predictions 3, 6, 9, errors 0, 1, 0 and an average loss of only 0.33.",
      },
      {
        heading: "Loss vs objective",
        body: "The loss says how wrong the predictions are. The objective is what optimization actually minimizes, and it may be the average loss plus something more. For example objective = average loss + 0.1 × w² adds a penalty on large weights. At w = 3 that is 0.33 + 0.9 ≈ 1.23. In the simplest case the objective is just the average loss, which is why the two words get mixed up. Keep them apart.",
      },
      {
        heading: "Choosing a loss",
        body: "Different tasks use different loss rules: squared error for predicting numbers, and for classification, losses that score predicted probabilities, which we meet later. The loss is a modeling choice that defines what 'wrong' means for your problem.",
      },
    ],
    learnMore:
      "Worked example: with w = 2 the squared errors are 1, 1 and 9, mean 11/3 ≈ 3.67; adding 0.1 × 2² = 0.4 gives the objective 4.07. With w = 3 the squared errors are 0, 1 and 0, mean 1/3 ≈ 0.33; adding 0.1 × 3² = 0.9 gives 1.23. Both the loss and the objective prefer w = 3 over w = 2 here.",
    python: `x = [1, 2, 3]
y = [3, 5, 9]

def predict(w):
    return [w * xi for xi in x]

def mse(w):
    errors = [p - t for p, t in zip(predict(w), y)]
    return sum(e ** 2 for e in errors) / len(errors)     # average squared error (the loss)

def objective(w, lam=0.1):
    return mse(w) + lam * w ** 2                         # loss plus a penalty on large w

print(round(mse(2), 2), round(mse(3), 2))               # 3.67 0.33
print(round(objective(2), 2), round(objective(3), 2))   # 4.07 1.23`,
    quickCheck: {
      question: "A model's average squared error on the training data is 4.0. The training objective is that average error plus 0.5 × (sum of squared weights), which comes to 6.5. How should you describe these numbers?",
      options: [
        "The loss is 6.5 and the objective is 4.0",
        "Loss and objective must always be the same number",
        "The objective is 4.0, because penalty terms are not part of training",
        "The loss (average error) is 4.0, while the objective that training minimizes is 6.5",
      ],
      correctIndex: 3,
      explanation:
        "The loss measures the error, 4.0. The objective is what optimization minimizes: the loss plus a penalty, 6.5. They coincide only when the objective is just the average loss.",
    },
  },
  {
    id: "optimization-3",
    title: "Gradient Descent",
    subtitle: "Walking downhill using only the slope under your feet",
    prerequisites: ["optimization-2", "calculus-5"],
    theory: [
      {
        heading: "Searching without seeing the bowl",
        body: "For a real model the objective cannot be plotted. At the current parameters all we have is local information: the current objective value and the slope. Gradient descent is the search method that uses only that.",
      },
      {
        heading: "One step",
        body: "Start at w = 0 on L(w) = (w − 3)². The loss there is 9. The gradient is dL/dw = 2(w − 3) = −6. The gradient points uphill, so the negative gradient points downhill, the direction in which the loss decreases. Here −gradient = +6, so we should move to the right.",
      },
      {
        heading: "The update rule",
        body: "w_new = w_old − η × gradient. The symbol η (eta) is the learning rate, a small number that sets how big a step to take; the next checkpoint studies it. With η = 0.1: w_new = 0 − 0.1 × (−6) = 0.6, and the loss falls from 9 to 5.76.",
      },
      {
        heading: "Repeat",
        body: "At the new point recompute the gradient (−4.8) and step again: w = 1.08, then 1.464, 1.771, and so on. The gradient shrinks as the ground flattens, so the steps shrink too, and w creeps toward 3 where the gradient is 0. After 10 steps w ≈ 2.68 and the loss is about 0.10.",
      },
      {
        heading: "Gradient vs gradient descent, and ML",
        body: "The gradient is local information: a direction and a sensitivity. Gradient descent is the repeated procedure that uses the negative gradient to update the parameters. Training a model is exactly this loop, using the gradient of the training objective, until the loss stops improving.",
      },
    ],
    learnMore:
      "Worked example: the iterates are w = 0, 0.6, 1.08, 1.464, 1.771, 2.017, ... because each step multiplies the distance to the minimum by 0.8 (that is, 1 − 2η for η = 0.1). The loss shrinks by a factor of 0.64 per step.",
    python: `def loss(w):
    return (w - 3) ** 2

def grad(w):
    return 2 * (w - 3)

w, lr = 0.0, 0.1
print(0, round(w, 3), round(loss(w), 3))
for step in range(1, 11):
    w = w - lr * grad(w)                  # step AGAINST the gradient
    print(step, round(w, 3), round(loss(w), 3))
# 0 0.0 9.0
# 1 0.6 5.76
# 2 1.08 3.686
# ...
# 10 2.678 0.104`,
    quickCheck: {
      question: "At the current weight the gradient of the loss is +4. What does gradient descent do to the weight?",
      options: [
        "It decreases the weight, because it moves opposite to the gradient",
        "It increases the weight, because the gradient is positive",
        "It leaves the weight unchanged, because the gradient is not zero",
        "It sets the weight to 4",
      ],
      correctIndex: 0,
      explanation:
        "The update is w_new = w_old − η × gradient. With a positive gradient the weight goes down, because a positive gradient means the loss rises as w rises, so the downhill direction is to the left.",
    },
  },
  {
    id: "optimization-4",
    title: "Learning Rate",
    subtitle: "How big a step to take along the downhill direction",
    prerequisites: ["optimization-3"],
    theory: [
      {
        heading: "Direction versus size",
        body: "The negative gradient tells us which way to move. The learning rate η decides how far: the step is η × gradient. The same direction can be followed with a tiny step or a giant leap, and that choice matters. We keep the same objective L(w) = (w − 3)² and the same start w = 0 for every example below.",
      },
      {
        heading: "Too small",
        body: "With η = 0.02 each step moves only a little. After 10 steps w is only about 1.0 and the loss is still about 4. Training is safe but painfully slow: you would need hundreds of steps.",
      },
      {
        heading: "A good rate",
        body: "With η = 0.3 the first steps land at 1.8, 2.52, 2.81 and after 5 steps w ≈ 2.97 with a loss near 0.001. Progress is quick, and the steps shrink as we approach the minimum.",
      },
      {
        heading: "Too large: overshoot",
        body: "With η = 0.9 the first step jumps from 0 to 5.4, past the minimum. The next goes back to 1.08, then 4.54, then 1.77. It bounces from side to side. Here each bounce is smaller, so it still converges slowly, but it wastes steps.",
      },
      {
        heading: "Too large: divergence",
        body: "With η = 1.1 the steps are 6.6, −1.32, 8.18, −3.22: each bounce is bigger than the last and the loss grows. For this objective any η above 1 diverges. The safe range depends on how curved the objective is. In practice you watch the loss curve: falling too slowly, raise η; bouncing or growing, lower it.",
      },
    ],
    learnMore:
      "Worked example: for this objective each step multiplies the distance to the minimum by (1 − 2η). That factor is 0.96 for η = 0.02 (slow), 0.4 for η = 0.3 (fast), −0.8 for η = 0.9 (alternating sign: overshoot) and −1.2 for η = 1.1 (magnitude above 1: divergence).",
    python: `def grad(w):
    return 2 * (w - 3)

def run(lr, steps=10, w=0.0):
    path = [w]
    for _ in range(steps):
        w = w - lr * grad(w)
        path.append(w)
    return path

for lr in [0.02, 0.3, 0.9, 1.1]:
    path = run(lr)
    print(lr, [round(v, 2) for v in path[:5]], round((path[-1] - 3) ** 2, 3))
# 0.02 [0.0, 0.12, 0.24, 0.35, 0.45] 3.978
# 0.3 [0.0, 1.8, 2.52, 2.81, 2.92] 0.0
# 0.9 [0.0, 5.4, 1.08, 4.54, 1.77] 0.104
# 1.1 [0.0, 6.6, -1.32, 8.18, -3.22] 345.038`,
    quickCheck: {
      question: "On L(w) = (w − 3)² a run with learning rate 1.1 produces the weights 0, 6.6, −1.32, 8.18, −3.22, ... What is happening?",
      options: [
        "It is converging: the weights are closing in on the minimum",
        "The gradient points the wrong way, so the sign of the update is wrong",
        "The steps are too large: each update overshoots by more than the last, so the loss keeps growing (divergence)",
        "The learning rate is too small, so w moves slowly",
      ],
      correctIndex: 2,
      explanation:
        "The direction is right (it alternates around the minimum) but the step is far too big: every update lands farther away than before, so the loss grows. A smaller learning rate is needed.",
    },
  },
  {
    id: "optimization-5",
    title: "Gradient Descent in Multiple Dimensions",
    subtitle: "Updating every parameter at once, using the gradient vector",
    prerequisites: ["optimization-4", "calculus-6"],
    theory: [
      {
        heading: "Many parameters",
        body: "Real models have many parameters. With two, the objective L(w1, w2) = (w1 − 3)² + 2(w2 − 1)² is a surface over the (w1, w2) plane. Viewed from above, contours join points with equal loss, like rings on a map, and the minimum sits in the middle at (3, 1). With thousands of parameters we cannot draw the surface, but the idea is exactly the same.",
      },
      {
        heading: "The gradient vector",
        body: "The gradient has one partial derivative per parameter: ∇L = [2(w1 − 3), 4(w2 − 1)]. At the point (1, 3) the loss is 12 and the gradient is [−4, 8]. It points uphill; the negative gradient [4, −8] points downhill.",
      },
      {
        heading: "Update every parameter at once",
        body: "θ_new = θ_old − η ∇L(θ), where θ = (w1, w2) is the parameter vector. With η = 0.1 the point (1, 3) moves to (1 + 0.4, 3 − 0.8) = (1.4, 2.2), and the loss falls from 12 to 5.44. Each parameter moves by its own partial derivative, all in the same step.",
      },
      {
        heading: "The path",
        body: "Repeating gives (1.72, 1.72), then (1.98, 1.43), and so on, curving toward (3, 1). It curves because w2 is the steeper direction: the distance to its minimum shrinks by a factor of 0.6 per step while for w1 it shrinks by 0.8. Gradient descent follows the downhill direction at each point, not a straight line to the minimum.",
      },
      {
        heading: "Why it matters for ML",
        body: "Training a model with many weights is exactly this update applied to all weights at once, using the gradient of the training objective. When features are on very different scales the surface is stretched into long thin ellipses, which makes the path zigzag; this is one reason features are often standardized.",
      },
    ],
    learnMore:
      "Worked example: from (1, 3) with η = 0.1 the successive points are (1.4, 2.2), (1.72, 1.72), (1.976, 1.432), (2.181, 1.259), with losses 5.44, 2.68, 1.42, 0.81. The loss falls at every step, and the path bends toward (3, 1).",
    python: `def grad(w1, w2):
    return [2 * (w1 - 3), 4 * (w2 - 1)]

def loss(w1, w2):
    return (w1 - 3) ** 2 + 2 * (w2 - 1) ** 2

w1, w2, lr = 1.0, 3.0, 0.1
print(0, round(w1, 3), round(w2, 3), round(loss(w1, w2), 3))
for step in range(1, 5):
    g1, g2 = grad(w1, w2)
    w1, w2 = w1 - lr * g1, w2 - lr * g2        # update both parameters together
    print(step, round(w1, 3), round(w2, 3), round(loss(w1, w2), 3))
# 0 1.0 3.0 12.0
# 1 1.4 2.2 5.44
# 2 1.72 1.72 2.675
# 3 1.976 1.432 1.422
# 4 2.181 1.259 0.805`,
    quickCheck: {
      question: "At the current point the gradient of a two-parameter loss is [−6, 8] and the learning rate is η = 0.1. How does gradient descent update (w1, w2)?",
      options: [
        "Only w2 changes, because it has the larger partial derivative",
        "w1 decreases by 0.6 and w2 increases by 0.8",
        "Both parameters move by 0.1 in the direction of the gradient",
        "w1 increases by 0.6 and w2 decreases by 0.8, both in the same step",
      ],
      correctIndex: 3,
      explanation:
        "Each parameter is updated by θ_new = θ_old − η × gradient: w1 changes by −0.1 × (−6) = +0.6 and w2 by −0.1 × 8 = −0.8, simultaneously.",
    },
  },
  {
    id: "optimization-6",
    title: "Taylor Series and Optimization",
    subtitle: "Why a local model of the objective guides every step",
    prerequisites: ["optimization-5", "calculus-7"],
    theory: [
      {
        heading: "Why look at local models",
        body: "An optimizer only knows the objective near its current point. The Taylor approximations from the Calculus module let us build a simple model of the objective around that point, and use it to reason about which step is useful. We use the same objective L(w) = (w − 3)² at w = 0, where L = 9, the slope is L' = −6 and the curvature is L'' = 2.",
      },
      {
        heading: "First order: the slope only",
        body: "L(w + Δ) ≈ L(w) + L'(w) Δ. At w = 0 this reads L ≈ 9 − 6Δ. The first-order model says the loss keeps falling the further we go in the downhill direction. Gradient descent is built on this first-order picture.",
      },
      {
        heading: "Second order: add the bend",
        body: "Add the curvature term: L(w + Δ) ≈ L(w) + L'(w) Δ + ½ L''(w) Δ². Here L ≈ 9 − 6Δ + Δ². Unlike the first-order line, this model has a bottom: it is lowest at Δ = 3, where it predicts a loss of 0.",
      },
      {
        heading: "Compare the predictions",
        body: "For the gradient-descent step Δ = 0.6 the first-order model predicts 5.4, the second-order model 5.76, and the true loss is 5.76. For a giant step Δ = 6 the first-order model predicts −27, which is impossible for a squared loss, while the second-order model predicts 9, and 9 is the true value: the huge step overshoots and gains nothing. Curvature tells us how far a step can be trusted.",
      },
      {
        heading: "What optimizers do with it",
        body: "First-order methods such as gradient descent use only the slope, so they rely on small steps. Second-order information describes the local geometry and can suggest better steps: for this bowl the step Δ = −L'/L'' = 3 lands exactly on the minimum. That is the idea behind Newton's method, mentioned only briefly here. Computing curvature costs much more, especially with many parameters.",
      },
    ],
    learnMore:
      "Worked example at w = 0, steps Δ = 0.6, 3 and 6: the first-order predictions are 5.4, −9 and −27, the second-order predictions are 5.76, 0 and 9, and the true losses are 5.76, 0 and 9. Because this loss is a quadratic, the second-order model matches it exactly.",
    python: `def loss(w):
    return (w - 3) ** 2

w = 0.0
slope, curve = 2 * (w - 3), 2            # L'(0) = -6 and L''(0) = 2

def first_order(d):
    return loss(w) + slope * d

def second_order(d):
    return loss(w) + slope * d + 0.5 * curve * d ** 2

for d in [0.6, 3.0, 6.0]:
    print(d, round(first_order(d), 2), round(second_order(d), 2), round(loss(w + d), 2))
# 0.6 5.4 5.76 5.76
# 3.0 -9.0 0.0 0.0
# 6.0 -27.0 9.0 9.0`,
    quickCheck: {
      question: "A first-order model of the loss predicts that the loss keeps falling for ever larger steps, while a second-order model predicts a minimum at a finite step. What does the second-order model add?",
      options: [
        "The sign of the gradient",
        "Information about how the slope changes (curvature), which limits how far a step can be trusted",
        "A guarantee that the step finds the global minimum of any objective",
        "A larger learning rate",
      ],
      correctIndex: 1,
      explanation:
        "The first-order model knows only the slope. The curvature term describes how the slope changes, so the model can bend back up, which shows that a very large step is not worthwhile.",
    },
  },
  {
    id: "optimization-7",
    title: "Convex Sets",
    subtitle: "Shapes where the straight line between two members never leaves the shape",
    prerequisites: ["optimization-6"],
    theory: [
      {
        heading: "Why shapes matter in optimization",
        body: "Sometimes we may only choose from allowed solutions, a feasible set. Whether that set is well behaved depends on its shape. This lesson is about the shape of sets. Convex functions, a different idea, come next.",
      },
      {
        heading: "The segment test",
        body: "Pick any two points in the set and draw the straight segment between them. A set is convex if the segment always stays inside the set, for every pair of points. A disk passes the test: connect any two points and the segment remains inside. A ring (a disk with a hole) fails: join two points on opposite sides and the segment crosses the hole.",
      },
      {
        heading: "The formula",
        body: "The points on the segment between x and y are λx + (1 − λ)y for 0 ≤ λ ≤ 1: λ = 1 is x, λ = 0 is y and λ = 0.5 is the midpoint. A set C is convex if all of these points are in C whenever x and y are. Example: x = (−2.5, 0) and y = (2.5, 0) with λ = 0.5 give the midpoint (0, 0).",
      },
      {
        heading: "Examples",
        body: "Convex: a disk, a solid square, a half-plane. Not convex: a ring with a hole, a crescent, two separate blobs. Remember that this is about a set of points; whether a function is convex is a separate question for the next lesson.",
      },
      {
        heading: "Why optimization cares",
        body: "Constraints define the feasible set. If it is convex, moving between two feasible points stays feasible, and together with a convex objective every locally best choice is also the globally best. A non-convex feasible set can have separate pieces or dents that trap a search.",
      },
    ],
    learnMore:
      "Worked example: take the disk of radius 3 and the ring 2 ≤ distance ≤ 3, both centered at the origin. The points (−2.5, 0) and (2.5, 0) lie in both. Their midpoint (0, 0) is in the disk but not in the ring, since its distance 0 is less than 2. One failing pair is enough to show the ring is not convex.",
    python: `from math import hypot

def in_disk(p):
    return hypot(p[0], p[1]) <= 3            # a disk of radius 3

def in_ring(p):
    return 2 <= hypot(p[0], p[1]) <= 3       # a disk with a hole

def point_on_segment(x, y, lam):
    return (lam * x[0] + (1 - lam) * y[0], lam * x[1] + (1 - lam) * y[1])

x, y = (-2.5, 0.0), (2.5, 0.0)
print(in_disk(x), in_disk(y), in_ring(x), in_ring(y))   # True True True True
mid = point_on_segment(x, y, 0.5)
print(mid, in_disk(mid), in_ring(mid))                  # (0.0, 0.0) True False`,
    quickCheck: {
      question: "A feasible region contains the points (−2, 0) and (2, 0), but their midpoint (0, 0) is NOT in the region. What can you conclude?",
      options: [
        "The region is not convex",
        "The region is convex, because both endpoints are inside",
        "The optimization problem has no solution",
        "The objective function is not convex",
      ],
      correctIndex: 0,
      explanation:
        "A convex set must contain the whole segment between any two of its points. The midpoint is on that segment and is missing, so the region is not convex. This says nothing about the objective function.",
    },
  },
  {
    id: "optimization-8",
    title: "Convex Functions",
    subtitle: "Bowl-shaped objectives, and why every valley is the best valley",
    prerequisites: ["optimization-7"],
    theory: [
      {
        heading: "The bowl picture",
        body: "L(w) = (w − 3)² is a bowl. Pick two points on its graph and draw the straight chord between them: the bowl lies below the chord (or on it) everywhere between the points. A function with this property is called convex.",
      },
      {
        heading: "The formula",
        body: "f(λx + (1 − λ)y) ≤ λ f(x) + (1 − λ) f(y) for 0 ≤ λ ≤ 1. The left side is the function's value at a point between x and y; the right side is the height of the chord there. Example: x = 1, y = 5, λ = 0.5. The left side is f(3) = 0 and the right side is ½·4 + ½·4 = 4, and 0 ≤ 4.",
      },
      {
        heading: "The payoff: local is global",
        body: "For a convex function, any local minimum (a point where no nearby point is better) is also a global minimum. With a sensible learning rate, gradient descent on a convex objective cannot get stuck in a worse valley, because there is only one valley bottom.",
      },
      {
        heading: "Contrast: non-convex",
        body: "The function f(w) = (w² − 1)² + 0.3w has two valleys. Its chord between w = −1 and w = 1 lies below the graph at the midpoint (f(0) = 1, chord height 0), so it is not convex. Gradient descent started at w = −2 settles in the left valley (value about −0.31); started at w = 2 it settles in the right valley (value about 0.29). Different answers, and only one is best overall.",
      },
      {
        heading: "Why it matters for ML",
        body: "Linear regression with squared loss has a convex objective, so gradient descent with a suitable learning rate can reach its global minimum. Neural networks have objectives that are generally not convex, with many local minima and flat regions; we still train them, but with fewer guarantees. Do not assume every loss landscape is convex.",
      },
    ],
    learnMore:
      "Worked example: for L(w) = (w − 3)² a second derivative of 2 is positive everywhere, which for a twice-differentiable function of one variable is equivalent to convexity. For f(w) = (w² − 1)² + 0.3w the second derivative 12w² − 4 is negative for |w| < 0.58, where the function bends the wrong way.",
    python: `def f(w):
    return (w - 3) ** 2

x, y, lam = 1.0, 5.0, 0.5
left = f(lam * x + (1 - lam) * y)             # the function between x and y
right = lam * f(x) + (1 - lam) * f(y)         # the chord between x and y
print(left, right, left <= right)             # 0.0 4.0 True

def g(w):
    return (w ** 2 - 1) ** 2 + 0.3 * w        # two valleys

def g_grad(w):
    return 4 * w * (w ** 2 - 1) + 0.3

print(g(0.0), 0.5 * g(-1.0) + 0.5 * g(1.0))   # 1.0 0.0 : the function is ABOVE the chord, so g is not convex

for start in [-2.0, 2.0]:
    w = start
    for _ in range(200):
        w = w - 0.02 * g_grad(w)
    print(start, round(w, 2), round(g(w), 2))
# -2.0 -1.04 -0.31
# 2.0 0.96 0.29`,
    quickCheck: {
      question: "Which statement about convexity is correct?",
      options: [
        "Every machine learning loss landscape is convex, so gradient descent always finds the global minimum",
        "For a convex function, a chord between two points of its graph lies below the function",
        "For a convex function, every local minimum is also a global minimum",
        "A function is convex when its graph has exactly two valleys",
      ],
      correctIndex: 2,
      explanation:
        "That is the key property. The chord of a convex function lies above (or on) its graph, not below. Many ML objectives, such as neural-network losses, are not convex, and a convex function has a single valley, not two.",
    },
  },
  {
    id: "optimization-9",
    title: "Constrained Optimization",
    subtitle: "Finding the best answer among the choices the rules allow",
    prerequisites: ["optimization-8"],
    theory: [
      {
        heading: "Rules on the answer",
        body: "So far every parameter value was allowed. Sometimes it is not: a budget, a limit on weight size, probabilities that must add up to 1. Constrained optimization means minimizing the objective while satisfying the constraints.",
      },
      {
        heading: "Objective, constraint, feasible region",
        body: "Take the objective L(w1, w2) = (w1 − 3)² + 2(w2 − 1)² and the constraint w1 + w2 ≤ 2, a budget on the total weight. The feasible region is the set of points that satisfy the constraint, here everything on or below the line w1 + w2 = 2. Points outside it are infeasible. This feasible region is a convex set (a half-plane).",
      },
      {
        heading: "The best unconstrained point may be forbidden",
        body: "Without the constraint the best point is (3, 1), where L = 0. But 3 + 1 = 4 exceeds the budget of 2, so (3, 1) is infeasible. The answer has to change.",
      },
      {
        heading: "Search the feasible region",
        body: "Among feasible points: (1, 1) has loss 4, (2, 0) has loss 3, (1.5, 0.5) has loss 2.75. Sliding along the boundary line w1 + w2 = 2 the loss is lowest at (5/3, 1/3) ≈ (1.67, 0.33), with loss 8/3 ≈ 2.67. That best point sits on the boundary: the constraint is active, meaning it is doing real work.",
      },
      {
        heading: "Why it matters for ML",
        body: "Constraints appear as limits on the size of weights, budgets and resources, probabilities that must add to 1, and variances that must be non-negative. They are part of the model, not an afterthought. The next two lessons introduce Lagrange multipliers and the KKT conditions as tools for such problems.",
      },
    ],
    learnMore:
      "Worked example: moving along the boundary w1 + w2 = 2, the points (3, −1), (2, 0), (5/3, 1/3), (1, 1) and (0, 2) have losses 8, 3, 2.67, 4 and 11. The loss falls and then rises again, with its lowest value at (5/3, 1/3).",
    python: `def loss(w1, w2):
    return (w1 - 3) ** 2 + 2 * (w2 - 1) ** 2

def feasible(w1, w2):
    return w1 + w2 <= 2                      # the budget constraint

print(loss(3, 1), feasible(3, 1))            # 0 False : the unconstrained optimum is not allowed

grid = [(i / 10, j / 10) for i in range(-30, 61) for j in range(-30, 61)]
allowed = [p for p in grid if feasible(*p)]
best = min(allowed, key=lambda p: loss(*p))
print(best, round(loss(*best), 2))           # (1.7, 0.3) 2.67`,
    quickCheck: {
      question: "The unconstrained minimum of an objective is the point (3, 1), but the constraint is w1 + w2 ≤ 2. What is true about the constrained answer?",
      options: [
        "It is still (3, 1), because constraints do not change which point is best",
        "It must be a feasible point, and it typically lies on the boundary, because the unconstrained optimum is infeasible",
        "It can be any point outside the feasible region",
        "It does not exist",
      ],
      correctIndex: 1,
      explanation:
        "The answer must satisfy the constraint. Since the best unconstrained point is outside the allowed region, the best allowed point is pushed to the boundary of the region.",
    },
  },
  {
    id: "optimization-10",
    title: "Lagrange Multipliers",
    subtitle: "At the best point on a constraint, the objective just touches it",
    prerequisites: ["optimization-9"],
    theory: [
      {
        heading: "An equality constraint",
        body: "Take the constraint w1 + w2 = 2: only points ON the line are allowed. The objective is the same, with elliptical contours around (3, 1). We want the lowest contour that still touches the line.",
      },
      {
        heading: "Walk along the constraint",
        body: "Start on the line at (2, 0), where the loss is 3. Slide along the line toward (5/3, 1/3): the loss falls to 2.67. Slide past it, to (1, 1), and the loss rises again to 4. The best point on the line is where we stop improving.",
      },
      {
        heading: "Tangency",
        body: "At the best point the objective's contour just touches the constraint line: they are tangent. If the contour crossed the line there, sliding along the line a little would reach a lower contour, so the point could not be the best. Tangent means the contour and the line have the same direction at that point.",
      },
      {
        heading: "Parallel gradients",
        body: "A gradient is perpendicular to its contour. If the contour and the constraint are tangent, their gradients lie along the same line: ∇f = λ ∇g for some number λ. At (5/3, 1/3), ∇f = [−8/3, −8/3] and ∇g = [1, 1] (for g = w1 + w2), so λ = −8/3. The number λ is the Lagrange multiplier: it measures how strongly the constraint pushes, and how much the best loss changes if the constraint value moves.",
      },
      {
        heading: "The Lagrangian, and why it matters",
        body: "Combine objective and constraint into one function, L(w1, w2, λ) = f − λ(g − c). Setting all of its partial derivatives to zero gives exactly ∇f = λ∇g together with g = c. (Many books write f + λ(g − c) instead; that only flips the sign of λ.) In ML this is the foundation for fitting models under constraints and, next, for the KKT conditions.",
      },
    ],
    learnMore:
      "Worked example: the best loss on the line w1 + w2 = c is (2/3)(c − 4)². Its rate of change at c = 2 is (4/3)(2 − 4) = −8/3, exactly the multiplier λ = −8/3. Loosening the constraint a little (a larger c) lowers the best achievable loss at that rate.",
    python: `def grad_f(w1, w2):
    return (2 * (w1 - 3), 4 * (w2 - 1))

w1, w2 = 5 / 3, 1 / 3                       # best point on the line w1 + w2 = 2
gf = grad_f(w1, w2)
gg = (1, 1)                                  # gradient of g(w1, w2) = w1 + w2
print(round(w1 + w2, 2))                     # 2.0 : on the constraint
print([round(v, 2) for v in gf])             # [-2.67, -2.67]
lam = gf[0] / gg[0]
print(round(lam, 2), abs(gf[1] - lam * gg[1]) < 1e-9)   # -2.67 True : the gradients are parallel`,
    quickCheck: {
      question: "At the best point on the constraint curve g(x, y) = c, what is true about the contour of the objective f and the constraint curve?",
      options: [
        "The contour crosses the constraint curve at a right angle",
        "The contour is far away from the constraint curve",
        "The constraint has zero gradient there",
        "The contour is tangent to the constraint curve, so ∇f and ∇g are parallel",
      ],
      correctIndex: 3,
      explanation:
        "If the contour crossed the constraint, sliding along the constraint would reach a lower contour. At the optimum they just touch, so their normals, the gradients, point along the same line: ∇f = λ∇g.",
    },
  },
  {
    id: "optimization-11",
    title: "KKT Conditions",
    subtitle: "Constraints that may or may not bite: four conditions at the optimum",
    prerequisites: ["optimization-10"],
    theory: [
      {
        heading: "From equality to inequality",
        body: "Many constraints are limits rather than exact values: w1 + w2 ≤ 2 allows the budget to go unused. The feasible region is now an area, not a line. The Karush-Kuhn-Tucker (KKT) conditions extend the Lagrange idea to this case. We write the constraint as g(w) = w1 + w2 − 2 ≤ 0.",
      },
      {
        heading: "Two situations",
        body: "Case A, budget 2: the unconstrained optimum (3, 1) is outside, so the answer sits on the boundary, where g = 0. The constraint is active. Case B, budget 6: (3, 1) satisfies w1 + w2 = 4 ≤ 6 and is inside the region. The constraint is inactive: delete it and the answer does not change.",
      },
      {
        heading: "The multiplier μ",
        body: "Attach a multiplier μ ≥ 0 to the constraint; it measures how hard the constraint pushes back. In case A the objective wants to go outward, the boundary holds it in, and μ = 8/3, positive. In case B nothing needs holding, so μ = 0. A limit can only push inward, which is why μ cannot be negative.",
      },
      {
        heading: "The four conditions",
        body: "Primal feasibility: g(w) ≤ 0, the point satisfies the constraint. Dual feasibility: μ ≥ 0. Complementary slackness: μ × g(w) = 0, so either the constraint is active (g = 0) or its multiplier is 0. Stationarity: ∇f + μ∇g = 0, the objective's gradient and the active constraint's pull balance. In case A, ∇f = [−8/3, −8/3] and μ∇g = [8/3, 8/3], which add up to zero.",
      },
      {
        heading: "How far they go, and why ML cares",
        body: "Under mild regularity conditions a constrained optimum satisfies these conditions. For convex problems (a convex objective and a convex feasible region) any point that satisfies them is a global minimum. For a non-convex problem they only point to candidates, not guaranteed global optima. KKT conditions underlie support vector machines and many regularized models.",
      },
    ],
    learnMore:
      "Worked example check for case A at (5/3, 1/3) with μ = 8/3: g = 0 (feasible and active), μ ≥ 0, μ × g = 0, and ∇f + μ∇g = [−8/3 + 8/3, −8/3 + 8/3] = [0, 0]. For case B at (3, 1) with μ = 0: g = −2 (feasible, inactive), μ = 0 so μ × g = 0, and ∇f = [0, 0]. Both satisfy all four conditions.",
    python: `def grad_f(w1, w2):
    return (2 * (w1 - 3), 4 * (w2 - 1))

def check(point, budget, mu):
    g = point[0] + point[1] - budget             # the constraint g <= 0
    gf = grad_f(*point)
    stationarity = (gf[0] + mu * 1, gf[1] + mu * 1)     # grad f + mu * grad g, with grad g = (1, 1)
    return {
        "primal feasible (g <= 0)": g <= 1e-9,
        "dual feasible (mu >= 0)": mu >= 0,
        "complementary (mu * g = 0)": abs(mu * g) < 1e-9,
        "stationary": all(abs(s) < 1e-9 for s in stationarity),
    }

print(check((5 / 3, 1 / 3), 2, 8 / 3))   # case A: the constraint is active, mu = 8/3
print(check((3, 1), 6, 0))               # case B: the constraint is inactive, mu = 0`,
    quickCheck: {
      question: "At the solution of a minimization with the constraint g(x) ≤ 0, the constraint turns out to be inactive (g(x) < 0). What does complementary slackness say about its multiplier?",
      options: [
        "The multiplier must be positive",
        "The multiplier must equal g(x)",
        "The multiplier must be zero, so the constraint does not affect the solution",
        "The multiplier must be negative",
      ],
      correctIndex: 2,
      explanation:
        "Complementary slackness says μ × g(x) = 0. If g(x) < 0 the constraint is not binding, so μ must be 0 and the constraint plays no role in the answer.",
    },
  },
];

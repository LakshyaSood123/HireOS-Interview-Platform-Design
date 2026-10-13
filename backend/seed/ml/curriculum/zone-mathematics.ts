// MODULE 3 — Calculus for Learning (8 checkpoints) in Mathematics Meadow.
// Linear Algebra for Machine Learning lives in zone-linear-algebra.ts.
//
// Taught intuition-first around three recurring examples:
//   - a one-weight loss          L(w) = (w - 3)^2
//   - a two-weight loss          L(w1, w2) = (w1 - 3)^2 + 2 (w2 - 1)^2
//   - a one-weight model         prediction = w * x, trained by gradient descent
// Plain readable formulas only; Python is plain (no NumPy). Finite differences are
// always described as numeric estimates, never as symbolic derivatives. Quick Check
// answer positions are deliberately varied.

import type { CheckpointSpec } from "./builder.js";

export const calculusSpecs: CheckpointSpec[] = [
  {
    id: "calculus-1",
    title: "Functions and Continuity",
    subtitle: "Why a small nudge to a model should cause only a small change in its error",
    prerequisites: [],
    theory: [
      {
        heading: "A function is a rule: input in, output out",
        body: "A function takes an input and gives back exactly one output. In machine learning the most important function is the loss: you give it a setting of the model, such as a weight w, and it returns one number saying how wrong the model is. Take L(w) = (w − 3)². Put in w = 2 and you get 1. Put in w = 3 and you get 0, a perfect fit.",
      },
      {
        heading: "Plot it to see its shape",
        body: "Draw w along the bottom and the loss as the height. The result is a smooth bowl whose lowest point sits at w = 3. Learning will mean sliding toward the bottom of a picture like this, so it helps to see the shape first.",
      },
      {
        heading: "Continuous means no jumps",
        body: "A function is continuous when you can draw it without lifting your pen: a tiny change in the input causes only a tiny change in the output. For L(w) = (w − 3)², moving w from 2.00 to 2.01 changes the loss from 1 to about 0.98. Compare a rule that outputs 0 for w below 2 and 1 for w at or above 2. At w = 2 the output jumps by a whole 1 although w barely moved, so that rule is not continuous.",
      },
      {
        heading: "Why learning needs it",
        body: "If the loss could jump, a tiny tweak might change the error wildly, and standing at one point would tell you nothing about which way to go. A smooth, continuous loss lets us feel our way downhill using only what is nearby. That is why models are trained on a smooth loss, even when the thing we finally care about, such as the count of correct predictions, changes in jumps.",
      },
    ],
    learnMore:
      "Worked example: with L(w) = (w − 3)², L(2.00) = 1 and L(2.01) = 0.9801, a change of only 0.0199. Now count how many of 100 emails a spam filter gets right as a threshold w moves: the count can stay at 91 and then suddenly become 92. That count is step-like, while the loss that measures how far each prediction is from its label moves smoothly.",
    python: `def loss(w):
    return (w - 3) ** 2

def step_rule(w):
    # Not continuous: the output jumps from 0 to 1 at w = 2.
    return 0 if w < 2 else 1

print(round(loss(2.00), 4), round(loss(2.01), 4))   # 1.0 0.9801
print(step_rule(1.999), step_rule(2.0))             # 0 1`,
    quickCheck: {
      question: "A model's accuracy jumps from 80% to 85% when one weight changes by 0.0001. Why is that unhelpful for following the error downhill?",
      options: [
        "The weight was too large to begin with",
        "Accuracy can only be measured on training data",
        "A tiny nudge causes a sudden jump, so the nearby change gives no smooth direction to follow",
        "Accuracy is always a smooth curve, so this cannot happen",
      ],
      correctIndex: 2,
      explanation:
        "Following a slope only works when small changes in the input give small, predictable changes in the output. A jump breaks that, which is why training uses a smooth loss instead.",
    },
  },
  {
    id: "calculus-2",
    title: "Derivatives",
    subtitle: "The slope of a curve at one point, and what it tells a model to do",
    prerequisites: ["calculus-1"],
    theory: [
      {
        heading: "Slope between two points",
        body: "Take the loss L(w) = (w − 3)² and pick two points on its curve: w = 1 where L = 4, and w = 2 where L = 1. Draw a straight line through them (a secant). Its slope is the change in output divided by the change in input: (1 − 4) / (2 − 1) = −3. On average the loss falls by 3 for every 1 step of w.",
      },
      {
        heading: "Slide the second point closer",
        body: "Keep the first point at w = 1 and move the second one closer: a gap of 0.5 gives a slope of −3.5, a gap of 0.1 gives −3.9, a gap of 0.001 gives −3.999. The numbers settle toward one value, −4. That value is the steepness of the curve exactly at w = 1.",
      },
      {
        heading: "The derivative is that settled slope",
        body: "The derivative of L at w, written dL/dw, is the slope the secants settle toward as the gap shrinks to zero. It is also the slope of the tangent line, the straight line that just touches the curve at that point. For L(w) = (w − 3)² the power rule gives dL/dw = 2(w − 3), so at w = 1 it is −4, matching the numbers above.",
      },
      {
        heading: "Sign and size",
        body: "If the derivative is negative, raising w lowers the loss. If it is positive, raising w raises the loss. If it is zero, the curve is flat there, as at the bottom of the bowl (w = 3). The size says how sensitive the loss is: a derivative of −4 means a small step in w changes the loss four times as much.",
      },
      {
        heading: "Why a model cares",
        body: "The derivative answers two practical questions at once: which way should this weight move to reduce the loss, and how much does the loss react to it? Every training step starts from that answer.",
      },
    ],
    learnMore:
      "Worked example: at w = 5 the derivative of L(w) = (w − 3)² is 2(5 − 3) = +4, so the loss goes up if w increases and down if w decreases. At w = 3 it is 0, the flat bottom. The code below estimates the slope numerically by nudging w, then compares with the exact formula 2(w − 3).",
    python: `def loss(w):
    return (w - 3) ** 2

def secant_slope(f, w, gap):
    # A numeric estimate: look at two nearby points and divide.
    return (f(w + gap) - f(w)) / gap

for gap in [1.0, 0.5, 0.1, 0.001]:
    print(gap, round(secant_slope(loss, 1.0, gap), 3))
# 1.0 -3.0
# 0.5 -3.5
# 0.1 -3.9
# 0.001 -3.999

def exact_slope(w):
    return 2 * (w - 3)     # worked out by hand with the power rule

print(exact_slope(1.0))    # -4.0`,
    quickCheck: {
      question: "At the current weight the derivative of the loss is +6. What should you do to the weight to lower the loss?",
      options: [
        "Decrease it slightly",
        "Increase it slightly",
        "Leave it, because the loss is already at its minimum",
        "Set it equal to 6",
      ],
      correctIndex: 0,
      explanation:
        "A positive derivative means the loss rises as the weight rises, so moving the weight down lowers the loss. A derivative of exactly 0 would be the flat spot.",
    },
  },
  {
    id: "calculus-3",
    title: "Linear Approximation",
    subtitle: "Zooming in until a curve looks like a straight line",
    prerequisites: ["calculus-2"],
    theory: [
      {
        heading: "Curves look straight up close",
        body: "Zoom far enough into any smooth curve and it looks like a straight line. The loss L(w) = (w − 3)² is a bowl, but in a tiny window around w = 1 it is almost indistinguishable from its tangent line. That line is easy to work with, so we use it as a stand-in for the curve nearby.",
      },
      {
        heading: "The tangent-line recipe",
        body: "Start at a point a. The new value is roughly the old value plus the slope times the step: L(a + h) ≈ L(a) + L'(a) × h. Here a = 1, L(1) = 4 and the slope is −4, so L(1 + h) ≈ 4 − 4h.",
      },
      {
        heading: "Try it on nearby points",
        body: "For a step h = 0.1 the recipe predicts 4 − 0.4 = 3.6, and the true loss L(1.1) is 3.61. For h = 0.5 it predicts 2.0 while the truth is 2.25. The prediction is close, but never exact, because the curve bends away from the line.",
      },
      {
        heading: "The error grows with distance",
        body: "For this loss the gap between truth and prediction is exactly h × h: 0.01, 0.25, 1 and 4 for steps 0.1, 0.5, 1 and 2. Doubling the step makes the error four times bigger. At h = 2 the line predicts −4, which is impossible for a squared loss. The straight-line picture is only trustworthy for small steps.",
      },
      {
        heading: "Why a model cares",
        body: "If you know the current loss and slope, you can predict what a small change to a weight will do without recomputing anything: new loss ≈ old loss + slope × change. This is exactly why training takes small steps. Big steps leave the region where the straight-line prediction holds.",
      },
    ],
    learnMore:
      "Worked example: L(w) = (w − 3)² at a = 1 has L = 4 and slope −4. Step h = 0.1: predicted 3.6, true 3.61, error 0.01. Step h = 1: predicted 0, true 1, error 1. The step was ten times bigger and the error one hundred times bigger.",
    python: `def loss(w):
    return (w - 3) ** 2

def slope(w):
    return 2 * (w - 3)

a = 1.0
for h in [0.1, 0.5, 1.0, 2.0]:
    guess = loss(a) + slope(a) * h      # tangent-line prediction
    truth = loss(a + h)                 # actual loss
    print(h, round(guess, 2), round(truth, 2), round(truth - guess, 2))
# 0.1 3.6 3.61 0.01
# 0.5 2.0 2.25 0.25
# 1.0 0.0 1.0 1.0
# 2.0 -4.0 0.0 4.0`,
    quickCheck: {
      question: "A tangent-line prediction for a step of 0.1 is off by 0.01 on L(w) = (w − 3)². About how far off is it for a step of 1.0?",
      options: [
        "Still about 0.01, because the slope is the same",
        "About 0.1, because the step is ten times bigger",
        "About 0.5",
        "About 1, because the error grows much faster than the step",
      ],
      correctIndex: 3,
      explanation:
        "The error equals the step squared, so a step ten times bigger gives an error one hundred times bigger: 0.01 becomes 1. That is why straight-line predictions are trusted only for small steps.",
    },
  },
  {
    id: "calculus-4",
    title: "Partial Derivatives",
    subtitle: "How the loss reacts to one knob when every other knob is held still",
    prerequisites: ["calculus-3"],
    theory: [
      {
        heading: "Real models have many knobs",
        body: "A model usually has several weights, and the loss depends on all of them at once. Take two weights with L(w1, w2) = (w1 − 3)² + 2(w2 − 1)². At w1 = 1 and w2 = 3 the loss is 4 + 8 = 12. We can no longer ask 'what is the slope?' because the answer depends on which knob we turn.",
      },
      {
        heading: "Change one, hold the other",
        body: "To study w1 alone, freeze w2 at 3 and let only w1 vary. The loss becomes (w1 − 3)² + 8, which is just a one-variable curve we already know how to handle. Then do the same the other way: freeze w1 = 1 and vary w2.",
      },
      {
        heading: "That slope is a partial derivative",
        body: "The slope along one knob, with the others frozen, is a partial derivative. It is written ∂L/∂w1 (read 'partial L, partial w1'). To compute it, treat every other variable as a fixed number. Here ∂L/∂w1 = 2(w1 − 3), which is −4 at w1 = 1, because the 2(w2 − 1)² part is a constant and its slope in w1 is zero. Likewise ∂L/∂w2 = 4(w2 − 1), which is +8 at w2 = 3.",
      },
      {
        heading: "Reading the two numbers",
        body: "∂L/∂w1 = −4 says raising w1 lowers the loss. ∂L/∂w2 = +8 says raising w2 raises the loss, so w2 should go down. Each knob gets its own answer, and w2 reacts twice as strongly as the size of its number suggests, since 8 is larger than 4 in size.",
      },
      {
        heading: "Checking by nudging",
        body: "You can estimate a partial derivative numerically: nudge one weight by a tiny amount, leave the other alone, and divide the change in loss by the nudge. That is a numeric estimate, a check on the formula. It does not replace the formula, and it needs one extra loss evaluation per weight.",
      },
    ],
    learnMore:
      "Worked example: at (w1, w2) = (1, 3), nudge w1 by 0.001 and the loss moves from 12 to about 11.996, so the estimate is −3.999, close to the exact −4. Nudge w2 by 0.001 instead and the loss moves to about 12.008, an estimate of 8.002, close to the exact +8.",
    python: `def L(w1, w2):
    return (w1 - 3) ** 2 + 2 * (w2 - 1) ** 2

def dL_dw1(w1, w2):
    return 2 * (w1 - 3)       # w2 is treated as a constant

def dL_dw2(w1, w2):
    return 4 * (w2 - 1)       # w1 is treated as a constant

print(dL_dw1(1, 3), dL_dw2(1, 3))   # -4 8

# A numeric check: nudge ONE weight, hold the other still.
nudge = 0.001
est1 = (L(1 + nudge, 3) - L(1, 3)) / nudge
est2 = (L(1, 3 + nudge) - L(1, 3)) / nudge
print(round(est1, 3), round(est2, 3))   # -3.999 8.002`,
    quickCheck: {
      question: "For L(w1, w2) = (w1 − 3)² + 2(w2 − 1)², what is ∂L/∂w1 when w1 = 5?",
      options: [
        "2",
        "4",
        "−4",
        "It depends on the value of w2",
      ],
      correctIndex: 1,
      explanation:
        "∂L/∂w1 = 2(w1 − 3) = 2(5 − 3) = 4. The w2 term is held fixed, so it contributes nothing to the slope in the w1 direction.",
    },
  },
  {
    id: "calculus-5",
    title: "Gradients",
    subtitle: "One arrow that says which way is steepest uphill",
    prerequisites: ["calculus-4", "calculus-2"],
    theory: [
      {
        heading: "Bundle the partial derivatives",
        body: "A partial derivative gives the slope along one knob. The gradient bundles all of them into one vector: ∇L = [∂L/∂w1, ∂L/∂w2]. For L(w1, w2) = (w1 − 3)² + 2(w2 − 1)² at (1, 3) that is [−4, 8]. It has one entry per weight, and it lives in the same space as the weights, so it can be drawn as an arrow from the current point.",
      },
      {
        heading: "It points uphill, steepest",
        body: "Of all directions you could step from here, the gradient points the way the loss increases fastest, and its length says how steep that climb is. Here the length is about 8.9 (the square root of 16 + 64). A long gradient means the ground is steep; a short one means it is nearly flat.",
      },
      {
        heading: "Go the opposite way to go down",
        body: "To lower the loss as fast as possible, step opposite the gradient: −∇L = [4, −8]. That says move w1 up a bit and w2 down a lot, which matches what each partial derivative told us separately. Gradient descent is this single idea repeated.",
      },
      {
        heading: "Test it yourself",
        body: "Try several steps of the same small size from (1, 3): one along the gradient, one against it, one along w1 only. The step against the gradient lowers the loss the most. The step along the gradient raises it the most. Sideways steps land in between.",
      },
      {
        heading: "Steepest is not the same as straight at the minimum",
        body: "The minimum of this loss is at (3, 1), which from (1, 3) is the direction [2, −2]. The negative gradient [4, −8] is steeper in w2 because that direction is more sensitive. The gradient only knows the local slope, not where the bottom is. That is fine: you recompute it at every new point.",
      },
    ],
    learnMore:
      "Worked example: from (1, 3) take a step of size 0.1. Along the gradient direction the loss rises by about 0.91, against it falls by about 0.88, and along w1 only it falls by about 0.39. Both gradient moves are close to the gradient length 8.9 times the step 0.1, which is 0.89; the small difference is the curve bending.",
    python: `import math

def L(w1, w2):
    return (w1 - 3) ** 2 + 2 * (w2 - 1) ** 2

def gradient(w1, w2):
    return [2 * (w1 - 3), 4 * (w2 - 1)]

g = gradient(1, 3)
print(g, [-v for v in g])          # [-4, 8] [4, -8]
print(round(math.sqrt(sum(v * v for v in g)), 2))   # 8.94: how steep

def change_after_step(direction, size=0.1):
    length = math.sqrt(direction[0] ** 2 + direction[1] ** 2)
    w1 = 1 + size * direction[0] / length
    w2 = 3 + size * direction[1] / length
    return round(L(w1, w2) - L(1, 3), 2)

print(change_after_step(g))                 # 0.91: along the gradient, loss goes UP
print(change_after_step([-g[0], -g[1]]))    # -0.88: against it, loss goes DOWN
print(change_after_step([1, 0]))            # -0.39: along w1 only`,
    quickCheck: {
      question: "At the current weights the gradient of the loss is [3, −2]. Which move lowers the loss fastest?",
      options: [
        "Move along [3, −2]",
        "Move along [2, 3]",
        "Move along [3, 2]",
        "Move along [−3, 2]",
      ],
      correctIndex: 3,
      explanation:
        "The gradient points uphill, so the fastest way down is the exact opposite direction: [−3, 2].",
    },
  },
  {
    id: "calculus-6",
    title: "Multivariate Functions",
    subtitle: "From a curve to a surface to a model with a thousand weights",
    prerequisites: ["calculus-5"],
    theory: [
      {
        heading: "One variable: a curve",
        body: "With one weight, the loss is a curve: weight along the bottom, loss as the height. This is the picture from the earlier checkpoints, such as L(w) = (w − 3)².",
      },
      {
        heading: "Two variables: a surface",
        body: "Add a second weight and the loss becomes a surface. Every point on the floor is a pair (w1, w2), and the height above it is the loss. L(w1, w2) = (w1 − 3)² + 2(w2 − 1)² is a bowl with its lowest point above (3, 1). Standing on this surface, you can feel a slope in each of two directions.",
      },
      {
        heading: "Contours show the surface from above",
        body: "Looking straight down on that bowl, all the points with the same loss form a loop, like contour lines on a hiking map. These loops are called level sets. Close-together loops mean steep ground. The gradient at any point is perpendicular to the loop through it, pointing across to the next-higher loop.",
      },
      {
        heading: "Many variables: same ideas, bigger list",
        body: "Real models have not two weights but thousands or millions. We cannot draw that surface, but the rules do not change: the weights form a parameter vector w = [w1, w2, …, wn], the loss L(w) is still one number, and the gradient is still a list with one partial derivative per weight.",
      },
      {
        heading: "A small model with three weights",
        body: "Let prediction = w1×x1 + w2×x2 + w3×x3 with inputs x = [1, 2, 3], target y = 6, and weights all starting at 0. The prediction is 0 and the loss (prediction − y)² is 36. Each partial derivative is 2 × (prediction − y) × its input, giving the gradient [−12, −24, −36]. Bigger inputs have bigger influence on the loss.",
      },
    ],
    learnMore:
      "Worked example: with w = [0, 0, 0], x = [1, 2, 3] and y = 6, the prediction error is 0 − 6 = −6. The gradient is 2 × (−6) × [1, 2, 3] = [−12, −24, −36]. All entries are negative, so every weight should increase, and the third (whose input is largest) should move the most.",
    python: `x = [1, 2, 3]
y = 6
w = [0, 0, 0]

def predict(w, x):
    return sum(wi * xi for wi, xi in zip(w, x))

def loss(w):
    return (predict(w, x) - y) ** 2

def gradient(w):
    error = predict(w, x) - y
    return [2 * error * xi for xi in x]   # one entry per weight

print(loss(w))        # 36
print(gradient(w))    # [-12, -24, -36]
print(len(gradient(w)) == len(w))   # True: one entry per weight`,
    quickCheck: {
      question: "A model has 1,000 weights. How many entries does the gradient of its loss have?",
      options: [
        "1,000: one partial derivative for each weight",
        "1, because the loss is a single number",
        "2: a slope and a curvature",
        "None. Gradients can only be found for up to 3 weights",
      ],
      correctIndex: 0,
      explanation:
        "The loss is one number, but the gradient has an entry for every weight, because each weight has its own partial derivative. The rules are the same in any number of dimensions.",
    },
  },
  {
    id: "calculus-7",
    title: "Taylor Approximation",
    subtitle: "Using the slope and the bend to predict a function near a point",
    prerequisites: ["calculus-6"],
    theory: [
      {
        heading: "A curve to approximate",
        body: "Take a curved function f(x) = x³ and the point a = 1, where f(1) = 1. We want a simple formula that predicts f near a without computing the whole function. Taylor approximation builds one in layers: first the value, then the slope, then the bend.",
      },
      {
        heading: "First order: the tangent line",
        body: "Using the value and the slope: f(x) ≈ f(a) + f'(a)(x − a). Here f'(x) = 3x², so f'(1) = 3 and the approximation is 1 + 3(x − 1). This is the straight-line approximation from the earlier checkpoint.",
      },
      {
        heading: "Where first order falls short",
        body: "At x = 1.5 the true value is 3.375, but the tangent line gives 1 + 3 × 0.5 = 2.5. It is off by 0.875 because the real curve is bending upward and the line is not. At x = 2 the line says 4 while the truth is 8.",
      },
      {
        heading: "Second order adds the bend",
        body: "Curvature is how fast the slope itself is changing, measured by the second derivative f''. Here f''(x) = 6x, so f''(1) = 6: the slope is growing. Add the term ½ × f''(a) × (x − a)². At x = 1.5 that is ½ × 6 × 0.25 = 0.75, giving 2.5 + 0.75 = 3.25, much closer to 3.375. At x = 2 you get 1 + 3 + 3 = 7 instead of 4.",
      },
      {
        heading: "Why a model cares",
        body: "A gradient alone is a first-order picture: it knows the slope but not how quickly the slope changes. Curvature tells you how far a gradient step stays trustworthy, and it is the extra information that second-order training methods use. With many weights the curvature becomes a table of second derivatives (called the Hessian); the idea is the same.",
      },
    ],
    learnMore:
      "Worked example: f(x) = x³ near a = 1. At x = 1.2: true 1.728, first order 1.6, second order 1.72. At x = 1.5: true 3.375, first order 2.5, second order 3.25. Adding the curvature term closes most of the gap, and the closer x is to a, the better both approximations are.",
    python: `def f(x):
    return x ** 3

def f_slope(x):
    return 3 * x ** 2

def f_curvature(x):
    return 6 * x

a = 1.0
for x in [1.2, 1.5, 2.0]:
    first = f(a) + f_slope(a) * (x - a)
    second = first + 0.5 * f_curvature(a) * (x - a) ** 2
    print(x, round(f(x), 3), round(first, 3), round(second, 3))
# 1.2 1.728 1.6 1.72
# 1.5 3.375 2.5 3.25
# 2.0 8.0 4.0 7.0`,
    quickCheck: {
      question: "Compared with a straight tangent line, what does the second-order term in a Taylor approximation capture?",
      options: [
        "The value of the function at the point",
        "The slope at the point",
        "How the slope is changing, which is the bend of the curve",
        "The average of the training data",
      ],
      correctIndex: 2,
      explanation:
        "The first-order term already holds the value and the slope. The second-order term adds curvature, how quickly the slope changes, so the approximation follows the bend instead of staying straight.",
    },
  },
  {
    id: "calculus-8",
    title: "Why Gradients Matter in ML",
    subtitle: "Watching a model learn: predict, measure the miss, follow the slope, repeat",
    prerequisites: ["calculus-7", "calculus-5"],
    theory: [
      {
        heading: "A model with one weight",
        body: "Let the model be prediction = w × x. Take input x = 2 and the true answer y = 6. The best weight would be 3, since 3 × 2 = 6. We start with w = 0, so the model predicts 0. This is the whole training problem in miniature.",
      },
      {
        heading: "The loss measures the miss",
        body: "Measure the miss with the squared error: loss = (prediction − y)². At w = 0 the loss is (0 − 6)² = 36. Training means finding the w that makes this number small.",
      },
      {
        heading: "The gradient points the way",
        body: "The slope of the loss with respect to w is 2 × (prediction − y) × x. At w = 0 that is 2 × (−6) × 2 = −24. It is negative, so raising w lowers the loss, and large in size, so the loss is steep here.",
      },
      {
        heading: "The update rule",
        body: "Move the weight a small step against the gradient: w ← w − η × gradient, where η (the learning rate) sets the step size. With η = 0.05, w becomes 0 − 0.05 × (−24) = 1.2, and the loss drops from 36 to 12.96. Repeat: the gradient is now −14.4, w becomes 1.92, and the loss is about 4.67.",
      },
      {
        heading: "Repeat until the slope fades",
        body: "Each step computes a new gradient at the new weight and moves again. The gradients shrink (−24, −14.4, −8.6, …) so the steps shrink too, and w settles near 3 where the gradient is zero and the loss is zero. A learning rate that is too big would overshoot and bounce. This predict, measure, differentiate, update loop is how nearly all of machine learning is trained.",
      },
    ],
    learnMore:
      "Worked example with η = 0.05, starting at w = 0: weights 0, 1.2, 1.92, 2.352, 2.611, … with losses 36, 12.96, 4.666, 1.68, 0.605, … Each loss is about 0.36 times the last, so the loss shrinks fast toward 0 and w approaches 3.",
    python: `x, y = 2, 6
w = 0.0
eta = 0.05            # the learning rate

for step in range(5):
    prediction = w * x
    loss = (prediction - y) ** 2
    gradient = 2 * (prediction - y) * x     # d loss / d w
    print(step, round(w, 3), round(loss, 3), round(gradient, 3))
    w = w - eta * gradient                  # step AGAINST the gradient
# 0 0.0 36.0 -24.0
# 1 1.2 12.96 -14.4
# 2 1.92 4.666 -8.64
# 3 2.352 1.68 -5.184
# 4 2.611 0.605 -3.11`,
    quickCheck: {
      question: "In the update w ← w − η × gradient, the gradient at the current w is −24. What happens to w?",
      options: [
        "It decreases",
        "It increases",
        "It stays the same",
        "It becomes −24",
      ],
      correctIndex: 1,
      explanation:
        "w − η × (−24) = w + 24η, so w goes up. A negative gradient means the loss falls as w rises, and the update follows that direction.",
    },
  },
];

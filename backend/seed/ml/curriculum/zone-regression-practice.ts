// MODULE 7 — Regression in Practice (10 checkpoints) in Optimization Ridge.
//
// One recurring house dataset (size in units of 100 m², price in units of $100k):
//   training houses   (1.0, 2.0) (1.5, 2.8) (2.0, 3.7) (2.5, 4.1) (3.0, 5.2)
//   validation houses (0.75, 1.7) (1.75, 3.3) (3.4, 5.6)
//   test houses       (2.25, 3.9) (2.9, 5.0)            <- locked until the very end
// Residual convention everywhere (matches Optimization for Machine Learning): residual = ŷ − y
// (prediction minus target). Python uses only the standard library; every snippet was executed
// and the output comments match. Quick Check answer positions are deliberately varied.

import type { CheckpointSpec } from "./builder.js";

export const regressionPracticeModuleSpecs: CheckpointSpec[] = [
  {
    id: "regression-practice-1",
    title: "Linear Regression Revisited",
    subtitle: "A line that predicts a number from features",
    prerequisites: [],
    theory: [
      {
        heading: "Predicting a number",
        body: "Regression predicts a number, such as a price, from what we know about a case. The simplest model draws a straight line through the data and reads the prediction off the line. This module follows that one idea from a guessed line to a model we can trust on houses it has never seen.",
      },
      {
        heading: "The house dataset we will keep using",
        body: "Five training houses, with size x in units of 100 m² and price y in units of $100k: (1.0, 2.0), (1.5, 2.8), (2.0, 3.7), (2.5, 4.1), (3.0, 5.2). Bigger houses cost more, but not perfectly: the points lie close to a line, not exactly on it. Every lesson in this module reuses these houses.",
      },
      {
        heading: "The model: weight, bias, prediction",
        body: "A linear model is ŷ = w·x + b. The weight w is the slope (how much the price rises per extra unit of size) and the bias b is the intercept (the predicted price at size 0). Together w and b are the model's parameters. Try the guess w = 1.5, b = 0.5: the predictions for the five houses are 2.0, 2.75, 3.5, 4.25 and 5.0.",
      },
      {
        heading: "Residuals: prediction minus target",
        body: "For each house the residual is r = ŷ − y, the prediction minus the true price. A positive residual means the line is too high for that house, a negative one means too low. For our guess the residuals are 0, −0.05, −0.2, +0.15 and −0.2. A good line leaves small residuals, but we have not yet said how to turn five residuals into one score. That is the next lesson.",
      },
      {
        heading: "Takeaway",
        body: "A linear regression is a line ŷ = w·x + b with two parameters. Changing w tilts the line and changing b slides it up or down. Residuals ŷ − y show how far each house sits from the line. Training means choosing w and b so that the residuals are small overall.",
      },
    ],
    learnMore:
      "Worked example: with w = 1.5 and b = 0.5 a house of size 2.2 gets the prediction 1.5 × 2.2 + 0.5 = 3.8, that is $380k. The house at size 2.0 costs 3.7 but is predicted 3.5, so its residual is 3.5 − 3.7 = −0.2: the line is $20k too low there.",
    python: `sizes = [1.0, 1.5, 2.0, 2.5, 3.0]     # size, in units of 100 m^2
prices = [2.0, 2.8, 3.7, 4.1, 5.2]    # price, in units of $100k

def predict(x, w, b):
    return w * x + b

w, b = 1.5, 0.5                       # our first guess at a line
for x, y in zip(sizes, prices):
    y_hat = predict(x, w, b)
    print(x, y, y_hat, round(y_hat - y, 2))
# 1.0 2.0 2.0 0.0
# 1.5 2.8 2.75 -0.05
# 2.0 3.7 3.5 -0.2
# 2.5 4.1 4.25 0.15
# 3.0 5.2 5.0 -0.2

y_hat = predict(2.2, w, b)            # a house not in the table
print(round(y_hat, 2))                # 3.8`,
    quickCheck: {
      question: "For a house of size 2.5 the true price is 4.1 and the line predicts ŷ = 4.25. What is the residual (ŷ − y), and what does it say?",
      options: [
        "−0.15: the line predicts too low for this house",
        "+0.15, and it means the line is accurate because the number is small",
        "+0.15: the line predicts $15k too high for this house",
        "4.25: the residual is simply the prediction",
      ],
      correctIndex: 2,
      explanation:
        "Residual = prediction − target = 4.25 − 4.1 = +0.15. A positive residual means the prediction is above the true price, here by 0.15 × $100k = $15k. The sign tells the direction of the miss; the size tells how big it is.",
    },
  },
  {
    id: "regression-practice-2",
    title: "Mean Squared Error",
    subtitle: "A single number summarizing prediction errors",
    prerequisites: ["regression-practice-1"],
    theory: [
      {
        heading: "Five residuals are too many to compare",
        body: "To choose between two lines we need one number per line. Adding the residuals does not work, because positives and negatives cancel: a line that is too high on one house and too low on another could look perfect. We need every miss to count, whichever way it points.",
      },
      {
        heading: "Predict, subtract, square, average",
        body: "Take the guess w = 1.5, b = 0.5 on our five houses. Residuals ŷ − y: 0, −0.05, −0.2, 0.15, −0.2. Squares: 0, 0.0025, 0.04, 0.0225, 0.04. Their sum is 0.105 and the average over 5 houses is 0.021. That average is the mean squared error, MSE = (1/n) Σ (ŷᵢ − yᵢ)².",
      },
      {
        heading: "Prediction, residual, loss and MSE are different things",
        body: "The prediction ŷ is the model's answer for one house. The residual ŷ − y is that answer's signed miss. The loss for one house is a rule applied to the miss; for squared error it is (ŷ − y)². The MSE is the average of those per-house losses over the whole dataset. Squaring removes the sign and punishes large misses far more than small ones: a miss of 0.2 costs 0.04, a miss of 0.4 costs 0.16.",
      },
      {
        heading: "MSE ranks candidate lines",
        body: "The guess w = 1.5, b = 0.5 has MSE 0.021. The line w = 1.0, b = 1.0 has MSE 0.476 and the line w = 2.0, b = 0.0 has 0.316. The first is clearly better. MSE is a convenient and smooth choice, not a law of nature: it is sensitive to outliers, and other losses, such as absolute error, are sometimes better.",
      },
      {
        heading: "Takeaway",
        body: "MSE turns many residuals into one score: lower is better, zero would be a perfect fit. Because it is a smooth function of w and b, we can ask how to lower it, which is exactly the optimization problem of the previous module. Next we do that with a few lines of plain Python.",
      },
    ],
    learnMore:
      "Worked example: sum of squares 0 + 0.0025 + 0.04 + 0.0225 + 0.04 = 0.105, divided by n = 5 gives MSE = 0.021. MSE is in squared units ($100k squared here), so people often quote its square root, which is back in price units.",
    python: `sizes = [1.0, 1.5, 2.0, 2.5, 3.0]
prices = [2.0, 2.8, 3.7, 4.1, 5.2]

def mse(w, b):
    residuals = [(w * x + b) - y for x, y in zip(sizes, prices)]   # prediction - target
    squares = [r * r for r in residuals]
    return residuals, squares, sum(squares) / len(squares)

residuals, squares, score = mse(1.5, 0.5)
print([round(r, 2) for r in residuals])   # [0.0, -0.05, -0.2, 0.15, -0.2]
print([round(s, 4) for s in squares])     # [0.0, 0.0025, 0.04, 0.0225, 0.04]
print(round(sum(squares), 4), round(score, 4))   # 0.105 0.021

print(round(mse(1.0, 1.0)[2], 4))         # 0.476  (a worse line)
print(round(mse(2.0, 0.0)[2], 4))         # 0.316  (also worse)`,
    quickCheck: {
      question: "Line A misses four houses by +0.5, −0.5, +0.5 and −0.5. Line B misses one house by 1.5 and the other three exactly. Which line has the lower MSE?",
      options: [
        "Line A: its MSE is 0.25, while Line B's is 0.5625, because squaring punishes the single large miss",
        "Line B: its total absolute miss, 1.5, is smaller than Line A's, 2.0",
        "They are equal: the residuals of Line A cancel to zero, just as Line B's average is small",
        "Line B: three perfect predictions out of four outweigh one miss",
      ],
      correctIndex: 0,
      explanation:
        "Line A: four squares of 0.25 average to 0.25. Line B: one square of 2.25 averaged over 4 houses gives 0.5625. Line B has the smaller total absolute miss, yet the worse MSE, because squaring makes one big miss cost more than several small ones. Cancelling signs is exactly what MSE avoids.",
    },
  },
  {
    id: "regression-practice-3",
    title: "Linear Regression from Scratch",
    subtitle: "Fitting a line with plain arithmetic",
    prerequisites: ["regression-practice-2"],
    theory: [
      {
        heading: "Start anywhere and improve",
        body: "We want the w and b with the lowest MSE. One way to find them is to start from any guess, say w = 0 and b = 0, and repeatedly nudge the parameters in the direction that lowers the MSE. This is gradient descent, from the previous module, applied to our house data.",
      },
      {
        heading: "The gradients of MSE",
        body: "With residuals rᵢ = ŷᵢ − yᵢ over n houses, MSE = (1/n) Σ rᵢ². Its slopes are ∂MSE/∂w = (2/n) Σ rᵢ·xᵢ and ∂MSE/∂b = (2/n) Σ rᵢ. If the line is too high on average, the mean residual is positive, the gradient for b is positive, and moving against it lowers b.",
      },
      {
        heading: "The update loop",
        body: "Each round does: predict, compute residuals, compute both gradients, then update w ← w − η·∂MSE/∂w and b ← b − η·∂MSE/∂b. Here η is the learning rate, the size of each step. Using η = 0.1 and starting from w = 0, b = 0, the first round gives w = 1.578, b = 0.712 and an MSE of 0.1122. Later rounds settle down: after 500 rounds w = 1.54, b = 0.48, MSE 0.0166.",
      },
      {
        heading: "What the picture shows",
        body: "The first line is flat at zero and far from every house. After one step it already passes near the cloud of points. Later steps make only small corrections until the line stops moving. The step size matters: too large and the parameters overshoot, too small and training is slow.",
      },
      {
        heading: "Takeaway",
        body: "Linear regression can be trained with nothing but loops and arithmetic: predict, measure, compute gradients, update, repeat. Gradient descent reaches the same line whichever sensible start we use. The next lesson shows that for this particular model the answer can also be written down directly.",
      },
    ],
    learnMore:
      "Worked example of one round from w = 0, b = 0: all predictions are 0, so residuals equal −y = −2.0, −2.8, −3.7, −4.1, −5.2. The mean residual is −3.56, so ∂MSE/∂b = 2 × (−3.56) = −7.12 and b moves to 0 − 0.1 × (−7.12) = 0.712.",
    python: `sizes = [1.0, 1.5, 2.0, 2.5, 3.0]
prices = [2.0, 2.8, 3.7, 4.1, 5.2]
n = len(sizes)

w, b = 0.0, 0.0
lr = 0.1                                   # learning rate (eta)
for epoch in range(1, 501):
    residuals = [(w * x + b) - y for x, y in zip(sizes, prices)]   # prediction - target
    grad_w = 2 / n * sum(r * x for r, x in zip(residuals, sizes))
    grad_b = 2 / n * sum(residuals)
    w = w - lr * grad_w
    b = b - lr * grad_b
    if epoch in (1, 2, 10, 100, 500):
        loss = sum(((w * x + b) - y) ** 2 for x, y in zip(sizes, prices)) / n
        print(epoch, round(w, 3), round(b, 3), round(loss, 4))
# 1 1.578 0.712 0.1122
# 2 1.451 0.65 0.0206
# 10 1.472 0.631 0.0191
# 100 1.527 0.508 0.0167
# 500 1.54 0.48 0.0166`,
    quickCheck: {
      question: "Midway through training, most residuals (ŷ − y) are positive: the line sits above most houses. What does the update for the bias b do, and why?",
      options: [
        "b increases, because a positive residual means the model needs more output",
        "b stays the same, because only the weight w is trained",
        "b increases, because gradient descent always adds the gradient",
        "b decreases, because the gradient is positive and each step moves against the gradient",
      ],
      correctIndex: 3,
      explanation:
        "∂MSE/∂b = (2/n) Σ r is positive when most residuals ŷ − y are positive. The update is b ← b − η × gradient, so b falls and the whole line slides down toward the houses. Gradient descent subtracts the gradient; it never adds it.",
    },
  },
  {
    id: "regression-practice-4",
    title: "Closed-Form Least Squares",
    subtitle: "Solving the whole regression in one step",
    prerequisites: ["regression-practice-3", "linear-algebra-5"],
    theory: [
      {
        heading: "Can we skip the loop?",
        body: "Gradient descent walked toward the best line. For linear regression the best line can also be computed directly. At the minimum of MSE both gradients are zero, and setting them to zero gives ordinary equations that we can solve in one go. That is least squares in closed form.",
      },
      {
        heading: "One feature: two formulas",
        body: "With the means x̄ and ȳ, the best weight is w = Σ (xᵢ − x̄)(yᵢ − ȳ) / Σ (xᵢ − x̄)² and the best bias is b = ȳ − w·x̄. On our five houses x̄ = 2.0, ȳ = 3.56, and the result is w = 1.54, b = 0.48, with MSE 0.0166: exactly where gradient descent ended up.",
      },
      {
        heading: "The same thing as a small linear system",
        body: "Write each house as a row [x, 1] of a feature matrix X and the prices as a target vector y. Zero gradients become the normal equations (XᵀX)·[w, b] = Xᵀy. For one feature this is the 2×2 system n·b + (Σx)·w = Σy and (Σx)·b + (Σx²)·w = Σxy, here 5b + 10w = 17.8 and 10b + 22.5w = 39.45. Its determinant is 5 × 22.5 − 10 × 10 = 12.5, and solving by hand gives w = 1.54, b = 0.48 again.",
      },
      {
        heading: "What the picture shows",
        body: "Geometrically, the prices form a vector and the columns of X span a flat surface of all possible line predictions. Least squares picks the point of that surface closest to the price vector, a projection. The gap left over, the residual vector, is perpendicular to the surface.",
      },
      {
        heading: "Closed form versus gradient descent",
        body: "Neither is universally better. The closed form is exact and needs no learning rate, but with many features it requires solving a big system, and real libraries use more careful numerical methods than forming an explicit inverse. Gradient descent scales to huge data and works for models that have no closed form. They minimize the same MSE, so on this problem they agree.",
      },
    ],
    learnMore:
      "Worked example: Σx = 10, Σx² = 22.5, Σy = 17.8, Σxy = 39.45. Then w = (5 × 39.45 − 10 × 17.8) / 12.5 = 19.25 / 12.5 = 1.54 and b = (22.5 × 17.8 − 10 × 39.45) / 12.5 = 6.0 / 12.5 = 0.48.",
    python: `sizes = [1.0, 1.5, 2.0, 2.5, 3.0]
prices = [2.0, 2.8, 3.7, 4.1, 5.2]
n = len(sizes)

# One-feature closed form with means
mean_x = sum(sizes) / n
mean_y = sum(prices) / n
w = sum((x - mean_x) * (y - mean_y) for x, y in zip(sizes, prices)) / sum((x - mean_x) ** 2 for x in sizes)
b = mean_y - w * mean_x
print(round(w, 4), round(b, 4))           # 1.54 0.48

# The same answer from the 2x2 normal equations, solved by hand
sx, sy = sum(sizes), sum(prices)
sxx = sum(x * x for x in sizes)
sxy = sum(x * y for x, y in zip(sizes, prices))
det = n * sxx - sx * sx
w2 = (n * sxy - sx * sy) / det
b2 = (sxx * sy - sx * sxy) / det
print(n, sx, sxx, sy, sxy)                # 5 10.0 22.5 17.8 39.45
print(det)                                # 12.5
print(round(w2, 4), round(b2, 4))         # 1.54 0.48
loss = sum(((w2 * x + b2) - y) ** 2 for x, y in zip(sizes, prices)) / n
print(round(loss, 4))                     # 0.0166`,
    quickCheck: {
      question: "Closed-form least squares gave w = 1.54, b = 0.48 in one calculation, and 500 steps of gradient descent landed on the same line. What is the right conclusion?",
      options: [
        "Closed form is always better, so gradient descent is never needed",
        "Both minimize the same MSE so they agree here; closed form needs no learning rate, but gradient descent still matters for huge data and models with no closed form",
        "Gradient descent is more accurate, because it improves a little at every step",
        "The match is a coincidence of this small dataset",
      ],
      correctIndex: 1,
      explanation:
        "Both methods find the minimum of the same convex MSE, so they agree up to rounding. The closed form is exact and has no learning rate, yet it becomes costly or delicate with very many features, and many models have no closed form at all. Neither method is universally better.",
    },
  },
  {
    id: "regression-practice-5",
    title: "Gaussian Noise Interpretation",
    subtitle: "Why squared error is a principled choice",
    prerequisites: ["regression-practice-4", "estimation-uncertainty-2"],
    theory: [
      {
        heading: "Why squares?",
        body: "We chose squared error because it is smooth and convenient, but there is a deeper reason. Suppose the true prices follow an underlying line and each observation is that line plus a small random disturbance: y = w·x + b + ε. Squared error is exactly what falls out of one natural assumption about ε.",
      },
      {
        heading: "Noise on our houses",
        body: "Take the underlying line w = 1.5, b = 0.5. Subtracting it from the observed prices leaves the noise 0.0, 0.05, 0.2, −0.15 and 0.2: small, both positive and negative, and clustered near zero. Each house has its own random disturbance, and we only ever see line plus noise, never the line itself.",
      },
      {
        heading: "Gaussian noise",
        body: "Assume every ε is drawn independently from a Gaussian (bell-shaped) distribution with mean 0 and the same spread σ. Small disturbances are then common and large ones rare. Given a candidate line, the likelihood of the observed prices is the product of one bell-curve height per house. Maximizing a likelihood is the same as minimizing its negative log.",
      },
      {
        heading: "The connection to MSE",
        body: "Taking the negative log of that product gives −log L = (n/2)·log(2πσ²) + Σ (yᵢ − ŷᵢ)² / (2σ²). With σ fixed, the first term is a constant and the second is the sum of squared residuals divided by a constant, so the line that maximizes the Gaussian likelihood is the line that minimizes MSE. With σ = 0.2, the line w = 1.0, b = 1.0 scores a negative log-likelihood of 26.3, the guess w = 1.5, b = 0.5 scores −2.14 and the fitted line w = 1.54, b = 0.48 scores −2.41, the lowest of the three.",
      },
      {
        heading: "Takeaway, and a caution",
        body: "Least squares is maximum likelihood under independent Gaussian noise of constant spread. That explains why MSE is a principled default. It is not a universal truth: if the noise has heavy tails, with occasional huge outliers, or its spread changes with house size, the assumption fails and another loss may be better.",
      },
    ],
    learnMore:
      "Worked example with σ = 0.2: the guess w = 1.5, b = 0.5 has sum of squared residuals 0.105, so the second term is 0.105 / (2 × 0.04) = 1.3125. The fitted line has 0.083 / 0.08 ≈ 1.04. The constant first term is identical for both, so only the squared residuals decide the ranking.",
    python: `import math
sizes = [1.0, 1.5, 2.0, 2.5, 3.0]
prices = [2.0, 2.8, 3.7, 4.1, 5.2]

true_w, true_b = 1.5, 0.5                 # the underlying line we imagine
noise = [y - (true_w * x + true_b) for x, y in zip(sizes, prices)]
print([round(e, 2) for e in noise])       # [0.0, 0.05, 0.2, -0.15, 0.2]

def nll(w, b, sigma=0.2):
    # negative log-likelihood of the prices under Gaussian noise with spread sigma
    sse = sum(((w * x + b) - y) ** 2 for x, y in zip(sizes, prices))
    return len(sizes) / 2 * math.log(2 * math.pi * sigma ** 2) + sse / (2 * sigma ** 2)

for w, b in [(1.0, 1.0), (1.5, 0.5), (1.54, 0.48)]:
    sse = sum(((w * x + b) - y) ** 2 for x, y in zip(sizes, prices))
    print(w, b, round(sse, 3), round(nll(w, b), 2))
# 1.0 1.0 2.38 26.3
# 1.5 0.5 0.105 -2.14
# 1.54 0.48 0.083 -2.41     <- smallest squared error, smallest negative log-likelihood`,
    quickCheck: {
      question: "Two lines are fitted to the same houses. Their sums of squared residuals are 0.105 and 0.083. Assuming independent Gaussian noise with the same σ for every house, which line has the higher likelihood, and why?",
      options: [
        "The line with 0.105, because larger residuals leave more room for noise",
        "They have the same likelihood, because both lines see the same houses",
        "The line with 0.083, because with σ fixed the negative log-likelihood is a constant plus the squared residuals over 2σ²",
        "Neither can be compared, because the true noise is unknown",
      ],
      correctIndex: 2,
      explanation:
        "With σ fixed, −log L = constant + SSE / (2σ²). A smaller sum of squared residuals gives a smaller negative log-likelihood, hence a higher likelihood. That is why least squares equals maximum likelihood under constant-spread Gaussian noise. We do not need the true noise values to compare lines, only the assumption.",
    },
  },
  {
    id: "regression-practice-6",
    title: "Overfitting",
    subtitle: "When extra flexibility fits the noise",
    prerequisites: ["regression-practice-5"],
    theory: [
      {
        heading: "A model can be too eager",
        body: "A flexible model can bend to pass through every training point, including the random noise in them. On the training houses it looks perfect, but the noise will not repeat on new houses. Fitting the noise instead of the pattern is overfitting.",
      },
      {
        heading: "Three models on the same five houses",
        body: "A flat model that always predicts the average price (3.56) is too simple: underfitting. The straight line from the previous lessons has training MSE 0.0166. A degree-4 polynomial has five parameters for five houses, so it can hit every training price exactly: training MSE 0.0.",
      },
      {
        heading: "Judge a model on houses it has not seen",
        body: "Hold back three validation houses that were not used for fitting: (0.75, 1.7), (1.75, 3.3), (3.4, 5.6). The line has validation MSE 0.0111, even lower than its training MSE. The degree-4 curve predicts 2.32, 3.32 and 8.54 for them, against true prices 1.7, 3.3 and 5.6, and its validation MSE is 3.0073. Training error 0.0 against validation error 3.0073 is the signature of overfitting.",
      },
      {
        heading: "Overfitting is a gap, not a high error",
        body: "A model with high error everywhere, like the flat average, is underfitting, not overfitting. Overfitting means low error on the training data but much higher error on new data: the gap between the two. Training error alone can never reveal it, which is why we need held-out data.",
      },
      {
        heading: "Takeaway",
        body: "More flexibility lowers training error but can raise validation error. Compare training and validation error: both high means underfit, low training with high validation means overfit, both low means a good fit. The cure is to restrain the model, which is where regularization and honest validation come in.",
      },
    ],
    learnMore:
      "Worked example: at size 3.4, beyond the training range, the degree-4 curve predicts 8.54 while the true price is 5.6, a residual of 2.94 that alone contributes 8.64 to the sum of squares over three houses. Wild swings between and beyond the training points are typical of an over-flexible fit.",
    python: `def solve(A, rhs):                        # Gaussian elimination, written by hand
    n = len(A)
    M = [A[i][:] + [rhs[i]] for i in range(n)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(c + 1, n):
            f = M[r][c] / M[c][c]
            M[r] = [M[r][k] - f * M[c][k] for k in range(n + 1)]
    out = [0.0] * n
    for r in range(n - 1, -1, -1):
        out[r] = (M[r][n] - sum(M[r][k] * out[k] for k in range(r + 1, n))) / M[r][r]
    return out

def features(x, degree):
    z = x - 2.0                           # centre the size so the powers stay small
    return [z ** k for k in range(degree + 1)]

def fit_poly(data, degree):               # least squares via the normal equations
    X = [features(x, degree) for x, _ in data]
    p = degree + 1
    A = [[sum(row[i] * row[j] for row in X) for j in range(p)] for i in range(p)]
    rhs = [sum(row[i] * y for row, (_, y) in zip(X, data)) for i in range(p)]
    return solve(A, rhs)

def predict_poly(beta, x):
    return sum(c * f for c, f in zip(beta, features(x, len(beta) - 1)))

def mse(predict, data):
    return sum((predict(x) - y) ** 2 for x, y in data) / len(data)

train = [(1.0, 2.0), (1.5, 2.8), (2.0, 3.7), (2.5, 4.1), (3.0, 5.2)]
valid = [(0.75, 1.7), (1.75, 3.3), (3.4, 5.6)]

n = len(train)
mx = sum(x for x, _ in train) / n
my = sum(y for _, y in train) / n
w = sum((x - mx) * (y - my) for x, y in train) / sum((x - mx) ** 2 for x, _ in train)
b = my - w * mx
line = lambda x: w * x + b
curve_beta = fit_poly(train, 4)
curve = lambda x: predict_poly(curve_beta, x)

print("line  train", round(mse(line, train), 4), "validation", round(mse(line, valid), 4))
# line  train 0.0166 validation 0.0111
print("curve train", round(mse(curve, train), 4), "validation", round(mse(curve, valid), 4))
# curve train 0.0 validation 3.0073
print([round(curve(x), 2) for x in (0.75, 1.75, 3.4)])   # [2.32, 3.32, 8.54]
print([y for _, y in valid])                              # [1.7, 3.3, 5.6]`,
    quickCheck: {
      question: "Model A has training MSE 0.00 and validation MSE 3.0. Model B has training MSE 0.017 and validation MSE 0.011. Which diagnosis is correct?",
      options: [
        "Model A is overfitting: it matches the training houses perfectly but fails on new ones, while Model B generalizes",
        "Model B is overfitting, because its training error is not zero",
        "Both are overfitting, because both have nonzero error somewhere",
        "Model A is the better model, because it has the lowest training error",
      ],
      correctIndex: 0,
      explanation:
        "Overfitting is low training error together with much higher error on unseen data. Model A's gap, 0.00 against 3.0, shows it learned the noise. Model B has small errors on both sets, so it generalizes. Having some error is normal and does not mean overfitting, and training error alone cannot rank models.",
    },
  },
  {
    id: "regression-practice-7",
    title: "Ridge Regularization",
    subtitle: "Penalizing large weights to tame flexible models",
    prerequisites: ["regression-practice-6"],
    theory: [
      {
        heading: "Restrain the model instead of shrinking it",
        body: "The overfit degree-4 curve swings wildly because its weights are large. Ridge regularization keeps the flexible model but makes large weights expensive. The trade is deliberate: a slightly worse fit to the training houses in return for a smoother, more trustworthy curve.",
      },
      {
        heading: "Loss versus objective",
        body: "The loss is still the squared error. The ridge objective is larger: objective = MSE + λ · Σ w², the MSE plus a penalty on the squared weights. We minimize the objective, not the MSE alone. The bias (intercept) is normally left out of the penalty. The penalty is the sum of squares of the curve weights; the more the curve bends, the more it pays.",
      },
      {
        heading: "λ is a dial, and a different one from η",
        body: "The regularization strength λ ≥ 0 sets the price of large weights. λ = 0 is plain least squares. A huge λ squashes every weight toward zero and leaves a nearly flat model. λ is a hyperparameter we choose, not something the fit learns. It is not the learning rate η, which sets step size in gradient descent, and not a Lagrange multiplier from constrained optimization, though it plays a similar role of pricing a constraint.",
      },
      {
        heading: "What λ does on our houses",
        body: "Degree-4 curve on the five training houses, validation on the three held-out houses. λ = 0: train 0.0, validation 3.0073, weight penalty Σw² = 4.73. λ = 0.01: train 0.0061, validation 0.7002. λ = 0.3: train 0.091, validation 0.0822, Σw² = 0.752. λ = 1: train 0.3507, validation 0.2282. λ = 10: train 1.018, validation 1.9712, Σw² = 0.009. Larger λ shrinks the weights and raises training error, while validation error first falls and then rises.",
      },
      {
        heading: "Takeaway",
        body: "Ridge trades training fit for smaller weights. Too small a λ leaves the overfit curve, too large a λ underfits (λ = 10 does worse than λ = 0.3 on both sets). The right λ is found with held-out data. Note that the plain straight line, with validation MSE 0.0111, is still better than every ridge curve here: regularization helps a flexible model but cannot beat a model that already suits the data.",
      },
    ],
    learnMore:
      "Worked example at λ = 0.3: the training MSE is 0.091 and the penalty is 0.3 × 0.752 = 0.2255, so the objective being minimized is 0.091 + 0.2255 = 0.3165. The fit pays 0.091 of training error to cut the weight penalty from 4.73 (at λ = 0) to 0.752.",
    python: `def solve(A, rhs):
    n = len(A)
    M = [A[i][:] + [rhs[i]] for i in range(n)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(c + 1, n):
            f = M[r][c] / M[c][c]
            M[r] = [M[r][k] - f * M[c][k] for k in range(n + 1)]
    out = [0.0] * n
    for r in range(n - 1, -1, -1):
        out[r] = (M[r][n] - sum(M[r][k] * out[k] for k in range(r + 1, n))) / M[r][r]
    return out

def features(x, degree):
    z = x - 2.0
    return [z ** k for k in range(degree + 1)]

def fit_ridge(data, degree, lam):
    # minimizes MSE + lam * (sum of squared weights); the intercept (index 0) is not penalized
    X = [features(x, degree) for x, _ in data]
    n, p = len(X), degree + 1
    A = [[sum(row[i] * row[j] for row in X) + (lam * n if i == j and i > 0 else 0.0) for j in range(p)] for i in range(p)]
    rhs = [sum(row[i] * y for row, (_, y) in zip(X, data)) for i in range(p)]
    return solve(A, rhs)

def predict_poly(beta, x):
    return sum(c * f for c, f in zip(beta, features(x, len(beta) - 1)))

def mse(beta, data):
    return sum((predict_poly(beta, x) - y) ** 2 for x, y in data) / len(data)

train = [(1.0, 2.0), (1.5, 2.8), (2.0, 3.7), (2.5, 4.1), (3.0, 5.2)]
valid = [(0.75, 1.7), (1.75, 3.3), (3.4, 5.6)]

# columns: lam, train MSE, penalty, objective, validation MSE, sum of squared weights
for lam in [0.0, 0.01, 0.3, 1.0, 10.0]:
    beta = fit_ridge(train, 4, lam)
    penalty = lam * sum(c * c for c in beta[1:])
    print(lam, round(mse(beta, train), 4), round(penalty, 4), round(mse(beta, train) + penalty, 4), round(mse(beta, valid), 4), round(sum(c * c for c in beta[1:]), 3))
# 0.0 0.0 0.0 0.0 3.0073 4.73
# 0.01 0.0061 0.016 0.0221 0.7002 1.604
# 0.3 0.091 0.2255 0.3165 0.0822 0.752
# 1.0 0.3507 0.2957 0.6464 0.2282 0.296
# 10.0 1.018 0.0883 1.1063 1.9712 0.009`,
    quickCheck: {
      question: "A ridge curve with λ = 10 has training MSE 1.018, validation MSE 1.97 and almost zero weights, while λ = 0.3 gave 0.091 and 0.082. What has gone wrong, and what should you do?",
      options: [
        "The learning rate η is too large, so reduce η",
        "The model is overfitting, so increase λ further",
        "The Lagrange multiplier is wrong, so solve the constraint again",
        "λ is so large that the weights are crushed and the model underfits; lower λ and compare validation error",
      ],
      correctIndex: 3,
      explanation:
        "Both training and validation errors are high and the weights are nearly zero: the penalty overwhelms the data, so the model underfits. Lower λ and choose it by validation error. λ is a hyperparameter that prices large weights; it is not the learning rate η and not a Lagrange multiplier.",
    },
  },
  {
    id: "regression-practice-8",
    title: "Train / Validation Split",
    subtitle: "Choosing a model fairly",
    prerequisites: ["regression-practice-7", "ml-foundations-4"],
    theory: [
      {
        heading: "Fair judging needs data the model has not met",
        body: "A model always looks good on the data it was fitted to. To choose fairly among models we split the available houses into separate roles: a training set to fit parameters, a validation set to compare models and tune hyperparameters, and a test set kept locked away until the very end for one final honest score.",
      },
      {
        heading: "Our split",
        body: "Eight houses are available for development: five for training, (1.0, 2.0), (1.5, 2.8), (2.0, 3.7), (2.5, 4.1), (3.0, 5.2), and three for validation, (0.75, 1.7), (1.75, 3.3), (3.4, 5.6). Two more, (2.25, 3.9) and (2.9, 5.0), form the test set. We do not look at them yet.",
      },
      {
        heading: "Parameters versus hyperparameters",
        body: "Parameters, such as w and b, are learned from the training set. Hyperparameters, such as the polynomial degree or the ridge strength λ, are chosen by us, by comparing validation scores. If we also tuned them on the training set we would always pick the most flexible setting, which fits the noise best.",
      },
      {
        heading: "Compare on validation",
        body: "Fit a constant average-price model and a straight line on the training houses. Training MSE: constant 1.2024, line 0.0166. Validation MSE: constant 2.5629, line 0.0111. The line wins on validation. The overfit curve from the Overfitting lesson, with validation 3.0073, would have lost. We pick the line, and the test houses stay locked.",
      },
      {
        heading: "Takeaway",
        body: "Fit on the training set, choose on the validation set, report once on the test set. Each time we choose using the validation set we use up a little of its honesty, so its score becomes slightly optimistic. The test set is the only score that was never used for a decision, so it must be touched exactly once, at the end.",
      },
    ],
    learnMore:
      "Worked example: the validation MSE of the line is the average of the squared residuals on the three held-out houses, about 0.0111. The same line scores 0.0166 on its own training houses, so validation, not training, is the number to use for choosing between models.",
    python: `train = [(1.0, 2.0), (1.5, 2.8), (2.0, 3.7), (2.5, 4.1), (3.0, 5.2)]
valid = [(0.75, 1.7), (1.75, 3.3), (3.4, 5.6)]
# test = [(2.25, 3.9), (2.9, 5.0)]   <- locked: not used anywhere in this lesson

def mse(predict, data):
    return sum((predict(x) - y) ** 2 for x, y in data) / len(data)

def fit_constant(data):
    m = sum(y for _, y in data) / len(data)
    return lambda x: m

def fit_line(data):
    n = len(data)
    mx = sum(x for x, _ in data) / n
    my = sum(y for _, y in data) / n
    w = sum((x - mx) * (y - my) for x, y in data) / sum((x - mx) ** 2 for x, _ in data)
    b = my - w * mx
    return lambda x: w * x + b

models = {"constant": fit_constant(train), "line": fit_line(train)}   # parameters learned on train only
for name, model in models.items():
    print(name, round(mse(model, train), 4), round(mse(model, valid), 4))
# constant 1.2024 2.5629
# line 0.0166 0.0111
best = min(models, key=lambda name: mse(models[name], valid))         # choose on validation
print(best)                                                           # line`,
    quickCheck: {
      question: "You tried twenty model settings, picked the one with the lowest validation MSE, and plan to report that validation MSE as how well it will do on future houses. What is the problem?",
      options: [
        "None: validation data was not used for fitting, so its score is unbiased",
        "The score is optimistic, because the validation set was used to choose the winner; a locked test set scored once is needed for an honest estimate",
        "The validation set is too small to be used at all",
        "You should have chosen using training error instead, to avoid using validation twice",
      ],
      correctIndex: 1,
      explanation:
        "Validation data was not used to fit parameters, but it was used to choose among twenty settings, and the best of many noisy scores is biased low. A test set that was never used for any decision, scored once, gives the honest estimate. Choosing by training error would reward overfitting.",
    },
  },
  {
    id: "regression-practice-9",
    title: "K-Fold Cross Validation",
    subtitle: "Using every example for both fitting and checking",
    prerequisites: ["regression-practice-8"],
    theory: [
      {
        heading: "One validation set can be unlucky",
        body: "With only a few houses, a single validation split can flatter or punish a model by chance, depending on which houses landed in it. We also hate to leave valuable data out of fitting. K-fold cross validation uses every development house for both jobs, in turn.",
      },
      {
        heading: "Make K folds",
        body: "Take the eight development houses (training plus validation) and deal them into K = 4 folds of two houses each. Fold 1: (1.0, 2.0), (3.0, 5.2). Fold 2: (1.5, 2.8), (0.75, 1.7). Fold 3: (2.0, 3.7), (1.75, 3.3). Fold 4: (2.5, 4.1), (3.4, 5.6). The two locked test houses are not in any fold.",
      },
      {
        heading: "Rotate the validation fold",
        body: "Round 1: fit the model on folds 2, 3, 4 and score it on fold 1. Round 2: fit on folds 1, 3, 4, score on fold 2. Continue until every fold has been the validation fold exactly once. For the straight line the four validation MSEs are 0.0264, 0.0004, 0.0252 and 0.0914.",
      },
      {
        heading: "Average, then decide",
        body: "The cross-validation score is the average of the K validation scores: 0.0359 for the straight line. The spread of the four scores also tells us how sensitive the result is to which houses were held out. Each round trains a different model, so none of the four is the final model: after choosing, we refit on all development data. The folds are not the test set.",
      },
      {
        heading: "Takeaway",
        body: "K-fold gives a steadier estimate than one split and uses all development data, at the price of fitting K models instead of one. Use it to compare models and hyperparameters; the locked test set is still reserved for the single final check.",
      },
    ],
    learnMore:
      "Worked example of round 1: remove fold 1, fit a line to the other six houses, then average the squared residuals on (1.0, 2.0) and (3.0, 5.2). That is the first score, 0.0264. Averaging the four rounds: (0.0264 + 0.0004 + 0.0252 + 0.0914) / 4 = 0.0359.",
    python: `dev = [(1.0, 2.0), (1.5, 2.8), (2.0, 3.7), (2.5, 4.1), (3.0, 5.2), (0.75, 1.7), (1.75, 3.3), (3.4, 5.6)]
K = 4
folds = [[dev[i] for i in range(len(dev)) if i % K == k] for k in range(K)]
for k, fold in enumerate(folds):
    print(k + 1, fold)
# 1 [(1.0, 2.0), (3.0, 5.2)]
# 2 [(1.5, 2.8), (0.75, 1.7)]
# 3 [(2.0, 3.7), (1.75, 3.3)]
# 4 [(2.5, 4.1), (3.4, 5.6)]

def mse(predict, data):
    return sum((predict(x) - y) ** 2 for x, y in data) / len(data)

def fit_line(data):
    n = len(data)
    mx = sum(x for x, _ in data) / n
    my = sum(y for _, y in data) / n
    w = sum((x - mx) * (y - my) for x, y in data) / sum((x - mx) ** 2 for x, _ in data)
    b = my - w * mx
    return lambda x: w * x + b

scores = []
for k in range(K):
    validation_fold = folds[k]
    training = [p for j in range(K) if j != k for p in folds[j]]   # the other K-1 folds
    model = fit_line(training)
    scores.append(mse(model, validation_fold))
print([round(s, 4) for s in scores])      # [0.0264, 0.0004, 0.0252, 0.0914]
print(round(sum(scores) / K, 4))          # 0.0359`,
    quickCheck: {
      question: "Four-fold cross validation scored one model 0.0264, 0.0004, 0.0252 and 0.0914. How should these results be used?",
      options: [
        "Keep the model from the round with the best score, 0.0004, as the final model",
        "Report 0.0004 as the expected error, since it is the lowest",
        "Average them (0.0359) to compare this model with others, then refit the chosen model on all development data; the folds are not the test set",
        "Use the largest score, 0.0914, as the true test error",
      ],
      correctIndex: 2,
      explanation:
        "The four rounds each fit a different model on different data, so none of them is the final model, and a single lucky round is not an estimate. The average, 0.0359, is the cross-validation score used to compare candidates. After choosing, refit on all development data and, only then, use the locked test set once.",
    },
  },
  {
    id: "regression-practice-10",
    title: "Model Selection",
    subtitle: "Picking the final model without fooling yourself",
    prerequisites: ["regression-practice-9"],
    theory: [
      {
        heading: "Putting the workflow together",
        body: "Model selection is a procedure for choosing between candidate models and hyperparameters without fooling ourselves. The steps: define the candidates, train each one, score them on validation data (or cross-validation), compare, reject overfitters, choose, lock the choice, and only then test once.",
      },
      {
        heading: "The candidates",
        body: "Five candidates on the eight development houses: the straight line, and the degree-4 curve with ridge strength λ = 0, 0.1, 0.3 and 1. Training error alone would crown the λ = 0 curve with 0.0124, the line's training MSE being 0.0129 on those houses. That would be a mistake.",
      },
      {
        heading: "Compare by cross-validation",
        body: "Four-fold cross-validation MSE: line 0.0359, curve λ = 0 gives 0.3169, λ = 0.1 gives 0.2769, λ = 0.3 gives 0.1662, λ = 1 gives 0.4682. Ridge clearly helps the curve, λ = 0.3 is the best curve, and λ = 1 has begun to underfit. Yet the plain line is better than all of them, so the winner is the line. A simpler model beats a fancier one when the data are genuinely close to a line.",
      },
      {
        heading: "Lock the choice, then test once",
        body: "Once the line is chosen we refit it on all eight development houses and freeze every decision. Only now do we score the two locked test houses, once: test MSE 0.0046. If that number is disappointing we must not go back and tweak the choice using the test set, because it would stop being a test set. It is the final estimate, not another validation round.",
      },
      {
        heading: "Takeaway",
        body: "Train to learn parameters, validate or cross-validate to choose the model and its hyperparameters, test once to report. The best model is the one that generalizes, not the one with the lowest training error or the most flexibility, and MSE is only the score we agreed to use. This is the workflow every later module will rely on.",
      },
    ],
    learnMore:
      "Worked example: the curve with λ = 0 fits all training houses exactly yet has cross-validation MSE 0.3169, almost nine times the line's 0.0359. The refit line scores a test MSE of 0.0046, in the same small range as its validation scores, which is the reassuring sign that the selection did not just fit the validation data.",
    python: `def solve(A, rhs):
    n = len(A)
    M = [A[i][:] + [rhs[i]] for i in range(n)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(c + 1, n):
            f = M[r][c] / M[c][c]
            M[r] = [M[r][k] - f * M[c][k] for k in range(n + 1)]
    out = [0.0] * n
    for r in range(n - 1, -1, -1):
        out[r] = (M[r][n] - sum(M[r][k] * out[k] for k in range(r + 1, n))) / M[r][r]
    return out

def features(x, degree):
    z = x - 2.0
    return [z ** k for k in range(degree + 1)]

def fit_ridge(data, degree, lam):
    X = [features(x, degree) for x, _ in data]
    n, p = len(X), degree + 1
    A = [[sum(row[i] * row[j] for row in X) + (lam * n if i == j and i > 0 else 0.0) for j in range(p)] for i in range(p)]
    rhs = [sum(row[i] * y for row, (_, y) in zip(X, data)) for i in range(p)]
    beta = solve(A, rhs)
    return lambda x: sum(c * f for c, f in zip(beta, features(x, degree)))

def mse(predict, data):
    return sum((predict(x) - y) ** 2 for x, y in data) / len(data)

dev = [(1.0, 2.0), (1.5, 2.8), (2.0, 3.7), (2.5, 4.1), (3.0, 5.2), (0.75, 1.7), (1.75, 3.3), (3.4, 5.6)]
test = [(2.25, 3.9), (2.9, 5.0)]          # locked until the choice is final
K = 4
folds = [[dev[i] for i in range(len(dev)) if i % K == k] for k in range(K)]

candidates = {
    "line": lambda data: fit_ridge(data, 1, 0.0),
    "curve, lambda 0": lambda data: fit_ridge(data, 4, 0.0),
    "curve, lambda 0.1": lambda data: fit_ridge(data, 4, 0.1),
    "curve, lambda 0.3": lambda data: fit_ridge(data, 4, 0.3),
    "curve, lambda 1": lambda data: fit_ridge(data, 4, 1.0),
}

cv = {}
for name, fit in candidates.items():
    scores = []
    for k in range(K):
        training = [p for j in range(K) if j != k for p in folds[j]]
        scores.append(mse(fit(training), folds[k]))
    cv[name] = sum(scores) / K
    print(name, round(cv[name], 4))
# line 0.0359
# curve, lambda 0 0.3169
# curve, lambda 0.1 0.2769
# curve, lambda 0.3 0.1662
# curve, lambda 1 0.4682

chosen = min(cv, key=cv.get)              # choose by cross-validation, never by test
print(chosen)                             # line
final_model = candidates[chosen](dev)     # refit the winner on all development data
print(round(mse(final_model, test), 4))   # 0.0046   (test set scored exactly once)`,
    quickCheck: {
      question: "The final test MSE of the chosen model is 0.0046, but you notice that the second-best candidate might do even better on the test houses. What should you do?",
      options: [
        "Switch to the second-best candidate if its test score is lower, since the test set is the most reliable data",
        "Keep the choice made by cross-validation and report 0.0046; peeking at test scores to choose would turn the test set into another validation set",
        "Re-split the data until the test score looks as good as the validation score",
        "Average the test MSE with the training MSE for a fairer number",
      ],
      correctIndex: 1,
      explanation:
        "The choice was made with cross-validation and then locked. Selecting by test score would use the test set for a decision, so it would no longer give an honest estimate of future performance. Re-splitting until the numbers look good is the same mistake. Report the test result you got, once.",
    },
  },
];

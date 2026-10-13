// MODULE 2 — Linear Algebra for Machine Learning (9 checkpoints).
// Taught intuition-first with one small recurring example per idea. Plain
// readable formulas only; Python uses plain lists (no NumPy). Quick Check
// answer positions are deliberately varied.

import type { CheckpointSpec } from "./builder.js";

export const linearAlgebraSpecs: CheckpointSpec[] = [
  {
    id: "linear-algebra-1",
    title: "Vectors & Matrices",
    subtitle: "How a table of houses becomes numbers a computer can work with",
    prerequisites: [],
    theory: [
      {
        heading: "A scalar is one number",
        body: "A scalar is a single number, such as the area of one house: 1200. One feature of one example is a scalar.",
      },
      {
        heading: "A vector is an ordered list",
        body: "Write one house's features in a fixed order and you get a vector: x = [1200, 2, 10] for area, bedrooms and age. The number of entries is the vector's dimension, so x is 3-dimensional. The order matters: the first entry is always the area.",
      },
      {
        heading: "A matrix is a table of vectors",
        body: "Stack one vector per house, one on each row, and you get a matrix X. With 3 houses and 3 features, X has 3 rows and 3 columns. Row i is house i, and column j is feature j.",
      },
      {
        heading: "The transpose swaps rows and columns",
        body: "The transpose Xᵀ flips the table so rows become columns. The first column of X (every house's area) becomes the first row of Xᵀ. In machine learning, a dataset is exactly this: a matrix with one row per example and one column per feature.",
      },
    ],
    learnMore:
      "Worked example: X = [[1200, 2, 10], [1800, 3, 4], [900, 1, 15]]. Row 2 is the house [1800, 3, 4]. Column 1 is every area: [1200, 1800, 900]. The first row of Xᵀ is that same list of areas.",
    python: `X = [
    [1200, 2, 10],
    [1800, 3, 4],
    [900, 1, 15],
]

print(len(X), len(X[0]))              # 3 3  (rows, columns)
areas = [row[0] for row in X]         # column 1: every area
Xt = [list(col) for col in zip(*X)]   # the transpose
print(areas)                          # [1200, 1800, 900]
print(Xt[0])                          # [1200, 1800, 900]`,
    quickCheck: {
      question: "A dataset has 500 houses, each described by 4 features. What shape is its feature matrix X (rows × columns)?",
      options: ["4 × 500", "500 × 4", "500 × 500", "4 × 4"],
      correctIndex: 1,
      explanation:
        "Each house is one row and each feature is one column, so 500 houses with 4 features give 500 rows and 4 columns.",
    },
  },
  {
    id: "linear-algebra-2",
    title: "Vector Spaces and Subspaces",
    subtitle: "Everything you can reach by scaling and adding vectors",
    prerequisites: ["linear-algebra-1"],
    theory: [
      {
        heading: "Scale and add",
        body: "Two things can be done to vectors: scale them (multiply by a number) and add them. A linear combination uses both: a·v + b·w. For v = [2, 1] and w = [−1, 2], taking a = 1.5 and b = 1 gives [2, 3.5].",
      },
      {
        heading: "The span is everything you can reach",
        body: "The span of some vectors is the set of all their linear combinations. One vector spans a line through the origin. Two vectors that do not point along the same line span the whole plane.",
      },
      {
        heading: "A subspace is a flat space through the origin",
        body: "A subspace is a line, plane or higher-dimensional flat space that contains the origin and never lets you escape: adding two vectors in it, or scaling one, stays inside it. A line through the origin is a subspace of the plane. A line that misses the origin is not.",
      },
      {
        heading: "Why it matters for ML",
        body: "Real data often lies close to a line or plane inside a much bigger feature space. If you can find that subspace, you can describe each example with fewer numbers, which is the idea behind dimensionality reduction.",
      },
    ],
    learnMore:
      "Worked example: with v = [1, 0] and w = [0, 1], any point [a, b] is a·v + b·w, so [3, 4] = 3v + 4w. With only v = [1, 2], you can reach [2, 4] (it is 2v) but not [2, 5]: the span of v is the line y = 2x.",
    python: `def combine(a, v, b, w):
    return [a * x + b * y for x, y in zip(v, w)]

print(combine(3, [1, 0], 4, [0, 1]))   # [3, 4]

# The span of v = [1, 2] is the line y = 2x.
def on_line(p):
    return p[1] == 2 * p[0]

print(on_line([2, 4]), on_line([2, 5]))  # True False`,
    quickCheck: {
      question: "Two vectors in the plane point along the same line (one is a multiple of the other). What do all of their linear combinations form?",
      options: ["The whole plane", "A single point", "A circle around the origin", "A line through the origin"],
      correctIndex: 3,
      explanation:
        "If one vector is a multiple of the other, combining them only ever moves along that one line. To reach the whole plane you need two vectors that point in genuinely different directions.",
    },
  },
  {
    id: "linear-algebra-3",
    title: "Orthogonality",
    subtitle: "The dot product, and what it means for two vectors to be perpendicular",
    prerequisites: ["linear-algebra-2"],
    theory: [
      {
        heading: "The dot product measures agreement",
        body: "Multiply matching entries of two vectors and add: u · v = u₁v₁ + u₂v₂. The result is a single number that says how much the two vectors point the same way. For u = [1, 2] and v = [3, 1], u · v = 3 + 2 = 5.",
      },
      {
        heading: "Positive, negative, zero",
        body: "A positive dot product means the vectors point in broadly the same direction. A negative one means they point in broadly opposite directions. A dot product of exactly zero means they are perpendicular.",
      },
      {
        heading: "Orthogonal means dot product 0",
        body: "Two non-zero vectors are orthogonal when u · v = 0. For u = [1, 0] and v = [0, 1] it is 1·0 + 0·1 = 0. Also [1, 2] · [2, −1] = 2 − 2 = 0. Orthogonal is the mathematical word for perpendicular.",
      },
      {
        heading: "Why ML uses it",
        body: "Orthogonal directions carry independent information: moving along one does not change your position along the other. That makes coordinates easy to read off, and it is what projections, least squares and PCA rely on.",
      },
    ],
    learnMore:
      "Worked example: u = [3, 0] and v = [0, 2.5] give 3·0 + 0·2.5 = 0, so they are orthogonal. Rotate v to [2.5, 0] and the dot product becomes 7.5, the largest value possible for these two lengths.",
    python: `def dot(u, v):
    return sum(a * b for a, b in zip(u, v))

print(dot([1, 2], [3, 1]))      # 5
print(dot([1, 0], [0, 1]))      # 0   (orthogonal)
print(dot([1, 2], [2, -1]))     # 0   (orthogonal)
print(dot([3, 0], [2.5, 0]))    # 7.5 (pointing the same way)`,
    quickCheck: {
      question: "u and v are two non-zero vectors with u · v = 0. What does that tell you?",
      options: [
        "They are perpendicular",
        "They point in the same direction",
        "They have the same length",
        "One of them must be the zero vector",
      ],
      correctIndex: 0,
      explanation:
        "A zero dot product between non-zero vectors means they are orthogonal (perpendicular). It says nothing about their lengths, and neither vector needs to be zero.",
    },
  },
  {
    id: "linear-algebra-4",
    title: "Projections",
    subtitle: "The shadow of one vector along another direction",
    prerequisites: ["linear-algebra-3"],
    theory: [
      {
        heading: "Approximate with one direction",
        body: "Suppose a vector a is complicated, but you may only move along one direction b. The projection of a onto b is the point on that line closest to a: the part of a that points along b, like its shadow.",
      },
      {
        heading: "The residual is perpendicular",
        body: "What is left over, a minus its projection, is the residual. It is perpendicular to b. If it were not, you could slide along b to get closer to a.",
      },
      {
        heading: "The formula comes after the picture",
        body: "The projection is proj = ((a · b) / (b · b)) b. The fraction says how many copies of b you need, and multiplying by b places the point on the line. You do not need to memorize it: it is just the shadow measured with dot products.",
      },
      {
        heading: "The ML connection",
        body: "Projection is the best approximation using limited directions. Least squares projects data onto the predictions a model can make, and PCA projects data onto its main directions.",
      },
    ],
    learnMore:
      "Worked example: a = [4, 3] and b = [5, 2]. a · b = 26 and b · b = 29, so the projection is (26/29)·b ≈ [4.48, 1.79]. The residual is about [−0.48, 1.21], and its dot product with b is 0.",
    python: `def dot(u, v):
    return sum(x * y for x, y in zip(u, v))

def project(a, b):
    scale = dot(a, b) / dot(b, b)
    return [scale * x for x in b]

a, b = [4, 3], [5, 2]
proj = project(a, b)
residual = [p - q for p, q in zip(a, proj)]
print([round(x, 2) for x in proj])        # [4.48, 1.79]
print(round(dot(residual, b), 6))         # 0.0 (perpendicular to b)`,
    quickCheck: {
      question: "What does the projection of a onto b represent?",
      options: [
        "The vector a rotated until it is perpendicular to b",
        "The sum of a and b",
        "The point on the line along b that is closest to a",
        "The length of b scaled by the length of a",
      ],
      correctIndex: 2,
      explanation:
        "The projection is the best approximation of a using only the direction b: the closest point to a on the line along b. The leftover part, the residual, is perpendicular to b.",
    },
  },
  {
    id: "linear-algebra-5",
    title: "Least Squares",
    subtitle: "The best fit when no line is perfect, as a projection",
    prerequisites: ["linear-algebra-4"],
    theory: [
      {
        heading: "No perfect line",
        body: "With real data, no single line usually passes through every point. Instead of demanding a perfect fit, we ask for the best line. For the points (1, 2), (2, 3), (3, 5), (4, 4), no straight line hits all four.",
      },
      {
        heading: "Residuals and squared errors",
        body: "For a candidate line, the residual of each point is actual minus predicted. Square each residual and add them up to get the total squared error. For y = 0.5x + 2 the residuals are −0.5, 0, 1.5, 0 and the total is 2.5.",
      },
      {
        heading: "The best line has the smallest total",
        body: "Try other lines and compare. y = x + 1 gives a total of 2.0, and y = 0.8x + 1.5 gives 1.8. Least squares picks the line with the smallest total squared error: here, y = 0.8x + 1.5.",
      },
      {
        heading: "Why this is a projection",
        body: "Write the model's predictions as A x, where the columns of A hold the inputs (and a column of ones) and x holds the slope and intercept. The vector of data values b cannot be matched exactly by any prediction A x. Least squares picks the prediction closest to b: the projection of b onto the space of possible predictions. The leftover error is perpendicular to that space, which leads to the normal equations AᵀA x = Aᵀb. This is how linear regression is fitted.",
      },
    ],
    learnMore:
      "Worked example: the best line for those four points has slope 0.8 and intercept 1.5. Its residuals are −0.3, −0.1, 1.1 and −0.7. They add up to 0, and their dot product with the x-values is also 0: the residual is perpendicular to the inputs.",
    python: `points = [(1, 2), (2, 3), (3, 5), (4, 4)]

def total_error(m, b):
    return sum((y - (m * x + b)) ** 2 for x, y in points)

for m, b in [(0.5, 2), (1, 1), (0.8, 1.5)]:
    print(m, b, round(total_error(m, b), 2))   # totals: 2.5, 2, 1.8

# The residuals of the best line are perpendicular to the x-values.
residuals = [y - (0.8 * x + 1.5) for x, y in points]
check = sum(r * x for r, (x, _) in zip(residuals, points))
print(abs(check) < 1e-9)   # True: the residuals are perpendicular to the x-values`,
    quickCheck: {
      question: "A least-squares line does not pass through every data point. What does it minimize?",
      options: [
        "The number of points the line touches",
        "The sum of the squared residuals",
        "The largest single residual",
        "The slope of the line",
      ],
      correctIndex: 1,
      explanation:
        "Least squares minimizes the total of the squared residuals. It deliberately accepts some error at each point in exchange for the smallest overall squared error.",
    },
  },
  {
    id: "linear-algebra-6",
    title: "Eigenvalues & Eigenvectors",
    subtitle: "The directions a matrix only stretches, never turns",
    prerequisites: ["linear-algebra-5"],
    theory: [
      {
        heading: "A matrix moves vectors",
        body: "Multiplying by a matrix A transforms vectors: it can rotate, stretch and shear them. For most vectors, both the direction and the length change.",
      },
      {
        heading: "A few directions stay put",
        body: "But for special vectors the result lies on the same line as the original. Such a vector v is an eigenvector of A: A v = λ v. It is only scaled, never turned.",
      },
      {
        heading: "The eigenvalue is the scale factor",
        body: "The number λ is the eigenvalue. λ = 3 means three times as long, λ = 1 means unchanged, a value between 0 and 1 means shrunk, and a negative λ means flipped to the opposite direction.",
      },
      {
        heading: "Why ML cares",
        body: "The covariance matrix of a dataset describes how the data spreads. Its eigenvectors point along the main directions of spread, and its eigenvalues say how much spread there is along each. PCA is built on exactly this.",
      },
    ],
    learnMore:
      "Worked example: A = [[2, 1], [1, 2]]. A·[1, 0] = [2, 1], which points in a different direction. But A·[1, 1] = [3, 3] = 3·[1, 1] and A·[1, −1] = [1, −1] = 1·[1, −1]. So [1, 1] is an eigenvector with λ = 3, and [1, −1] is an eigenvector with λ = 1.",
    python: `A = [[2, 1], [1, 2]]

def apply(A, v):
    return [sum(A[i][j] * v[j] for j in range(len(v))) for i in range(len(A))]

print(apply(A, [1, 0]))    # [2, 1]   direction changed
print(apply(A, [1, 1]))    # [3, 3]   = 3 * [1, 1]
print(apply(A, [1, -1]))   # [1, -1]  = 1 * [1, -1]`,
    quickCheck: {
      question: "What is special about an eigenvector v after it is transformed by A?",
      options: [
        "It becomes the zero vector",
        "It is rotated by exactly 90 degrees",
        "It is always shortened",
        "It stays on the same line through the origin, scaled by its eigenvalue",
      ],
      correctIndex: 3,
      explanation:
        "A v = λ v means the result lies on the same line as v: only its length (and possibly its sign) changes. Other vectors get turned to a new direction.",
    },
  },
  {
    id: "linear-algebra-7",
    title: "Matrix Diagonalization",
    subtitle: "Make a hard transformation simple by changing coordinates",
    prerequisites: ["linear-algebra-6"],
    theory: [
      {
        heading: "The right coordinates make it simple",
        body: "A transformation can look complicated in the usual x-y coordinates but become simple in coordinates built from its eigenvectors, because there it just stretches each axis by a separate amount.",
      },
      {
        heading: "Three moves",
        body: "To apply A to a vector: (1) change coordinates to the eigenvector directions, (2) scale each coordinate by its eigenvalue, (3) change back. As one formula: A = P D P⁻¹.",
      },
      {
        heading: "What D means",
        body: "D is a diagonal matrix: its only non-zero entries are the eigenvalues on the diagonal. Diagonal means each axis is scaled independently, with no mixing. P holds the eigenvectors as its columns, and P⁻¹ changes coordinates into that basis.",
      },
      {
        heading: "Why it is useful",
        body: "Because D is so simple, repeating A many times just scales each axis many times. It also explains the long-run behaviour of a transformation and underlies PCA. Not every matrix can be diagonalized, but the symmetric ones that appear in ML, like covariance matrices, always can.",
      },
    ],
    learnMore:
      "Worked example: A = [[2, 1], [1, 2]] has eigenvectors [1, 1] and [1, −1] with eigenvalues 3 and 1. To apply A to v = [2, 0]: write v = 1·[1, 1] + 1·[1, −1], scale to 3·[1, 1] + 1·[1, −1], and rebuild: [4, 2]. That matches A·v = [4, 2] computed directly.",
    python: `A = [[2, 1], [1, 2]]
e1, e2 = [1, 1], [1, -1]     # eigenvectors
d1, d2 = 3, 1                # their eigenvalues

def dot(u, v):
    return sum(a * b for a, b in zip(u, v))

v = [2, 0]
c1, c2 = dot(v, e1) / 2, dot(v, e2) / 2         # 1. change coordinates
s1, s2 = d1 * c1, d2 * c2                       # 2. scale each coordinate
back = [s1 * e1[i] + s2 * e2[i] for i in range(2)]   # 3. change back
direct = [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]]
print(back, direct)          # [4.0, 2.0] [4, 2]`,
    quickCheck: {
      question: "In A = P D P⁻¹, what does the diagonal matrix D describe?",
      options: [
        "How much each eigenvector direction is stretched, independently of the others",
        "The data you want to predict",
        "A rotation that does not change lengths",
        "The inverse of A",
      ],
      correctIndex: 0,
      explanation:
        "D holds the eigenvalues on its diagonal. In the eigenvector coordinates, A simply stretches each axis by its own eigenvalue, with no mixing between axes.",
    },
  },
  {
    id: "linear-algebra-8",
    title: "Singular Value Decomposition",
    subtitle: "Rotate, stretch, rotate: the shape of every matrix",
    prerequisites: ["linear-algebra-7"],
    theory: [
      {
        heading: "Every matrix is rotate, stretch, rotate",
        body: "Any matrix A can be written A = U Σ Vᵀ. Read right to left: Vᵀ rotates the input, Σ stretches along the axes, and U rotates the result. A circle of vectors becomes an ellipse.",
      },
      {
        heading: "Singular values rank the directions",
        body: "The stretch amounts on the diagonal of Σ are the singular values, σ₁ ≥ σ₂ ≥ …. A large singular value means that direction matters a lot; a tiny one means it barely matters.",
      },
      {
        heading: "Low-rank approximation",
        body: "Keep only the largest singular values and set the rest to zero. This rank-k approximation is the best possible matrix of that simplicity. For A = [[2, 1], [1, 2]], whose singular values are 3 and 1, keeping only σ₁ gives [[1.5, 1.5], [1.5, 1.5]].",
      },
      {
        heading: "Why ML uses it",
        body: "A smaller, cleaner version of the data supports compression, denoising and dimensionality reduction. PCA, covered later in the course, is closely tied to SVD.",
      },
    ],
    learnMore:
      "Worked example: σ₁ = 3 and σ₂ = 1 give 3² / (3² + 1²) = 9/10, so the rank-1 approximation keeps 90% of the matrix's squared size (its 'energy'). Dropping σ₂ throws away the remaining 10%.",
    python: `import math

# For a symmetric matrix [[a, b], [b, d]] with positive eigenvalues,
# the singular values equal the eigenvalues.
a, b, d = 2, 1, 2
gap = math.sqrt((a - d) ** 2 + 4 * b * b)
sigma = [((a + d) + gap) / 2, ((a + d) - gap) / 2]
print(sigma)                                   # [3.0, 1.0]

u = [2 ** -0.5, 2 ** -0.5]                     # direction of the largest stretch
rank1 = [[sigma[0] * p * q for q in u] for p in u]
print([[round(x, 2) for x in row] for row in rank1])   # [[1.5, 1.5], [1.5, 1.5]]
print(sigma[0] ** 2 / sum(s ** 2 for s in sigma))      # 0.9`,
    quickCheck: {
      question: "What does a large singular value indicate?",
      options: [
        "That direction carries almost no information",
        "The data in that direction is just noise",
        "The transformation stretches strongly along that direction, so it matters more",
        "The matrix cannot be transformed",
      ],
      correctIndex: 2,
      explanation:
        "Singular values are the stretch amounts. A large one means the matrix magnifies that direction strongly, so it carries a lot of the matrix's effect. Small singular values are the ones safe to drop.",
    },
  },
  {
    id: "linear-algebra-9",
    title: "Positive Definite Matrices",
    subtitle: "Matrices that curve upward in every direction",
    prerequisites: ["linear-algebra-8"],
    theory: [
      {
        heading: "The quadratic form",
        body: "For a matrix A and a vector x, the number xᵀ A x is called a quadratic form. For A = [[2, 0], [0, 1]] it equals 2x₁² + x₂². At x = [1, 1] it is 3.",
      },
      {
        heading: "Positive in every direction",
        body: "A symmetric matrix A is positive definite if xᵀ A x > 0 for every non-zero x. Imagine the value as a height: positive everywhere means the surface curves up in every direction, like a bowl with one lowest point.",
      },
      {
        heading: "Eigenvalues give a quick test",
        body: "For a symmetric matrix, being positive definite is the same as having all eigenvalues positive. A = [[2, 0], [0, 1]] has eigenvalues 2 and 1, so it is positive definite. B = [[1, 0], [0, −1]] has eigenvalues 1 and −1, so it is not: xᵀ B x = x₁² − x₂² is negative along the second axis, which gives a saddle.",
      },
      {
        heading: "Why ML cares",
        body: "Covariance matrices are positive (semi-)definite. In optimization, positive curvature in every direction means a stable minimum, so gradient descent settles there. A saddle is a place where it can get stuck.",
      },
    ],
    learnMore:
      "Worked example: for B = [[1, 0], [0, −1]], x = [1, 0] gives 1 but x = [0, 1] gives −1. One negative value is enough to rule out positive definiteness.",
    python: `def quad_form(A, x):
    return sum(x[i] * A[i][j] * x[j] for i in range(len(x)) for j in range(len(x)))

A = [[2, 0], [0, 1]]
B = [[1, 0], [0, -1]]
print(quad_form(A, [1, 1]))                      # 3
print(quad_form(A, [1, 0]), quad_form(A, [0, 1]))   # 2 1   (both positive)
print(quad_form(B, [1, 0]), quad_form(B, [0, 1]))   # 1 -1  (one negative: a saddle)`,
    quickCheck: {
      question: "A symmetric matrix has eigenvalues 3 and −1. Is it positive definite?",
      options: [
        "Yes, because one eigenvalue is positive",
        "No, because one eigenvalue is negative",
        "Yes, because the eigenvalues add up to a positive number",
        "Only if the matrix is also diagonal",
      ],
      correctIndex: 1,
      explanation:
        "Positive definite needs every eigenvalue to be positive. A negative eigenvalue means some direction curves downward, so the matrix is not positive definite.",
    },
  },
];

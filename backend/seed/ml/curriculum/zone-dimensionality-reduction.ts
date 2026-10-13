// MODULE 12 — Dimensionality Reduction (9 checkpoints) in Unsupervised Valley.
//
// Recurring dataset: 6 customers (usage frequency, monthly spend) = (2,1.5) (3,2.5) (4,2.5) (5,4.5) (6,4.0) (7,6.0).
// Convention everywhere: covariance divides by n - 1 (S = Xc' Xc / 5). Means (4.5, 3.5); S = [[3.5, 2.9], [2.9, 2.7]];
// eigenvalues 6.0275 / 0.1725; PC1 explains 97.2%; sigma = sqrt(lambda * 5). Python uses only the standard library; every
// snippet was executed and its real output is appended as comments.

import type { CheckpointSpec } from "./builder.js";

export const dimensionalityReductionModuleSpecs: CheckpointSpec[] = [
  {
    id: "dimensionality-reduction-1",
    title: "Why Reduce Dimensions?",
    subtitle: "Fewer numbers per example, most of the structure kept",
    prerequisites: [],
    theory: [
      {
        heading: "Many features, many dimensions",
        body: "Each feature of an example is one dimension. A customer described by 2 numbers is a point on a plane; one described by 40 numbers is a point in a 40-dimensional space we cannot picture. Real tables often have dozens or thousands of columns.",
      },
      {
        heading: "Features are often redundant",
        body: "Columns frequently carry overlapping information. Take 6 customers with two features: usage frequency (visits per week) and monthly spend. Customers who visit more also spend more, and the correlation between the two columns is 0.94. Two columns, but largely one underlying story: how engaged the customer is.",
      },
      {
        heading: "Why compress",
        body: "Fewer dimensions can make data easier to visualize, faster to process and cheaper to store. It can also remove noise and reduce the risk of overfitting, because a model with fewer inputs has fewer ways to chase accidental patterns. Very high-dimensional spaces are also sparse: points end up far apart, which hurts distance-based methods.",
      },
      {
        heading: "Reduction has a cost",
        body: "Dimensionality reduction creates a smaller description of each example, and a smaller description cannot keep everything. The goal is to keep the structure that matters, such as the main spread and relationships, while discarding detail that matters less. This module shows how to do it and how to measure what was lost.",
      },
      {
        heading: "What it is not",
        body: "Dimensionality reduction is not feature selection, which keeps some of the original columns and drops the others. It is not clustering, which groups examples rather than rewriting their coordinates. And a reduced feature is usually a new combination of the old ones, not one of them.",
      },
    ],
    learnMore:
      "Worked example: the 6 customers have means 4.5 visits per week and 3.5 in monthly spend (in $100s). Their correlation is 0.94, so knowing the usage frequency already tells us most of what the spend is. That is the redundancy dimensionality reduction exploits. If the correlation were near 0, the two columns would carry independent information and compressing them to one would lose a lot.",
    python: `X = [(2, 1.5), (3, 2.5), (4, 2.5), (5, 4.5), (6, 4.0), (7, 6.0)]    # (usage frequency, monthly spend) for 6 customers; rows = samples, columns = features
import math

n = len(X)
usage = [row[0] for row in X]
spend = [row[1] for row in X]
mean_u, mean_s = sum(usage) / n, sum(spend) / n

# correlation: how closely the two columns move together (-1 to 1)
cov = sum((u - mean_u) * (s - mean_s) for u, s in zip(usage, spend)) / (n - 1)
sd_u = math.sqrt(sum((u - mean_u) ** 2 for u in usage) / (n - 1))
sd_s = math.sqrt(sum((s - mean_s) ** 2 for s in spend) / (n - 1))
print("features per customer:", len(X[0]))
print("means:", round(mean_u, 2), round(mean_s, 2))
print("correlation:", round(cov / (sd_u * sd_s), 2))

# Output:
# features per customer: 2
# means: 4.5 3.5
# correlation: 0.94`,
    quickCheck: {
      question: "Two features of a dataset have a correlation of 0.94. What does this suggest about reducing from two dimensions to one?",
      options: ["It is impossible, because each feature is a separate dimension", "It will keep every detail, because correlated features are identical", "The features overlap strongly, so one combined dimension may keep most of the structure, though some information is still lost", "The reduction should simply delete the feature with the larger values"],
      correctIndex: 2,
      explanation:
        "Strongly correlated features carry overlapping information, so a single combined dimension can summarize them well. The summary is still smaller than the original, so some detail is lost, and a correlation below 1 means the features are not identical.",
    },
  },
  {
    id: "dimensionality-reduction-2",
    title: "Variance as Information",
    subtitle: "Spread tells us which directions carry the structure",
    prerequisites: ["dimensionality-reduction-1", "probability-foundations-6"],
    theory: [
      {
        heading: "Why spread matters",
        body: "If every customer had the same spend, the spend column would tell us nothing about how customers differ. The more a feature varies, the more it can distinguish one example from another. Variance measures that spread: the average squared distance from the mean, using n − 1 in the denominator for a sample.",
      },
      {
        heading: "Variance of each feature",
        body: "For our 6 customers the usage frequencies have variance 3.50 and the monthly spends have variance 2.70. Both are large, so both columns separate customers. But looking at each column alone ignores that they move together.",
      },
      {
        heading: "Spread in any direction",
        body: "We can measure the spread of the points along any direction, not only along the two axes. Project every point onto a line through the center and compute the variance of the projected positions. Along the diagonal direction (1, 1) the variance is 6.00, much more than along either axis. Along the other diagonal (1, −1) it is only 0.20.",
      },
      {
        heading: "Variance as a proxy for information",
        body: "In dimensionality reduction we treat large spread as a rough measure of information: a direction in which the points differ a lot is worth keeping, and one in which they barely differ can be dropped with little loss. The total variance 6.2 is the sum of the two axis variances, and it is the same however we turn the axes: 6.00 + 0.20 = 6.2.",
      },
      {
        heading: "Variance is not importance",
        body: "This is an assumption, not a law. Variance depends on units: spend in cents has a million times more variance than spend in dollars. A high-variance direction can be noise, and a low-variance direction can be the one that predicts the label. PCA keeps high variance because it is a reasonable default, and a downstream check can still prove it wrong.",
      },
    ],
    learnMore:
      "Worked example: the 6 usage values 2, 3, 4, 5, 6, 7 have mean 4.5. The squared deviations are 6.25, 2.25, 0.25, 0.25, 2.25, 6.25, which add to 17.5; dividing by n − 1 = 5 gives 3.5. Features measured on very different scales are usually standardized first so that units do not decide which direction looks most informative.",
    python: `X = [(2, 1.5), (3, 2.5), (4, 2.5), (5, 4.5), (6, 4.0), (7, 6.0)]    # (usage frequency, monthly spend) for 6 customers; rows = samples, columns = features
import math

n = len(X)
means = [sum(row[j] for row in X) / n for j in range(2)]
Xc = [[row[j] - means[j] for j in range(2)] for row in X]      # centered data: X minus the feature means

def variance_along(Xc, direction):
    # variance of the centered points projected onto a unit direction
    n = len(Xc)
    proj = [r[0] * direction[0] + r[1] * direction[1] for r in Xc]
    return sum(p * p for p in proj) / (n - 1)

s = 1 / math.sqrt(2)
print("variance of usage:", round(variance_along(Xc, (1, 0)), 2))
print("variance of spend:", round(variance_along(Xc, (0, 1)), 2))
print("along (1, 1):", round(variance_along(Xc, (s, s)), 2))
print("along (1, -1):", round(variance_along(Xc, (s, -s)), 2))
print("total:", round(variance_along(Xc, (1, 0)) + variance_along(Xc, (0, 1)), 2))

# Output:
# variance of usage: 3.5
# variance of spend: 2.7
# along (1, 1): 6.0
# along (1, -1): 0.2
# total: 6.2`,
    quickCheck: {
      question: "A column of monthly spend measured in dollars is converted to cents, so its variance becomes 10,000 times larger. What does this show about using variance as a measure of information?",
      options: ["Variance depends on units and scale, so features are usually standardized first and high variance is only a proxy for information", "The cents column now carries 10,000 times more information", "Variance is useless and can never guide dimensionality reduction", "Only the dollar version has a valid variance"],
      correctIndex: 0,
      explanation:
        "Changing units changes variance without changing what the data say, so raw variance can mislead. Variance remains a useful proxy for information once features are on comparable scales, but it is a proxy, not the same as importance.",
    },
  },
  {
    id: "dimensionality-reduction-3",
    title: "Covariance Matrix",
    subtitle: "Spread and co-movement of all features in one table",
    prerequisites: ["dimensionality-reduction-2", "probability-foundations-10"],
    theory: [
      {
        heading: "Variance is not enough",
        body: "Two features can each vary a lot while moving independently, or while moving together. To find good directions we need to know how features vary together. Covariance measures this: positive means they tend to be above or below their means at the same time, negative means one is high when the other is low, and near zero means no linear co-movement.",
      },
      {
        heading: "Centering first",
        body: "We organize the data as a matrix X with one row per customer and one column per feature, then subtract each column's mean to get the centered matrix Xc. For our data the means are 4.5 and 3.5. Centering puts the cloud's center at the origin, so directions through the origin describe the spread.",
      },
      {
        heading: "The covariance matrix",
        body: "With the n − 1 convention the covariance matrix is S = XcᵀXc / (n − 1). Its diagonal holds the feature variances, 3.5 and 2.7. Its off-diagonal entries hold the covariance between the two features, 2.9 in both places because the matrix is symmetric: S = [[3.5, 2.9], [2.9, 2.7]].",
      },
      {
        heading: "Covariance versus correlation",
        body: "A covariance of 2.9 is hard to judge because it depends on the units of both features. Correlation rescales it to the range −1 to 1 by dividing by both standard deviations: 2.9 / √(3.5 × 2.7) = 0.94. Same relationship, unit-free. PCA on standardized data works from the correlation matrix.",
      },
      {
        heading: "Why PCA needs it",
        body: "The covariance matrix packs all the spread information of the cloud into a small, symmetric table. The principal directions of the next checkpoints are found directly from it: they are the special directions of this matrix.",
      },
    ],
    learnMore:
      "Worked example: the centered pairs are (−2.5, −2), (−1.5, −1), (−0.5, −1), (0.5, 1), (1.5, 0.5), (2.5, 2.5). Multiplying each pair gives 5, 1.5, 0.5, 0.5, 0.75, 6.25, which add to 14.5, and 14.5 / 5 = 2.9. Dividing by n instead of n − 1 would scale every entry of S by 5/6; a project should pick one convention and use it everywhere. This course uses n − 1.",
    python: `X = [(2, 1.5), (3, 2.5), (4, 2.5), (5, 4.5), (6, 4.0), (7, 6.0)]    # (usage frequency, monthly spend) for 6 customers; rows = samples, columns = features
import math

n = len(X)
means = [sum(row[j] for row in X) / n for j in range(2)]
Xc = [[row[j] - means[j] for j in range(2)] for row in X]      # centered data: X minus the feature means
def covariance(Xc):
    n = len(Xc)
    return [[sum(r[i] * r[j] for r in Xc) / (n - 1) for j in range(2)] for i in range(2)]      # divide by n - 1

S = covariance(Xc)
print("centered first row:", Xc[0])
print("covariance matrix:", [[round(v, 2) for v in row] for row in S])
corr = S[0][1] / math.sqrt(S[0][0] * S[1][1])
print("correlation:", round(corr, 2))

# Output:
# centered first row: [-2.5, -2.0]
# covariance matrix: [[3.5, 2.9], [2.9, 2.7]]
# correlation: 0.94`,
    quickCheck: {
      question: "In a covariance matrix of two features, the diagonal entries are 3.5 and 2.7 and the off-diagonal entry is 2.9. What do these entries mean?",
      options: ["The diagonal entries are correlations and the off-diagonal entry is a variance", "The diagonal entries are the variances of the two features and the off-diagonal entry is their covariance, positive because they tend to rise together", "All three numbers are probabilities that must add to 1", "The off-diagonal entry shows the features are independent"],
      correctIndex: 1,
      explanation:
        "The diagonal holds each feature's variance and the off-diagonal holds the covariance between features. A positive covariance means the features tend to move together; independence would give a value near zero. None of these numbers are probabilities.",
    },
  },
  {
    id: "dimensionality-reduction-4",
    title: "Principal Directions",
    subtitle: "The axes along which the data spreads most",
    prerequisites: ["dimensionality-reduction-3", "linear-algebra-6"],
    theory: [
      {
        heading: "Looking for the best axis",
        body: "The x and y axes are arbitrary. A better description may use a direction that follows the cloud. Pick a unit direction at angle θ, project all centered points onto it and measure the variance of the projected positions. The best direction is the one that makes that variance as large as possible.",
      },
      {
        heading: "Rotating the axis",
        body: "Try angles for our 6 customers. At 0° (the usage axis) the variance is 3.50; at 30° it is 5.81; at 45° it is 6.00; at 60° it is 5.41; at 90° (the spend axis) it is 2.70. The spread rises and then falls as the axis rotates, with a maximum near 41.1°.",
      },
      {
        heading: "The first principal direction",
        body: "The direction of maximum variance is the first principal direction, v₁ = (0.7539, 0.6570). The variance along it is 6.0275. It points up and to the right, along the cloud, a mix of both features with slightly more weight on usage.",
      },
      {
        heading: "The second direction",
        body: "The second principal direction is the direction of greatest remaining variance that is perpendicular (orthogonal) to the first. In two dimensions it is fixed: v₂ = (-0.6570, 0.7539), with variance 0.1725, so the cloud is wide along v₁ and nearly flat along v₂.",
      },
      {
        heading: "Directions, not features",
        body: "Principal directions are new axes, usually mixtures of the original features. A direction has no sign: v and −v describe the same axis, and software may return either. The variances 6.0275 and 0.1725 add to the total 6.2: rotating the axes redistributes the spread but does not change it.",
      },
    ],
    learnMore:
      "Worked example: the variance along a unit direction (cos θ, sin θ) is 3.5·cos²θ + 2·2.9·cosθ·sinθ + 2.7·sin²θ. Scanning θ finds the maximum at 41.1°, and the two directions at 41.1° and 131.1° are perpendicular, so their dot product is 0. Their sign is arbitrary: (−0.7539, −0.6570) is the same axis.",
    python: `X = [(2, 1.5), (3, 2.5), (4, 2.5), (5, 4.5), (6, 4.0), (7, 6.0)]    # (usage frequency, monthly spend) for 6 customers; rows = samples, columns = features
import math

n = len(X)
means = [sum(row[j] for row in X) / n for j in range(2)]
Xc = [[row[j] - means[j] for j in range(2)] for row in X]      # centered data: X minus the feature means
def covariance(Xc):
    n = len(Xc)
    return [[sum(r[i] * r[j] for r in Xc) / (n - 1) for j in range(2)] for i in range(2)]      # divide by n - 1

S = covariance(Xc)

def spread(angle_degrees):
    c, s = math.cos(math.radians(angle_degrees)), math.sin(math.radians(angle_degrees))
    return S[0][0] * c * c + 2 * S[0][1] * c * s + S[1][1] * s * s      # variance along that direction

for angle in [0, 30, 45, 60, 90]:
    print(angle, "degrees:", round(spread(angle), 2))

best = max(range(0, 180), key=spread)
print("best angle (1 degree steps):", best, "variance:", round(spread(best), 3))
v1 = (math.cos(math.radians(best)), math.sin(math.radians(best)))
v2 = (-v1[1], v1[0])      # perpendicular partner
print("dot product of the two directions:", round(v1[0] * v2[0] + v1[1] * v2[1], 6))

# Output:
# 0 degrees: 3.5
# 30 degrees: 5.81
# 45 degrees: 6.0
# 60 degrees: 5.41
# 90 degrees: 2.7
# best angle (1 degree steps): 41 variance: 6.027
# dot product of the two directions: 0.0`,
    quickCheck: {
      question: "After finding the direction of maximum variance for a two-dimensional cloud, which statement about the second principal direction is correct?",
      options: ["It is the direction with the second-largest spread among all directions, even if it is almost parallel to the first", "It is the original feature with the smaller variance", "It is perpendicular to the first and captures the largest remaining variance; in two dimensions that fully determines it", "It always points the opposite way to the first direction"],
      correctIndex: 2,
      explanation:
        "Principal directions are mutually orthogonal and ordered by variance. The second is the largest-variance direction perpendicular to the first; it is not a copy of the first or an original feature, and in two dimensions the perpendicular direction is unique up to sign.",
    },
  },
  {
    id: "dimensionality-reduction-5",
    title: "PCA Intuition",
    subtitle: "Center, find the main axis, keep the coordinates along it",
    prerequisites: ["dimensionality-reduction-4"],
    theory: [
      {
        heading: "The idea in one sentence",
        body: "Principal Component Analysis (PCA) rotates the axes to line up with the directions of greatest variance, then keeps only the first few of the new coordinates. The result is a smaller description that retains as much of the spread as possible.",
      },
      {
        heading: "The recipe",
        body: "First center the data. Then find the principal directions and order them by variance. Finally describe each point by its coordinates along the top directions. For our 6 customers: the center is (4.5, 3.5), the first direction is v₁ = (0.754, 0.657), and each point gets a single new number: its position along v₁.",
      },
      {
        heading: "Principal component scores",
        body: "That new number is the principal component 1 (PC1) value of the point: z = (x − mean) · v₁. The six customers get PC1 values -3.20, -1.79, -1.03, 1.03, 1.46, 3.53. Their variance is 6.0275, exactly the variance along v₁.",
      },
      {
        heading: "A component is not an original feature",
        body: "PC1 is a blend: z = 0.754 × (usage − 4.5) + 0.657 × (spend − 3.5). It is a new feature built from both. A direction is the axis; a projected coordinate is where a particular point lies on that axis. PC2 holds what is left, and its values 0.13, 0.23, -0.43, 0.43, -0.61, 0.24 are all small.",
      },
      {
        heading: "What PCA is and is not",
        body: "PCA is unsupervised: it never looks at labels. It is a linear method: it can only rotate and keep coordinates, so it cannot unroll a curved structure. It is not feature selection, since PC1 mixes the columns, and not clustering, since it describes coordinates, not groups.",
      },
    ],
    learnMore:
      "Worked example: the first customer is (2, 1.5). Centered it is (−2.5, −2). Then z = −2.5 × 0.7539 + (−2) × 0.6570 = -3.199. The same calculation for each customer gives the whole PC1 column. Keeping only z means storing 6 numbers instead of 12, at the price of discarding the PC2 values, which are small here.",
    python: `X = [(2, 1.5), (3, 2.5), (4, 2.5), (5, 4.5), (6, 4.0), (7, 6.0)]    # (usage frequency, monthly spend) for 6 customers; rows = samples, columns = features
import math

n = len(X)
means = [sum(row[j] for row in X) / n for j in range(2)]
Xc = [[row[j] - means[j] for j in range(2)] for row in X]      # centered data: X minus the feature means
def covariance(Xc):
    n = len(Xc)
    return [[sum(r[i] * r[j] for r in Xc) / (n - 1) for j in range(2)] for i in range(2)]      # divide by n - 1
def eig2(S):
    a, b, d = S[0][0], S[0][1], S[1][1]
    mid, rad = (a + d) / 2, math.sqrt(((a - d) / 2) ** 2 + b * b)
    lam1, lam2 = mid + rad, mid - rad
    norm = math.hypot(b, lam1 - a)
    v1 = (b / norm, (lam1 - a) / norm)      # eigenvector for the larger eigenvalue
    v2 = (-v1[1], v1[0])                    # perpendicular partner
    return (lam1, lam2), (v1, v2)

S = covariance(Xc)
(lam1, lam2), (v1, v2) = eig2(S)
print("PC1 direction:", tuple(round(v, 3) for v in v1))

scores1 = [r[0] * v1[0] + r[1] * v1[1] for r in Xc]      # coordinate along PC1
scores2 = [r[0] * v2[0] + r[1] * v2[1] for r in Xc]      # coordinate along PC2
print("PC1 scores:", [round(z, 2) for z in scores1])
print("PC2 scores:", [round(z, 2) for z in scores2])
print("variance of PC1 scores:", round(sum(z * z for z in scores1) / (len(scores1) - 1), 3))

# Output:
# PC1 direction: (0.754, 0.657)
# PC1 scores: [-3.2, -1.79, -1.03, 1.03, 1.46, 3.53]
# PC2 scores: [0.13, 0.23, -0.43, 0.43, -0.61, 0.24]
# variance of PC1 scores: 6.027`,
    quickCheck: {
      question: "A data scientist says: \"PC1 is just the original feature with the largest variance.\" Which reply is most accurate?",
      options: ["Correct, PCA always picks the original column with the biggest variance", "Incorrect: PC1 is the direction of greatest variance, which is generally a weighted mix of all the original features", "Correct, but only when the data are centered", "Incorrect: PCA creates one new feature per example"],
      correctIndex: 1,
      explanation:
        "PCA does not select columns. Each component is a new direction, expressed as a weighted combination of the original features. That is the difference between PCA and feature selection.",
    },
  },
  {
    id: "dimensionality-reduction-6",
    title: "PCA Using Eigenvectors",
    subtitle: "Principal directions are eigenvectors of the covariance matrix",
    prerequisites: ["dimensionality-reduction-5", "linear-algebra-6"],
    theory: [
      {
        heading: "Special directions of a matrix",
        body: "Multiplying a vector by a matrix usually turns it. An eigenvector of a matrix S is a direction that S only stretches (or flips) without turning: S v = λ v. The stretch factor λ is the eigenvalue. Eigenvectors and eigenvalues come in pairs.",
      },
      {
        heading: "Why this finds the principal directions",
        body: "The covariance matrix S is symmetric. Maximizing the variance vᵀSv over unit vectors v leads exactly to the equation S v = λ v, and the variance along an eigenvector equals its eigenvalue. So the principal directions are the eigenvectors of S, and the eigenvalues are the variances along them.",
      },
      {
        heading: "Our matrix",
        body: "For S = [[3.5, 2.9], [2.9, 2.7]], the eigenvalues are λ₁ = 6.0275 and λ₂ = 0.1725. Their eigenvectors are v₁ = (0.7539, 0.6570) and v₂ = (-0.6570, 0.7539). Check: S v₁ = (4.5439, 3.9602) = 6.0275 × v₁.",
      },
      {
        heading: "Sort by eigenvalue",
        body: "Sort the eigenvalues from largest to smallest and keep the eigenvectors in the same order. The eigenvector for the largest eigenvalue is PC1, the next is PC2, and so on. An eigenvalue is a variance (a size); an eigenvector is a direction. They are different objects, and both are needed.",
      },
      {
        heading: "Signs and checks",
        body: "If v is an eigenvector then so is −v, with the same eigenvalue, so software may flip the sign of a component without changing the analysis. The eigenvalues add up to the trace of S: 6.0275 + 0.1725 = 6.2, the total variance. For a symmetric matrix the eigenvectors are perpendicular.",
      },
    ],
    learnMore:
      "Worked example (2×2 closed form): the eigenvalues solve λ² − (a + d)λ + (ad − b²) = 0 with a = 3.5, b = 2.9, d = 2.7. That is λ² − 6.2λ + 1.04 = 0, giving λ = 3.10 ± 2.9275. Real software uses numerical routines for larger matrices, but the idea is the same.",
    python: `X = [(2, 1.5), (3, 2.5), (4, 2.5), (5, 4.5), (6, 4.0), (7, 6.0)]    # (usage frequency, monthly spend) for 6 customers; rows = samples, columns = features
import math

n = len(X)
means = [sum(row[j] for row in X) / n for j in range(2)]
Xc = [[row[j] - means[j] for j in range(2)] for row in X]      # centered data: X minus the feature means
def covariance(Xc):
    n = len(Xc)
    return [[sum(r[i] * r[j] for r in Xc) / (n - 1) for j in range(2)] for i in range(2)]      # divide by n - 1
def eig2(S):
    a, b, d = S[0][0], S[0][1], S[1][1]
    mid, rad = (a + d) / 2, math.sqrt(((a - d) / 2) ** 2 + b * b)
    lam1, lam2 = mid + rad, mid - rad
    norm = math.hypot(b, lam1 - a)
    v1 = (b / norm, (lam1 - a) / norm)      # eigenvector for the larger eigenvalue
    v2 = (-v1[1], v1[0])                    # perpendicular partner
    return (lam1, lam2), (v1, v2)

S = covariance(Xc)
(lam1, lam2), (v1, v2) = eig2(S)
print("eigenvalues:", round(lam1, 4), round(lam2, 4))
print("eigenvector 1:", tuple(round(v, 4) for v in v1))
print("eigenvector 2:", tuple(round(v, 4) for v in v2))

# check S v = lambda v for the first pair
Sv = [S[0][0] * v1[0] + S[0][1] * v1[1], S[1][0] * v1[0] + S[1][1] * v1[1]]
print("S times v1:", [round(v, 4) for v in Sv])
print("lambda1 times v1:", [round(lam1 * v, 4) for v in v1])
print("sum of eigenvalues = total variance:", round(lam1 + lam2, 4), round(S[0][0] + S[1][1], 4))

# Output:
# eigenvalues: 6.0275 0.1725
# eigenvector 1: (0.7539, 0.657)
# eigenvector 2: (-0.657, 0.7539)
# S times v1: [4.5439, 3.9602]
# lambda1 times v1: [4.5439, 3.9602]
# sum of eigenvalues = total variance: 6.2 6.2`,
    quickCheck: {
      question: "A covariance matrix has eigenvalues 6.03 and 0.17. Which statement is correct?",
      options: ["The eigenvectors are the directions of the principal components, and the eigenvalues are the variances along them, so the first component carries most of the spread", "The eigenvalues are the directions and the eigenvectors are the variances", "Both components carry almost the same variance", "The two eigenvalues must add to 1"],
      correctIndex: 0,
      explanation:
        "Eigenvectors give the principal directions and eigenvalues give the variance along each. With 6.03 versus 0.17 almost all of the spread is along the first. The eigenvalues add to the total variance, not to 1.",
    },
  },
  {
    id: "dimensionality-reduction-7",
    title: "PCA and SVD",
    subtitle: "The singular value decomposition as a route to PCA",
    prerequisites: ["dimensionality-reduction-6", "linear-algebra-8"],
    theory: [
      {
        heading: "A second route",
        body: "So far we built the covariance matrix and found its eigenvectors. There is a second route that works on the centered data matrix directly: the singular value decomposition (SVD), which factors Xc = U Σ Vᵀ. Xc has one row per sample and one column per feature.",
      },
      {
        heading: "The three factors",
        body: "V holds the principal directions: the columns of V (the rows of Vᵀ) are the same unit vectors v₁, v₂ we found before, up to sign. Σ is a diagonal matrix of singular values σ₁ ≥ σ₂ ≥ … . The columns of U are the normalized scores: the coordinates of the samples along each direction, divided by the singular value.",
      },
      {
        heading: "The link to variance",
        body: "The two routes agree. The eigenvalues of the covariance matrix equal the squared singular values divided by n − 1: λ = σ² / (n − 1). For our data σ₁ = 5.4897 and σ₂ = 0.9288, so λ₁ = 6.0275 and λ₂ = 0.1725, matching the eigenvalues. The scores are U Σ = Xc V.",
      },
      {
        heading: "Why bother with SVD",
        body: "SVD is a matrix factorization; PCA is an analysis. SVD is one route to PCA, and in practice the one libraries prefer, because it avoids forming XcᵀXc, which can lose numerical precision. Both routes produce the same principal directions and the same variances.",
      },
      {
        heading: "Careful with orientation",
        body: "With rows as samples, the principal directions are the rows of Vᵀ. Libraries differ in whether they return V or Vᵀ, so check the shapes. Signs can also differ between implementations, and between routes, without changing the subspace.",
      },
    ],
    learnMore:
      "Worked example: the first singular value is σ₁ = √(6.0275 × 5) = 5.4897. The first column of U is the vector of PC1 scores divided by σ₁, for example -0.5827 for the first customer (score -3.199). Multiplying back, U Σ Vᵀ rebuilds the centered matrix Xc exactly, up to rounding. The snippet below computes the SVD directly, by rotating the two columns of Xc until they are orthogonal, without ever forming the covariance matrix, and then compares it with the eigen route. The second direction comes out with the opposite sign to the eigenvector, which is the same axis.",
    python: `X = [(2, 1.5), (3, 2.5), (4, 2.5), (5, 4.5), (6, 4.0), (7, 6.0)]    # (usage frequency, monthly spend) for 6 customers; rows = samples, columns = features
import math

n = len(X)
means = [sum(row[j] for row in X) / n for j in range(2)]
Xc = [[row[j] - means[j] for j in range(2)] for row in X]      # centered data: X minus the feature means
def covariance(Xc):
    n = len(Xc)
    return [[sum(r[i] * r[j] for r in Xc) / (n - 1) for j in range(2)] for i in range(2)]      # divide by n - 1
def eig2(S):
    a, b, d = S[0][0], S[0][1], S[1][1]
    mid, rad = (a + d) / 2, math.sqrt(((a - d) / 2) ** 2 + b * b)
    lam1, lam2 = mid + rad, mid - rad
    norm = math.hypot(b, lam1 - a)
    v1 = (b / norm, (lam1 - a) / norm)      # eigenvector for the larger eigenvalue
    v2 = (-v1[1], v1[0])                    # perpendicular partner
    return (lam1, lam2), (v1, v2)
def svd_2cols(Xc):
    # SVD of a centered matrix with two columns, by rotating the columns until they are orthogonal
    a = [r[0] for r in Xc]
    b = [r[1] for r in Xc]
    alpha, beta = sum(x * x for x in a), sum(y * y for y in b)
    gamma = sum(x * y for x, y in zip(a, b))
    zeta = (beta - alpha) / (2 * gamma)
    t = (1 if zeta >= 0 else -1) / (abs(zeta) + math.sqrt(1 + zeta * zeta))
    c = 1 / math.sqrt(1 + t * t)
    s = c * t
    cols = [[c * x - s * y for x, y in zip(a, b)], [s * x + c * y for x, y in zip(a, b)]]
    dirs = [(c, -s), (s, c)]
    sig = [math.sqrt(sum(v * v for v in col)) for col in cols]
    U, sigma, Vt = [], [], []
    for j in sorted(range(2), key=lambda j: -sig[j]):
        flip = -1 if dirs[j][0] < 0 else 1      # make the first entry of each direction positive
        sigma.append(sig[j])
        Vt.append((flip * dirs[j][0], flip * dirs[j][1]))
        U.append([flip * v / sig[j] for v in cols[j]])
    return U, sigma, Vt

S = covariance(Xc)
(lam1, lam2), (e1, e2) = eig2(S)      # route 1: eigenvectors of the covariance matrix
U, sigma, Vt = svd_2cols(Xc)          # route 2: SVD of the centered data (no covariance matrix)

print("singular values:", [round(s, 4) for s in sigma])
print("sigma^2 / (n - 1):", [round(s * s / (n - 1), 4) for s in sigma])
print("eigenvalues:", [round(lam1, 4), round(lam2, 4)])
print("PC1 from the eigenvectors:", tuple(round(v, 4) for v in e1))
print("PC1 from the first row of Vt:", tuple(round(v, 4) for v in Vt[0]))
print("PC2 from the eigenvectors:", tuple(round(v, 4) for v in e2))
print("PC2 from the second row of Vt:", tuple(round(v, 4) for v in Vt[1]), "(opposite sign, same axis)")

scores = [U[0][i] * sigma[0] for i in range(n)]      # first column of U times sigma_1 = the PC1 scores
print("PC1 scores from U and sigma:", [round(z, 2) for z in scores])
rebuilt = [[sum(U[k][i] * sigma[k] * Vt[k][c] for k in range(2)) for c in range(2)] for i in range(n)]
error = max(abs(rebuilt[i][c] - Xc[i][c]) for i in range(n) for c in range(2))
print("Xc = U Sigma Vt rebuilt exactly:", error < 1e-9)

# Output:
# singular values: [5.4897, 0.9288]
# sigma^2 / (n - 1): [6.0275, 0.1725]
# eigenvalues: [6.0275, 0.1725]
# PC1 from the eigenvectors: (0.7539, 0.657)
# PC1 from the first row of Vt: (0.7539, 0.657)
# PC2 from the eigenvectors: (-0.657, 0.7539)
# PC2 from the second row of Vt: (0.657, -0.7539) (opposite sign, same axis)
# PC1 scores from U and sigma: [-3.2, -1.79, -1.03, 1.03, 1.46, 3.53]
# Xc = U Sigma Vt rebuilt exactly: True`,
    quickCheck: {
      question: "Which statement correctly relates PCA and the SVD of a centered data matrix with rows as samples?",
      options: ["SVD and PCA are unrelated techniques", "PCA is a special kind of SVD that needs no centering", "The principal directions are the columns of U, and the singular values equal the eigenvalues", "The principal directions are the rows of Vᵀ, and each covariance eigenvalue equals σ² / (n − 1), so both routes agree"],
      correctIndex: 3,
      explanation:
        "With rows as samples the principal directions are the rows of Vᵀ (columns of V), and each eigenvalue equals σ² / (n − 1). U holds normalized scores, not directions, and PCA needs centered data.",
    },
  },
  {
    id: "dimensionality-reduction-8",
    title: "Projection to Lower Dimensions",
    subtitle: "Keeping only the first coordinates of each point",
    prerequisites: ["dimensionality-reduction-7"],
    theory: [
      {
        heading: "Projecting a point",
        body: "To reduce a point to one dimension, drop a perpendicular from it to the principal axis. The foot of the perpendicular is its projection, and its position along the axis is the new one-number description. The fifth customer (6, 4.0), centered at (1.5, 0.5), lands at z = 1.459.",
      },
      {
        heading: "The matrix view",
        body: "For all points at once, multiply the centered matrix by the matrix Vk of the top k directions: Z = Xc Vk. With 6 samples, 2 features and k = 1, a 6 × 2 matrix times a 2 × 1 matrix gives a 6 × 1 matrix of new coordinates: -3.20, -1.79, -1.03, 1.03, 1.46, 3.53. With k = 2, nothing is dropped and Z is just the data in rotated axes.",
      },
      {
        heading: "New data",
        body: "A new customer must be treated exactly like the training data: subtract the training means (4.5, 3.5), then multiply by the same V. A customer with usage 5 and spend 3.0 is centered to (0.5, -0.5) and gets z = 0.048. Fitting PCA again on new data would give different axes.",
      },
      {
        heading: "What the projection keeps",
        body: "The projection keeps the position along PC1, which holds 97.2% of the variance, and discards the PC2 coordinate. The ordering of customers along the main trend is preserved; the small departures from the trend are not.",
      },
      {
        heading: "Directions versus coordinates",
        body: "Keep the vocabulary clear: the principal direction v₁ is an axis shared by all points; the projected coordinate z is a per-point number telling where that point sits on the axis. The reduced dataset is the coordinates, not the directions.",
      },
    ],
    learnMore:
      "Worked example: stack the six scores into a column: Z = [-3.20, -1.79, -1.03, 1.03, 1.46, 3.53]ᵀ. The original dataset needed 12 numbers; Z needs 6, plus the 2 means and the 2 numbers of v₁ that are stored once for the whole model. For a dataset with thousands of rows and dozens of columns the saving is much larger.",
    python: `X = [(2, 1.5), (3, 2.5), (4, 2.5), (5, 4.5), (6, 4.0), (7, 6.0)]    # (usage frequency, monthly spend) for 6 customers; rows = samples, columns = features
import math

n = len(X)
means = [sum(row[j] for row in X) / n for j in range(2)]
Xc = [[row[j] - means[j] for j in range(2)] for row in X]      # centered data: X minus the feature means
def covariance(Xc):
    n = len(Xc)
    return [[sum(r[i] * r[j] for r in Xc) / (n - 1) for j in range(2)] for i in range(2)]      # divide by n - 1
def eig2(S):
    a, b, d = S[0][0], S[0][1], S[1][1]
    mid, rad = (a + d) / 2, math.sqrt(((a - d) / 2) ** 2 + b * b)
    lam1, lam2 = mid + rad, mid - rad
    norm = math.hypot(b, lam1 - a)
    v1 = (b / norm, (lam1 - a) / norm)      # eigenvector for the larger eigenvalue
    v2 = (-v1[1], v1[0])                    # perpendicular partner
    return (lam1, lam2), (v1, v2)

S = covariance(Xc)
(lam1, lam2), (v1, v2) = eig2(S)

# project every centered point onto PC1: Z = Xc V_k with k = 1
Z = [r[0] * v1[0] + r[1] * v1[1] for r in Xc]
print("reduced dataset (6 x 1):", [round(z, 2) for z in Z])

# a NEW customer: use the training means and the same direction
new = (5, 3.0)
new_centered = (new[0] - means[0], new[1] - means[1])
z_new = new_centered[0] * v1[0] + new_centered[1] * v1[1]
print("new customer centered:", tuple(round(v, 2) for v in new_centered))
print("new customer PC1 coordinate:", round(z_new, 3))

# Output:
# reduced dataset (6 x 1): [-3.2, -1.79, -1.03, 1.03, 1.46, 3.53]
# new customer centered: (0.5, -0.5)
# new customer PC1 coordinate: 0.048`,
    quickCheck: {
      question: "A new customer arrives after PCA was fit on the training data. How should this customer be projected onto PC1?",
      options: ["Fit PCA again using only this single customer", "Subtract the training means, then multiply by the training principal direction", "Skip centering because only one point is involved", "Divide the original features by the eigenvalue"],
      correctIndex: 1,
      explanation:
        "New points must pass through the same transformation as the training data: subtract the training means and project onto the directions found on the training data. Refitting on one point would produce meaningless axes.",
    },
  },
  {
    id: "dimensionality-reduction-9",
    title: "Information Loss",
    subtitle: "What a smaller description gives up, and how to measure it",
    prerequisites: ["dimensionality-reduction-8"],
    theory: [
      {
        heading: "Reconstruction",
        body: "A projected point can be mapped back to the original space: x̂ = mean + z · v₁. The reconstruction lies on the principal line. For the fifth customer, z = 1.459 gives x̂ = (5.60, 4.46) instead of the original (6, 4.0). The difference is the information lost.",
      },
      {
        heading: "Reconstruction error",
        body: "The error of a point is its distance to the principal line, which is its PC2 coordinate. The squared errors of the six customers add up to 0.8627, which equals (n − 1) × λ₂ = 5 × 0.1725. Dropping a component costs exactly its variance.",
      },
      {
        heading: "Explained variance",
        body: "The fraction of variance kept by PC1 is λ₁ / (λ₁ + λ₂) = 6.0275 / 6.2 = 97.2%. This is the explained variance ratio. Keeping PC1 retains 97.2% of the spread and loses 2.8%.",
      },
      {
        heading: "Choosing how many components",
        body: "With many features, plot the cumulative explained variance and keep enough components to reach a chosen level, such as 90 or 95 percent, or stop where adding components gives little extra. The right level depends on the task, and it is a trade-off between size and fidelity.",
      },
      {
        heading: "Careful with the numbers",
        body: "Explained variance is not accuracy. Keeping 95% of the variance does not mean a model will be 95% accurate. The discarded 5% could hold exactly the small differences that separate the classes. Always check the downstream result on the reduced data.",
      },
    ],
    learnMore:
      "Worked example: the PC2 coordinates are 0.13, 0.23, -0.43, 0.43, -0.61, 0.24. Squaring and adding gives 0.8627. The total squared distance of the centered points from the center is 5 × 6.2 = 31.0, so the fraction of it retained by the line is 1 − 0.8627 / 31.0 = 97.2%, the same as the explained variance.",
    python: `X = [(2, 1.5), (3, 2.5), (4, 2.5), (5, 4.5), (6, 4.0), (7, 6.0)]    # (usage frequency, monthly spend) for 6 customers; rows = samples, columns = features
import math

n = len(X)
means = [sum(row[j] for row in X) / n for j in range(2)]
Xc = [[row[j] - means[j] for j in range(2)] for row in X]      # centered data: X minus the feature means
def covariance(Xc):
    n = len(Xc)
    return [[sum(r[i] * r[j] for r in Xc) / (n - 1) for j in range(2)] for i in range(2)]      # divide by n - 1
def eig2(S):
    a, b, d = S[0][0], S[0][1], S[1][1]
    mid, rad = (a + d) / 2, math.sqrt(((a - d) / 2) ** 2 + b * b)
    lam1, lam2 = mid + rad, mid - rad
    norm = math.hypot(b, lam1 - a)
    v1 = (b / norm, (lam1 - a) / norm)      # eigenvector for the larger eigenvalue
    v2 = (-v1[1], v1[0])                    # perpendicular partner
    return (lam1, lam2), (v1, v2)

S = covariance(Xc)
(lam1, lam2), (v1, v2) = eig2(S)
Z = [r[0] * v1[0] + r[1] * v1[1] for r in Xc]

# reconstruct each point from its single PC1 coordinate
recon = [(means[0] + z * v1[0], means[1] + z * v1[1]) for z in Z]
print("fifth point:", X[4], "->", tuple(round(v, 2) for v in recon[4]))

errors = [(p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 for p, q in zip(X, recon)]
print("total squared error:", round(sum(errors), 4))
print("(n - 1) * lambda2:", round((len(X) - 1) * lam2, 4))
print("explained variance of PC1:", round(lam1 / (lam1 + lam2), 4))
print("lost:", round(lam2 / (lam1 + lam2), 4))

# Output:
# fifth point: (6, 4.0) -> (5.6, 4.46)
# total squared error: 0.8627
# (n - 1) * lambda2: 0.8627
# explained variance of PC1: 0.9722
# lost: 0.0278`,
    quickCheck: {
      question: "PCA keeps 95% of the variance of a dataset. A colleague says the classifier trained on the reduced data will therefore be 95% accurate. What is wrong with this claim?",
      options: ["Nothing: explained variance is the same thing as accuracy", "Explained variance measures retained spread, not predictive accuracy, so the discarded 5% could still hold the information that separates the classes", "The 95% should have been 100% to use PCA", "PCA never loses any information"],
      correctIndex: 1,
      explanation:
        "Explained variance describes how much of the data's spread is preserved. Accuracy depends on the task, and the small-variance directions that were dropped may be the ones that matter. Check the model on the reduced data.",
    },
  },
];

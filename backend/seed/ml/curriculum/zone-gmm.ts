// MODULE 11 — Gaussian Mixture Models (9 checkpoints) in Unsupervised Valley.
//
// One-dimensional numbers: 16 customers' monthly spend; mixture A (0.30, mean 2, sigma 0.8), B (0.45, 5, 1.0),
// C (0.25, 8, 0.9). EM example on ten values with two components A (0.4, 3, 1) and B (0.6, 6, 1.5); the
// responsibility example is x = 4.5: scores 0.0518 / 0.0968, responsibilities 0.3486 / 0.6514. The two-dimensional
// pictures use a three-component overlapping customer dataset. Python uses only the standard library; every
// snippet was executed and its real output is appended as comments.

import type { CheckpointSpec } from "./builder.js";

export const gaussianMixtureModuleSpecs: CheckpointSpec[] = [
  {
    id: "gaussian-mixtures-1",
    title: "Density Estimation",
    subtitle: "Describing how data is spread across the space",
    prerequisites: ["estimation-uncertainty-2"],
    theory: [
      {
        heading: "A third kind of question",
        body: "Classification asks what label a point should receive. Clustering asks which group a point resembles. Density estimation asks a different question: where does the data tend to occur? It describes how observations are spread across the space, which is the foundation for the models in this module.",
      },
      {
        heading: "One feature first",
        body: "Take one feature: the average monthly spend of 16 customers, on a scale of 0 to 10. Placed on a number line, the values are not evenly spread. They bunch up around 2, around 5 and around 8, with thin stretches in between. Next we turn this picture of points into a smooth description.",
      },
      {
        heading: "From points to a curve",
        body: "A histogram counts how many customers fall in each bin of width 1: here 2, 3, 1, 2, 3, 1, 2, 2, 0 for the bins 1 to 2, 2 to 3, and so on up to 9 to 10. A smooth density curve does the same job without bin edges: place a small bump on every observation and add them up. The curve is high where observations crowd together and low where they are rare.",
      },
      {
        heading: "Reading a density",
        body: "Higher density means that observations near that region are more plausible, or more common, under the model. A new customer at spend 5 lands where density is 0.159, while a customer at 10 lands where it is 0.0134: far less typical. Density is a relative comparison between places.",
      },
      {
        heading: "Density is not a probability",
        body: "For a continuous feature, the density at one value is not the probability of that exact value. A very narrow bump with standard deviation 0.2 has a density of about 1.995 at its center, which is greater than 1, so it cannot be a probability. Probabilities come from area under the curve over an interval.",
      },
    ],
    learnMore:
      "Worked example: with bump width 0.7 the density estimate at spend 5 is 0.159 and at spend 10 it is 0.0134. The first region is about 12 times as dense as the second, so a customer at 5 is far more typical of this data than one at 10.",
    python: `spend = [1.3, 1.8, 2.1, 2.4, 2.9, 3.9, 4.4, 4.8, 5.1, 5.4, 5.9, 6.2, 7.3, 7.9, 8.4, 8.9]    # average monthly spend of 16 customers
import math

def gaussian_pdf(x, mean, sigma):
    return math.exp(-((x - mean) ** 2) / (2 * sigma ** 2)) / (math.sqrt(2 * math.pi) * sigma)

# histogram: count the customers in each bin of width 1
counts = [sum(1 for x in spend if b <= x < b + 1) for b in range(1, 10)]
print(counts)

# a smooth density estimate: one small Gaussian bump (width 0.7) on every observation
def density(x, width=0.7):
    return sum(gaussian_pdf(x, xi, width) for xi in spend) / len(spend)

print(round(density(5), 3), round(density(10), 4))

# density is not probability: a narrow bump has density above 1 at its center
print(round(gaussian_pdf(0, 0, 0.2), 3))

# Output:
# [2, 3, 1, 2, 3, 1, 2, 2, 0]
# 0.159 0.0134
# 1.995`,
    quickCheck: {
      question: "A density estimate of customer spend is 0.16 at spend 5 and 0.013 at spend 10. What can we conclude?",
      options: ["The probability of a customer spending exactly 5 is 0.19", "Customers at spend 10 cannot exist", "Observations near spend 5 are far more common (plausible) under the model than near spend 10; density is not the probability of an exact value", "The data must follow a single bell curve centered at 5"],
      correctIndex: 2,
      explanation:
        "Higher density means observations near that value are more common under the model. For a continuous feature the density at one point is not the probability of exactly that value, and a low density does not make a value impossible.",
    },
  },
  {
    id: "gaussian-mixtures-2",
    title: "Mixture Models",
    subtitle: "Several sources blended into one distribution",
    prerequisites: ["gaussian-mixtures-1"],
    theory: [
      {
        heading: "One bump may not be enough",
        body: "Fit a single bell curve to our 16 spend values and it sits at their mean, 4.92, with standard deviation 2.34. But the data has three groups, so the single curve puts its peak in a valley and describes the two outer groups poorly. At spend 3.5, where customers are rare, it gives a density of 0.142, while at spend 2, where they are common, only 0.078.",
      },
      {
        heading: "The mixture idea",
        body: "A mixture model describes the data as a weighted combination of several simpler component distributions: overall density = component A + component B + component C, each scaled by its weight. Each component explains one clump, and together they can have several peaks.",
      },
      {
        heading: "Mixing weights",
        body: "The weights are called mixing weights, written π. For our three components we use π = 0.30, 0.45 and 0.25. They are positive and add up to 1 (π_A + π_B + π_C = 1). A weight is the rough share of the data that the model assigns to that component.",
      },
      {
        heading: "Combining the components",
        body: "At any spend x the overall density is the weighted sum: p(x) = π_A p_A(x) + π_B p_B(x) + π_C p_C(x). At spend 2 the mixture density is 0.152, at 3.5 in the valley it is 0.084, and at 5 it is 0.180. The mixture rises at each clump and dips between them, like the data.",
      },
      {
        heading: "Takeaway",
        body: "A mixture model builds a complicated distribution from simple parts. Components A, B and C are mathematical building blocks, not named customer types. Next we choose the parts to be Gaussians.",
      },
    ],
    learnMore:
      "Worked example: at spend 3.5 the three weighted components contribute 0.0258 (A), 0.0583 (B) and nearly 0 (C), which add up to the mixture density 0.0841. The weights 0.30, 0.45 and 0.25 add up to 1.",
    python: `spend = [1.3, 1.8, 2.1, 2.4, 2.9, 3.9, 4.4, 4.8, 5.1, 5.4, 5.9, 6.2, 7.3, 7.9, 8.4, 8.9]    # average monthly spend of 16 customers
import math

def gaussian_pdf(x, mean, sigma):
    return math.exp(-((x - mean) ** 2) / (2 * sigma ** 2)) / (math.sqrt(2 * math.pi) * sigma)
components = [(0.30, 2, 0.8), (0.45, 5, 1.0), (0.25, 8, 0.9)]      # (weight, mean, sigma) for A, B, C

print("weights sum:", round(sum(w for w, m, s in components), 2))

def mixture_pdf(x):
    return sum(w * gaussian_pdf(x, m, s) for w, m, s in components)

for x in (2, 3.5, 5):
    print(x, round(mixture_pdf(x), 4))

# one bell curve versus the mixture: average log-density of the 16 customers (higher is better)
n = len(spend)
mean = sum(spend) / n
sigma = math.sqrt(sum((x - mean) ** 2 for x in spend) / n)
single = sum(math.log(gaussian_pdf(x, mean, sigma)) for x in spend) / n
mixture = sum(math.log(mixture_pdf(x)) for x in spend) / n
print(round(single, 3), round(mixture, 3))

# Output:
# weights sum: 1.0
# 2 0.1516
# 3.5 0.0841
# 5 0.1801
# -2.271 -2.101`,
    quickCheck: {
      question: "Customer spend has three distinct clumps. Why is a single bell curve a poor description, and what does a mixture add?",
      options: ["The single curve peaks between the clumps and misses the shape; a mixture adds several weighted components, so the overall density can have several peaks", "A single bell curve cannot be fitted to data at all", "A mixture removes the need for weights", "A mixture simply averages the curve of each customer into one flat line"],
      correctIndex: 0,
      explanation:
        "One bell curve has one peak, so it centers on the overall mean and describes the clumps badly. A mixture is a weighted sum of components, each covering one clump, so the combined density can have several peaks.",
    },
  },
  {
    id: "gaussian-mixtures-3",
    title: "Gaussian Mixture Models",
    subtitle: "Mixtures whose components are bell curves",
    prerequisites: ["gaussian-mixtures-2"],
    theory: [
      {
        heading: "Gaussian components",
        body: "A Gaussian mixture model (GMM) is a mixture model in which every component is a Gaussian, a bell curve. Each component has three properties: a mean, a spread and a weight.",
      },
      {
        heading: "Mean, spread and weight in one dimension",
        body: "In one dimension the mean μ is where the bell is centered, the variance σ² (or the standard deviation σ) says how wide it is, and the weight π says how much of the data the component accounts for. Component A has μ = 2, σ = 0.8, π = 0.30; B has μ = 5, σ = 1.0, π = 0.45; C has μ = 8, σ = 0.9, π = 0.25.",
      },
      {
        heading: "The Gaussian density",
        body: "The bell is N(x | μ, σ²) = 1 / sqrt(2πσ²) × exp(−(x − μ)² / (2σ²)). Do not worry about the algebra: the exponent shrinks the density as x moves away from the mean, and σ controls how fast. The formula only gives us a number we can compute.",
      },
      {
        heading: "The picture in two dimensions",
        body: "For two features, such as purchases and spend, each component is an ellipse-shaped cloud. The mean is its center, the covariance sets its shape, size and orientation, and the weight is the relative size of the component. The components can overlap, and each can have a different spread.",
      },
      {
        heading: "Beyond circles around centers",
        body: "K-Means summarizes a cluster by one center and judges closeness by distance. A GMM component also has a spread and a weight, so it can say that one group is wider than another, and that a point in the overlap is plausible under more than one component. At spend 3.5 the overall density is 0.0841, mostly from components B and A.",
      },
    ],
    learnMore:
      "Worked example at spend 3.5: A contributes 0.30 × N(3.5 | 2, 0.8²) = 0.0258, B contributes 0.45 × N(3.5 | 5, 1.0²) = 0.0583, and C contributes almost nothing (the point is nearly 5 sigma from its mean). The mixture density is the sum, 0.0841.",
    python: `import math

def gaussian_pdf(x, mean, sigma):
    return math.exp(-((x - mean) ** 2) / (2 * sigma ** 2)) / (math.sqrt(2 * math.pi) * sigma)
components = [(0.30, 2, 0.8), (0.45, 5, 1.0), (0.25, 8, 0.9)]      # (weight, mean, sigma) for A, B, C

x = 3.5
for name, (w, mean, sigma) in zip("ABC", components):
    print(name, "weighted density at", x, round(w * gaussian_pdf(x, mean, sigma), 4))

total = sum(w * gaussian_pdf(x, mean, sigma) for w, mean, sigma in components)
print("mixture density:", round(total, 4))

# the spread matters: the same distance from the mean is 'closer' for a wide component
print(round(gaussian_pdf(3.5, 5, 0.5), 4), round(gaussian_pdf(3.5, 5, 2.0), 4))

# Output:
# A weighted density at 3.5 0.0258
# B weighted density at 3.5 0.0583
# C weighted density at 3.5 0.0
# mixture density: 0.0841
# 0.0089 0.1506`,
    quickCheck: {
      question: "Which list correctly gives the properties that define one Gaussian component of a GMM?",
      options: ["Only its mean, because the spread is the same for all components", "Its centroid and the number of points assigned to it", "A single label and a distance threshold", "Its mean (center), its spread (variance or covariance) and its mixing weight"],
      correctIndex: 3,
      explanation:
        "Each component is a Gaussian with a mean, a spread (variance in 1D, covariance in higher dimensions) and a mixing weight. That is more than a K-Means centroid, which has only a center.",
    },
  },
  {
    id: "gaussian-mixtures-4",
    title: "Hidden Membership",
    subtitle: "The label you never observe",
    prerequisites: ["gaussian-mixtures-3"],
    theory: [
      {
        heading: "A story of how the data arose",
        body: "A GMM tells a story of how each customer's value came about: first a component is chosen, with probability equal to its weight, and then the value is drawn from that component's Gaussian. So behind every observed value there was a component that produced it.",
      },
      {
        heading: "Observed and hidden",
        body: "What we observe is the feature x, the customer's spend. What we do not observe is which component generated it. That component identity is a hidden (latent) variable, which we write z. Nobody recorded it, just as the cluster labels in Module 10 were never given.",
      },
      {
        heading: "Why it is hard",
        body: "If we knew z for every customer, fitting would be easy: group the customers by z and fit one Gaussian per group. If we knew the Gaussians, we could say how plausible each origin is. We know neither, and that circular problem is the heart of the module.",
      },
      {
        heading: "An ambiguous customer",
        body: "Take two components A (weight 0.4, mean 3, σ 1) and B (weight 0.6, mean 6, σ 1.5), and a customer with spend 4.5, between the two. Under A the density is 0.1295 and under B it is 0.1613. Both components could plausibly have produced this customer, so we cannot say with certainty that it came from A or from B.",
      },
      {
        heading: "Latent membership",
        body: "So component membership is uncertain, and we should treat it as something with degrees rather than a single label. The next lesson gives that uncertainty a name and a number, the responsibility.",
      },
    ],
    learnMore:
      "Worked example: if customers were generated as (component, spend) pairs such as (A, 2.3), (B, 6.4), (A, 3.4), the data we are given contains only the spend values 2.3, 6.4, 3.4. The letters A and B are hidden. Two different customers with the same spend could have come from different components.",
    python: `import math

def gaussian_pdf(x, mean, sigma):
    return math.exp(-((x - mean) ** 2) / (2 * sigma ** 2)) / (math.sqrt(2 * math.pi) * sigma)
components = [(0.4, 3, 1.0), (0.6, 6, 1.5)]      # (weight, mean, sigma) for A and B

# how the data arose: a hidden component, then a value from its Gaussian
generated = [("A", 2.3), ("B", 6.4), ("A", 3.4), ("B", 5.1), ("B", 7.8), ("A", 1.9)]

# what we actually observe: only the values
observed = [x for z, x in generated]
print(observed)

# an ambiguous customer: how well can each component explain spend 4.5?
x = 4.5
for name, (w, mean, sigma) in zip("AB", components):
    print(name, round(gaussian_pdf(x, mean, sigma), 4))

# Output:
# [2.3, 6.4, 3.4, 5.1, 7.8, 1.9]
# A 0.1295
# B 0.1613`,
    quickCheck: {
      question: "In a GMM, a customer with spend 4.5 lies between two components. What does it mean that the component identity is 'hidden'?",
      options: ["The customer has no component, so the point should be deleted", "The identity of the generating component is not observed, so a point in the overlap could plausibly have come from either one", "The component is recorded in the data but hidden from the user interface", "The model has not been trained yet, so all components are equal"],
      correctIndex: 1,
      explanation:
        "We observe the feature value but not which component produced it. For a point between components both origins are plausible, so membership is uncertain. This latent identity is the hidden variable z.",
    },
  },
  {
    id: "gaussian-mixtures-5",
    title: "Responsibilities",
    subtitle: "How much each component is responsible for each point",
    prerequisites: ["gaussian-mixtures-4"],
    theory: [
      {
        heading: "Soft membership",
        body: "K-Means would label the customer at spend 4.5 with one cluster. A GMM can instead give soft membership: a share for each component, such as A 0.35 and B 0.65. These shares are called responsibilities: how strongly each component currently explains the point.",
      },
      {
        heading: "How to compute them",
        body: "Use the example from before: A has weight 0.4, mean 3, σ 1 and B has weight 0.6, mean 6, σ 1.5, and the point is x = 4.5. First, how well does each component explain x? The densities are 0.1295 for A and 0.1613 for B. Second, scale by the mixing weights: 0.4 × 0.1295 = 0.0518 for A and 0.6 × 0.1613 = 0.0968 for B.",
      },
      {
        heading: "Normalize",
        body: "These scores are not yet shares, so divide each by their total, 0.1486. The responsibilities are 0.3486 for A and 0.6514 for B. They add up to 1 for the point. A point near the center of B would give B a responsibility near 1; a point between the components splits it.",
      },
      {
        heading: "Weight is not responsibility",
        body: "The mixing weight is global: it says how big a component is overall, and it is the same for every point. A responsibility is point-specific: it says how much that component explains this particular point, after comparing all components. Do not confuse them.",
      },
      {
        heading: "A careful reading",
        body: "Responsibilities come from the model and its current parameters. They are a soft membership degree, not a calibrated real-world probability that the customer belongs to a true category. Compared with Module 10, the hard choice has been replaced by a distribution over components.",
      },
    ],
    learnMore:
      "Worked example at x = 4.5: scores 0.0518 (A) and 0.0968 (B), total 0.1486. Responsibilities 0.0518 / 0.1486 = 0.3486 and 0.0968 / 0.1486 = 0.6514. K-Means would have to name one cluster; the GMM keeps both.",
    python: `import math

def gaussian_pdf(x, mean, sigma):
    return math.exp(-((x - mean) ** 2) / (2 * sigma ** 2)) / (math.sqrt(2 * math.pi) * sigma)
components = [(0.4, 3, 1.0), (0.6, 6, 1.5)]      # (weight, mean, sigma) for A and B

x = 4.5
densities = [gaussian_pdf(x, m, s) for w, m, s in components]
scores = [w * d for (w, m, s), d in zip(components, densities)]
total = sum(scores)
responsibilities = [sc / total for sc in scores]

print("densities:", [round(d, 4) for d in densities])
print("weighted scores:", [round(sc, 4) for sc in scores], "total", round(total, 4))
print("responsibilities:", [round(r, 4) for r in responsibilities])
print("sum:", round(sum(responsibilities), 4))

hard = "AB"[max(range(2), key=lambda k: responsibilities[k])]    # what a hard method would keep
print("hard label would be:", hard)

# Output:
# densities: [0.1295, 0.1613]
# weighted scores: [0.0518, 0.0968] total 0.1486
# responsibilities: [0.3486, 0.6514]
# sum: 1.0
# hard label would be: B`,
    quickCheck: {
      question: "For the point x = 4.5 a GMM gives responsibilities A 0.35 and B 0.65. How should these be read?",
      options: ["B's mixing weight is 0.65", "There is a 65% chance that the customer belongs to a real-world category called B", "The point is certainly a member of B, so A can be ignored", "B currently explains this point more strongly than A does, but A still explains part of it; the two shares sum to 1 for this point"],
      correctIndex: 3,
      explanation:
        "Responsibilities are point-specific soft membership degrees that sum to 1. They differ from the global mixing weights, they do not remove the uncertainty (A still has 0.35), and they are not calibrated probabilities of a true semantic category.",
    },
  },
  {
    id: "gaussian-mixtures-6",
    title: "E-Step",
    subtitle: "Computing the soft memberships",
    prerequisites: ["gaussian-mixtures-5"],
    theory: [
      {
        heading: "Half of an algorithm",
        body: "To fit a GMM we alternate two steps. The E-step, the expectation step, estimates the responsibilities. The M-step, which comes next, updates the components. In the E-step the components are fixed: their means, spreads and weights are exactly what they were.",
      },
      {
        heading: "What the E-step does",
        body: "Given the current parameters, for every point: (1) evaluate how well each component explains the point, (2) multiply by the component's mixing weight, (3) normalize across components, giving that point's responsibilities.",
      },
      {
        heading: "The formula, term by term",
        body: "r_ik = π_k N(x_i | μ_k, σ_k²) / Σ_j π_j N(x_i | μ_j, σ_j²). The numerator is the weighted score of component k for point i. The denominator adds the weighted scores of all components, so the responsibilities of a point sum to 1.",
      },
      {
        heading: "Ten customers, two components",
        body: "With A (0.4, mean 3, σ 1) and B (0.6, mean 6, σ 1.5) fixed, the ten spend values 1.5, 2.0, 2.8, 3.4, 4.5, 5.2, 6.1, 6.8, 7.5, 8.3 get A-responsibilities 0.97, 0.96, 0.91, 0.81, 0.35, 0.09, 0.01, 0.00, 0.00, 0.00. Low spends belong almost entirely to A, high spends to B, and 4.5 is split (A 0.35, B 0.65).",
      },
      {
        heading: "What changes and what does not",
        body: "The E-step changes the membership estimates, not the components. After it, every point has a fresh row of responsibilities, while the means, spreads and weights are untouched. They will change only in the M-step.",
      },
    ],
    learnMore:
      "Worked example, point x = 4.5: weighted scores 0.0518 (A) and 0.0968 (B); total 0.1486; responsibilities 0.3486 and 0.6514. The same three-step recipe is applied to each of the ten points.",
    python: `import math

def gaussian_pdf(x, mean, sigma):
    return math.exp(-((x - mean) ** 2) / (2 * sigma ** 2)) / (math.sqrt(2 * math.pi) * sigma)
components = [(0.4, 3, 1.0), (0.6, 6, 1.5)]      # (weight, mean, sigma) for A and B
points = [1.5, 2.0, 2.8, 3.4, 4.5, 5.2, 6.1, 6.8, 7.5, 8.3]
def e_step(points, components):
    result = []
    for x in points:
        scores = [w * gaussian_pdf(x, m, s) for w, m, s in components]
        total = sum(scores)
        result.append([sc / total for sc in scores])
    return result

resp = e_step(points, components)
for x, r in zip(points, resp):
    print(x, [round(v, 3) for v in r])

print("components unchanged:", components)

# Output:
# 1.5 [0.967, 0.033]
# 2.0 [0.955, 0.045]
# 2.8 [0.905, 0.095]
# 3.4 [0.806, 0.194]
# 4.5 [0.349, 0.651]
# 5.2 [0.093, 0.907]
# 6.1 [0.008, 0.992]
# 6.8 [0.001, 0.999]
# 7.5 [0.0, 1.0]
# 8.3 [0.0, 1.0]
# components unchanged: [(0.4, 3, 1.0), (0.6, 6, 1.5)]`,
    quickCheck: {
      question: "During the E-step of EM, what is held fixed and what is computed?",
      options: ["The component parameters (means, spreads, weights) are fixed, and the responsibilities of every point are computed from them", "The responsibilities are fixed and the component means, spreads and weights are recomputed", "Both are recomputed at the same time", "Nothing is computed; the E-step only chooses the number of components"],
      correctIndex: 0,
      explanation:
        "The E-step uses the current parameters to compute responsibilities. It never changes the means, spreads or weights; that is the job of the M-step.",
    },
  },
  {
    id: "gaussian-mixtures-7",
    title: "M-Step",
    subtitle: "Refitting each component with weighted data",
    prerequisites: ["gaussian-mixtures-6"],
    theory: [
      {
        heading: "The other half",
        body: "The M-step, the maximization step, updates the components using the responsibilities. Now the responsibilities are fixed and the parameters change. Each component is refitted to the data, with every point counting as much as that component is responsible for it.",
      },
      {
        heading: "A weighted mean",
        body: "In K-Means the new center is the average of the points assigned to a cluster. In a GMM every point contributes to every component, weighted by its responsibility: μ_k = Σ_i r_ik x_i / Σ_i r_ik. A point with responsibility 0.9 pulls the mean a lot, a point with 0.01 hardly at all.",
      },
      {
        heading: "Our ten customers",
        body: "Using the responsibilities from the E-step, the total responsibility of component A is N_A = 4.083 and of B is N_B = 5.917. The new means are 2.631 for A (it was 3) and 6.314 for B (it was 6).",
      },
      {
        heading: "Spread and weight",
        body: "The spread is updated by the same weighting: σ_k² = Σ_i r_ik (x_i − μ_k)² / Σ_i r_ik, giving σ_A = 0.998 and σ_B = 1.501. The mixing weight is the share of total responsibility: π_k = N_k / N, here 0.408 for A and 0.592 for B.",
      },
      {
        heading: "What changes and what does not",
        body: "In the M-step the responsibilities stay fixed while the means, spreads and weights move. Together with the E-step this gives a loop: new parameters change which components explain which points, and new responsibilities change the parameters.",
      },
    ],
    learnMore:
      "Worked example, mean of A: sum of r_iA × x_i divided by N_A = 4.083 gives 2.631. A K-Means centroid would use only the points closest to A; the GMM mean also lets the middle points, such as 4.5, contribute a little.",
    python: `import math

def gaussian_pdf(x, mean, sigma):
    return math.exp(-((x - mean) ** 2) / (2 * sigma ** 2)) / (math.sqrt(2 * math.pi) * sigma)
components = [(0.4, 3, 1.0), (0.6, 6, 1.5)]      # (weight, mean, sigma) for A and B
points = [1.5, 2.0, 2.8, 3.4, 4.5, 5.2, 6.1, 6.8, 7.5, 8.3]
def e_step(points, components):
    result = []
    for x in points:
        scores = [w * gaussian_pdf(x, m, s) for w, m, s in components]
        total = sum(scores)
        result.append([sc / total for sc in scores])
    return result
def m_step(points, resp):
    new = []
    for k in range(len(resp[0])):
        n_k = sum(r[k] for r in resp)
        mean = sum(r[k] * x for r, x in zip(resp, points)) / n_k
        sigma = math.sqrt(sum(r[k] * (x - mean) ** 2 for r, x in zip(resp, points)) / n_k)
        new.append((n_k / len(points), mean, sigma))
    return new

resp = e_step(points, components)           # responsibilities, held fixed in this step
n_a = sum(r[0] for r in resp)
n_b = sum(r[1] for r in resp)
print("total responsibility:", round(n_a, 3), round(n_b, 3))

new_components = m_step(points, resp)
for name, (w, mean, sigma) in zip("AB", new_components):
    print(name, "weight", round(w, 3), "mean", round(mean, 3), "sigma", round(sigma, 3))

# Output:
# total responsibility: 4.083 5.917
# A weight 0.408 mean 2.631 sigma 0.998
# B weight 0.592 mean 6.314 sigma 1.501`,
    quickCheck: {
      question: "In the M-step, how is the new mean of a component computed?",
      options: ["As the average of only the points whose largest responsibility is that component", "As the point with the highest density under that component", "As the weighted average of all points, using each point's responsibility for that component as its weight", "It is not changed; only the responsibilities change"],
      correctIndex: 1,
      explanation:
        "The new mean is Σ r_ik x_i / Σ r_ik: every point contributes in proportion to its responsibility. That generalizes the K-Means centroid, which averages only the assigned points. Responsibilities stay fixed during this step.",
    },
  },
  {
    id: "gaussian-mixtures-8",
    title: "Expectation Maximization",
    subtitle: "Alternating expectation and maximization",
    prerequisites: ["gaussian-mixtures-7"],
    theory: [
      {
        heading: "The full loop",
        body: "Expectation Maximization (EM) fits a GMM by repeating: initialize the parameters, E-step to compute responsibilities, M-step to update the parameters, and repeat until the changes become small. Neither step needs labels.",
      },
      {
        heading: "The objective",
        body: "EM seeks parameters that improve the likelihood of the observed data: how plausible the data are under the model. We follow the log-likelihood, which should rise from step to step and level off. We will not derive why; it is enough to know that each E-and-M round does not make the fit worse.",
      },
      {
        heading: "Watching it on ten customers",
        body: "Start with A (0.4, mean 3, σ 1) and B (0.6, mean 6, σ 1.5). After the first round the log-likelihood is −21.12, then −21.03, −21.00 and −20.98. The means drift to about 2.38 and 6.25 and the changes shrink: the loop is settling.",
      },
      {
        heading: "It can settle in the wrong place",
        body: "EM converges to a local optimum, not necessarily the global best. Started at means 7 and 8 with σ 0.5, the same data converge to A (mean 3.13) and B (mean 6.95) with log-likelihood -21.21, worse than -20.95 from the first start. Initialization matters, and runs are often repeated.",
      },
      {
        heading: "Takeaway",
        body: "EM alternates E and M steps, improves the likelihood each round, and stops when little changes. It is the soft version of K-Means' assign-and-update loop, and like K-Means it can get stuck in a local solution.",
      },
    ],
    learnMore:
      "Worked example: with the first start the log-likelihood goes −21.12, −21.03, −21.00, −20.98 over the first four rounds and keeps creeping upward to -20.951 at convergence. With the second start it stops at -21.209.",
    python: `import math

def gaussian_pdf(x, mean, sigma):
    return math.exp(-((x - mean) ** 2) / (2 * sigma ** 2)) / (math.sqrt(2 * math.pi) * sigma)
points = [1.5, 2.0, 2.8, 3.4, 4.5, 5.2, 6.1, 6.8, 7.5, 8.3]
def e_step(points, components):
    result = []
    for x in points:
        scores = [w * gaussian_pdf(x, m, s) for w, m, s in components]
        total = sum(scores)
        result.append([sc / total for sc in scores])
    return result
def m_step(points, resp):
    new = []
    for k in range(len(resp[0])):
        n_k = sum(r[k] for r in resp)
        mean = sum(r[k] * x for r, x in zip(resp, points)) / n_k
        sigma = math.sqrt(sum(r[k] * (x - mean) ** 2 for r, x in zip(resp, points)) / n_k)
        new.append((n_k / len(points), mean, sigma))
    return new

def log_likelihood(points, components):
    return sum(math.log(sum(w * gaussian_pdf(x, m, s) for w, m, s in components)) for x in points)

def run_em(start, rounds):
    components = start
    for step in range(1, rounds + 1):
        resp = e_step(points, components)         # E-step: parameters fixed
        components = m_step(points, resp)         # M-step: responsibilities fixed
        if step <= 4:
            print("round", step, "log-likelihood", round(log_likelihood(points, components), 3))
    return components, log_likelihood(points, components)

good, good_ll = run_em([(0.4, 3, 1.0), (0.6, 6, 1.5)], 60)
print("converged:", [tuple(round(v, 2) for v in c) for c in good], round(good_ll, 3))
bad, bad_ll = run_em([(0.5, 7, 0.5), (0.5, 8, 0.5)], 60)
print("other start:", [tuple(round(v, 2) for v in c) for c in bad], round(bad_ll, 3))

# Output:
# round 1 log-likelihood -21.12
# round 2 log-likelihood -21.03
# round 3 log-likelihood -20.997
# round 4 log-likelihood -20.981
# converged: [(0.37, 2.38, 0.74), (0.63, 6.25, 1.45)] -20.951
# round 1 log-likelihood -21.623
# round 2 log-likelihood -21.599
# round 3 log-likelihood -21.588
# round 4 log-likelihood -21.577
# other start: [(0.56, 3.13, 1.3), (0.44, 6.95, 1.03)] -21.209`,
    quickCheck: {
      question: "EM was run twice on the same data from different starting parameters and stopped at two different solutions, with log-likelihoods −20.95 and −21.21. What does this show?",
      options: ["EM has a bug, because it must always give the same answer", "The lower-likelihood run is the global optimum", "EM converges to a local optimum that depends on initialization, so the higher-likelihood run is preferred and several starts are often tried", "The log-likelihood should not be compared between runs"],
      correctIndex: 2,
      explanation:
        "EM improves the likelihood each round but can stop at a local optimum, which depends on the starting parameters. Comparing log-likelihoods across starts and keeping the best is standard practice; convergence is not a guarantee of the global best.",
    },
  },
  {
    id: "gaussian-mixtures-9",
    title: "K-Means vs GMM",
    subtitle: "Hard circles versus soft ellipses",
    prerequisites: ["gaussian-mixtures-8", "clustering-6"],
    theory: [
      {
        heading: "The same data, two views",
        body: "K-Means gives each customer exactly one cluster and summarizes a cluster by a centroid, using Euclidean distance. A GMM gives each customer responsibilities over components, and summarizes a component by a mean, a spread and a weight. The two are close relatives: both alternate an assignment-like step and an update step.",
      },
      {
        heading: "A hard choice versus a soft one",
        body: "On our ten spend values, K-Means with two clusters, started from centers 3 and 6, ends with centers 2.84 and 6.78 and gives every point below 5 to the first cluster, including 4.5. The GMM, which knows that component B is wider and heavier, gives 4.5 responsibilities A 0.04 and B 0.96. K-Means returns one label; the GMM keeps the doubt.",
      },
      {
        heading: "Shape flexibility",
        body: "K-Means judges closeness by distance to centers, which favors round clusters of similar size. A GMM component can be wide or narrow, and in two dimensions elongated or tilted. When groups overlap or differ in spread, soft memberships and flexible shapes describe the data more faithfully.",
      },
      {
        heading: "Neither is always better",
        body: "K-Means is simple, fast and often enough: use it for compact, well-separated groups when one label per point is acceptable. Use a GMM when overlap matters, when you want soft membership, or when groups differ in spread or orientation. A GMM has more parameters to fit and can also stop at a local optimum.",
      },
      {
        heading: "Shared choices",
        body: "Both methods need the number of groups, K for K-Means and the number of components for a GMM, chosen by judgement or by a model-selection procedure. Components and clusters are mathematical descriptions of the data, not automatically meaningful customer types.",
      },
    ],
    learnMore:
      "Worked example: at x = 4.5, K-Means (centers 2.84 and 6.78) says cluster 1 because 4.5 is 1.66 from the first center and 2.28 from the second. The fitted GMM (A weight 0.37, mean 2.38, σ 0.74; B weight 0.63, mean 6.25, σ 1.45) gives A 0.039 and B 0.961.",
    python: `import math

def gaussian_pdf(x, mean, sigma):
    return math.exp(-((x - mean) ** 2) / (2 * sigma ** 2)) / (math.sqrt(2 * math.pi) * sigma)
points = [1.5, 2.0, 2.8, 3.4, 4.5, 5.2, 6.1, 6.8, 7.5, 8.3]
def e_step(points, components):
    result = []
    for x in points:
        scores = [w * gaussian_pdf(x, m, s) for w, m, s in components]
        total = sum(scores)
        result.append([sc / total for sc in scores])
    return result
def m_step(points, resp):
    new = []
    for k in range(len(resp[0])):
        n_k = sum(r[k] for r in resp)
        mean = sum(r[k] * x for r, x in zip(resp, points)) / n_k
        sigma = math.sqrt(sum(r[k] * (x - mean) ** 2 for r, x in zip(resp, points)) / n_k)
        new.append((n_k / len(points), mean, sigma))
    return new

# K-Means with two clusters, started from centers 3 and 6
centers = [3.0, 6.0]
for _ in range(10):
    labels = [min(range(2), key=lambda k: abs(x - centers[k])) for x in points]
    centers = [sum(x for x, l in zip(points, labels) if l == k) / labels.count(k) for k in range(2)]
print("K-Means centers:", [round(c, 2) for c in centers])

# a GMM fitted by EM from the same data
components = [(0.4, 3, 1.0), (0.6, 6, 1.5)]
for _ in range(60):
    components = m_step(points, e_step(points, components))
print("GMM:", [tuple(round(v, 2) for v in c) for c in components])

x = 4.5
k_label = min(range(2), key=lambda k: abs(x - centers[k]))
soft = e_step([x], components)[0]
print("K-Means label for 4.5:", k_label, " GMM responsibilities:", [round(r, 2) for r in soft])

# Output:
# K-Means centers: [2.84, 6.78]
# GMM: [(0.37, 2.38, 0.74), (0.63, 6.25, 1.45)]
# K-Means label for 4.5: 0  GMM responsibilities: [0.04, 0.96]`,
    quickCheck: {
      question: "A company has overlapping customer groups of different widths and wants to know how strongly each customer belongs to each group. Which approach fits best, and why?",
      options: ["A GMM, because its components have their own spread and its responsibilities express soft membership in overlapping groups", "K-Means, because it always gives the most accurate result", "Neither can be used without labels", "K-Means, because it provides responsibilities that sum to 1"],
      correctIndex: 0,
      explanation:
        "A GMM models each group with a mean, spread and weight, and its responsibilities describe degrees of membership where groups overlap. K-Means gives one hard label, which is simpler and often sufficient, but it is not always the most accurate.",
    },
  },
];

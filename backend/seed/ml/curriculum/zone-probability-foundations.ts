// MODULE 4 — Probability Foundations (11 checkpoints) in Probability Grove.
//
// Probability for machine learning, taught intuition-first. Recurring examples:
//   - 100 emails with a "free" flag      (conditional probability, Bayes rule)
//   - a fair die / two coin tosses       (spaces, random variables, expectation, variance, distributions)
//   - a bedrooms x price-band house table (joint, marginal, conditional)
//   - a 5-point size/price dataset       (covariance, correlation) and a 2D Gaussian cloud
// Plain readable formulas; Python uses only the standard library. Quick Check
// answer positions are deliberately varied.

import type { CheckpointSpec } from "./builder.js";

export const probabilityFoundationsSpecs: CheckpointSpec[] = [
  {
    id: "probability-foundations-1",
    title: "Probability Spaces",
    subtitle: "Naming what could happen, and how much each possibility counts",
    prerequisites: [],
    theory: [
      {
        heading: "Uncertainty needs a precise language",
        body: "Machine learning deals with things we cannot know for sure: whether an email is spam, what a house will sell for, what a sensor will read. Probability gives uncertainty a precise language. We start with the simplest uncertain thing, a roll of a fair six-sided die: before the roll, you cannot say which face will come up.",
      },
      {
        heading: "Outcomes and the sample space",
        body: "A random experiment is any process whose result is uncertain. Each possible result is an outcome. The set of all possible outcomes is the sample space. For one die roll the outcomes are 1, 2, 3, 4, 5 and 6, so the sample space is {1, 2, 3, 4, 5, 6}. Exactly one outcome happens each time.",
      },
      {
        heading: "Events",
        body: "An event is any collection of outcomes we care about. 'The roll is even' is the event {2, 4, 6}. 'The roll is at least 5' is the event {5, 6}. An event happens when the actual outcome is one of its members.",
      },
      {
        heading: "Probabilities attach to outcomes and events",
        body: "A probability is a number from 0 (cannot happen) to 1 (certain). For a fair die each outcome gets 1/6. The probability of an event is the sum of its outcomes: P(even) = 1/6 + 1/6 + 1/6 = 1/2. An assignment is valid when every probability is between 0 and 1 and the probabilities of all the mutually exclusive outcomes add up to exactly 1, because something must happen.",
      },
      {
        heading: "Why it matters for ML",
        body: "A classifier that outputs spam 0.9 and not spam 0.1 is giving a probability assignment over its two possible outcomes. If those numbers did not add up to 1 they would not describe a coherent belief. Everything later in this module, from conditioning to the Gaussian, builds on this foundation.",
      },
    ],
    learnMore:
      "Worked example: with 1/6 on each face, P(at least 5) = 2/6 = 1/3, and P(not even) = 1 − 1/2 = 1/2. Giving every face 0.2 is not valid, because six faces would add up to 1.2.",
    python: `outcomes = [1, 2, 3, 4, 5, 6]
p = {o: 1 / 6 for o in outcomes}           # a fair die

even = [o for o in outcomes if o % 2 == 0]
at_least_5 = [o for o in outcomes if o >= 5]

print(round(sum(p[o] for o in even), 3))        # 0.5
print(round(sum(p[o] for o in at_least_5), 3))  # 0.333
print(round(sum(p.values()), 3))                # 1.0: all outcomes add to 1`,
    quickCheck: {
      question: "You roll a fair six-sided die. What is the probability of the event 'the roll is at least 5'?",
      options: ["1/6", "1/2", "1/3", "2/3"],
      correctIndex: 2,
      explanation:
        "The event is {5, 6}: two outcomes, each with probability 1/6, so the event has probability 2/6 = 1/3.",
    },
  },
  {
    id: "probability-foundations-2",
    title: "Conditional Probability",
    subtitle: "How new information changes the denominator",
    prerequisites: ["probability-foundations-1"],
    theory: [
      {
        heading: "Information changes what is possible",
        body: "Imagine 100 emails, of which 40 are spam. Pick one at random: P(spam) = 40/100 = 0.4. Now suppose you learn the email contains the word 'free'. That changes the question. You are no longer picking from all 100 emails, only from the ones containing 'free'.",
      },
      {
        heading: "Restrict, then count again",
        body: "Say 30 of the 100 emails contain 'free', and 24 of those 30 are spam. Restrict attention to those 30. Inside that smaller group, spam makes up 24 of 30, which is 0.8. The probability of spam given 'free' is 0.8, double the original 0.4.",
      },
      {
        heading: "The notation and the formula",
        body: "We write this P(spam | free), read 'the probability of spam given free'. In general P(A | B) = P(A and B) / P(B), whenever P(B) is greater than 0. Here P(spam and free) = 24/100 and P(free) = 30/100, so the ratio is 0.24 / 0.30 = 0.8. The key move is the denominator: it changed from everything to just B.",
      },
      {
        heading: "Order matters",
        body: "P(A | B) and P(B | A) are different questions. Here P(free | spam) = 24/40 = 0.6: among spam emails, 60% contain 'free'. But P(spam | free) = 0.8. Mixing the two up is one of the most common mistakes in probability, and the next checkpoint is built on telling them apart.",
      },
      {
        heading: "Why it matters for ML",
        body: "Every prediction is conditional. A classifier does not ask 'is this spam?' in a vacuum; it asks 'is this spam, given these words, this sender, this link?'. Conditional probability is how evidence enters a model.",
      },
    ],
    learnMore:
      "Worked example: the 100 emails split as 24 spam with 'free', 16 spam without, 6 not-spam with 'free' and 54 not-spam without. Spam total 40, 'free' total 30, so P(spam | free) = 24/30 and P(free | spam) = 24/40.",
    python: `# 100 emails as counts: (is_spam, has_free) -> how many
counts = {
    (True, True): 24,
    (True, False): 16,
    (False, True): 6,
    (False, False): 54,
}
total = sum(counts.values())
spam = counts[(True, True)] + counts[(True, False)]
free = counts[(True, True)] + counts[(False, True)]

print(spam / total)                  # 0.4  P(spam)
print(counts[(True, True)] / free)   # 0.8  P(spam | free): denominator is 'free' only
print(counts[(True, True)] / spam)   # 0.6  P(free | spam): a different question`,
    quickCheck: {
      question: "Among 100 emails, 30 contain 'free' and 24 of those are spam. What is P(spam | free)?",
      options: [
        "24 / 30 = 0.8, because we only count the emails containing 'free'",
        "24 / 100 = 0.24, because we always divide by all emails",
        "30 / 100 = 0.3, the share of emails containing 'free'",
        "40 / 100 = 0.4, the share of spam overall",
      ],
      correctIndex: 0,
      explanation:
        "Conditioning on 'free' restricts attention to the 30 emails that contain it, so the denominator becomes 30 instead of 100.",
    },
  },
  {
    id: "probability-foundations-3",
    title: "Bayes Rule",
    subtitle: "Updating a belief after seeing evidence",
    prerequisites: ["probability-foundations-2"],
    theory: [
      {
        heading: "Belief before and after evidence",
        body: "Before opening an email you already have a belief about it: 40% of your mail is spam, so P(spam) = 0.4. This starting belief is the prior. Then you see evidence, the word 'free'. Bayes' rule is the recipe for how far that evidence should move your belief.",
      },
      {
        heading: "What you know vs. what you want",
        body: "From past emails it is easy to measure how often spam contains 'free': P(free | spam) = 0.6. This is the likelihood: how likely the evidence is if the email is spam. But what you want is the reverse, P(spam | free): the chance the email is spam given that you see 'free'. The condition has flipped direction.",
      },
      {
        heading: "The rule",
        body: "Bayes' rule reverses the condition: P(spam | free) = P(free | spam) × P(spam) / P(free). In words: posterior = likelihood × prior / evidence. The posterior is the updated belief after the evidence.",
      },
      {
        heading: "The evidence term normalizes",
        body: "P(free) is the total chance of seeing 'free' from any source, spam or not spam: P(free) = 0.6 × 0.4 + 0.1 × 0.6 = 0.24 + 0.06 = 0.30 (here 0.1 is P(free | not spam), and 0.6 is P(not spam)). Dividing by it makes the competing explanations share the evidence fairly, so the posteriors add up to 1.",
      },
      {
        heading: "The result, and why ML cares",
        body: "P(spam | free) = 0.6 × 0.4 / 0.30 = 0.24 / 0.30 = 0.8. The belief moved from 0.4 to 0.8, the same answer as counting in the last checkpoint, now built from pieces a model can estimate: a prior and likelihoods. Probabilistic classifiers such as naive Bayes work exactly this way, and Bayesian inference later in the course is the same update applied to model parameters.",
      },
    ],
    learnMore:
      "Worked example of why the prior matters: the same evidence ('free', with the same likelihoods 0.6 and 0.1) applied to a prior of only P(spam) = 0.01 gives a posterior of 0.6 × 0.01 / (0.6 × 0.01 + 0.1 × 0.99) = 0.006 / 0.105, about 0.057. A strong clue is not the same as a strong conclusion when the thing is rare.",
    python: `prior = 0.4          # P(spam)
like_spam = 0.6      # P(free | spam)
like_ham = 0.1       # P(free | not spam)

evidence = like_spam * prior + like_ham * (1 - prior)   # P(free)
posterior = like_spam * prior / evidence                # P(spam | free)
print(round(evidence, 2), round(posterior, 2))          # 0.3 0.8

# the same evidence is much weaker when spam is rare
rare_prior = 0.01
rare_evidence = like_spam * rare_prior + like_ham * (1 - rare_prior)
print(round(like_spam * rare_prior / rare_evidence, 3)) # 0.057`,
    quickCheck: {
      question: "A filter has prior P(spam) = 0.2, likelihood P(free | spam) = 0.9, and overall P(free) = 0.3. What is the posterior P(spam | free)?",
      options: ["0.9", "0.2", "0.3", "0.6"],
      correctIndex: 3,
      explanation:
        "Posterior = likelihood × prior / evidence = 0.9 × 0.2 / 0.3 = 0.18 / 0.3 = 0.6. The evidence raised the belief from 0.2 to 0.6.",
    },
  },
  {
    id: "probability-foundations-4",
    title: "Random Variables",
    subtitle: "Turning outcomes into numbers you can compute with",
    prerequisites: ["probability-foundations-3"],
    theory: [
      {
        heading: "Outcomes are not always numbers",
        body: "Toss a fair coin twice. The outcomes are HH, HT, TH and TT, each with probability 1/4. These are descriptions, not numbers, so we cannot average them or put them in a formula. To compute with them we need to turn each outcome into a number.",
      },
      {
        heading: "A random variable is a rule from outcomes to numbers",
        body: "A random variable X is a rule that gives a number to every outcome. Let X = the number of heads. Then HH ↦ 2, HT ↦ 1, TH ↦ 1 and TT ↦ 0. What is random is only which outcome occurs; the rule itself is fixed. So X is not an outcome and not a quantity that mysteriously wobbles: it is a function from outcomes to numbers.",
      },
      {
        heading: "Values and their probabilities",
        body: "X can take the values 0, 1 or 2. Add up the probabilities of the outcomes that map to each value: P(X = 0) = 1/4, P(X = 1) = 1/4 + 1/4 = 1/2, P(X = 2) = 1/4. This list of values with their probabilities is the distribution of X. For a discrete variable like this one it is also called the probability mass function.",
      },
      {
        heading: "Different questions, different variables",
        body: "The same experiment supports many variables. Y = 1 if the first toss is heads and 0 otherwise is one; Z = the number of tails is another. Choosing the variable means choosing which number summarizes the outcome.",
      },
      {
        heading: "Why it matters for ML",
        body: "Machine learning data is full of random variables: a feature such as a house's size, a label such as spam = 1 or not spam = 0, the noise in a measurement. Writing them as random variables lets us talk precisely about their averages, their spread and their relationships, which is what the rest of this module does.",
      },
    ],
    learnMore:
      "Worked example: P(X = 1) collects two outcomes, HT and TH, each with probability 1/4, giving 1/2. The three probabilities 1/4, 1/2 and 1/4 add up to 1, as they must.",
    python: `outcomes = {"HH": 0.25, "HT": 0.25, "TH": 0.25, "TT": 0.25}

def heads(outcome):
    # the random variable X: a rule from an outcome to a number
    return outcome.count("H")

dist = {}
for outcome, p in outcomes.items():
    x = heads(outcome)
    dist[x] = dist.get(x, 0) + p

print(dist)   # {2: 0.25, 1: 0.5, 0: 0.25}`,
    quickCheck: {
      question: "Two coins are tossed and X = the number of heads. Which statement is correct?",
      options: [
        "X is one of the outcomes HH, HT, TH or TT",
        "X maps the outcome HT to the number 1",
        "P(X = 1) = 1/4, because only HT gives one head",
        "X cannot be 0, because a random variable must be positive",
      ],
      correctIndex: 1,
      explanation:
        "X is a rule that turns outcomes into numbers: HT ↦ 1. Both HT and TH map to 1, so P(X = 1) = 1/2, and X = 0 happens for TT.",
    },
  },
  {
    id: "probability-foundations-5",
    title: "Expectation",
    subtitle: "The probability-weighted average of a random quantity",
    prerequisites: ["probability-foundations-4"],
    theory: [
      {
        heading: "A fair average",
        body: "Suppose you roll a fair die many times and average the results. What number would that average settle near? Expectation answers this without rolling at all: it is the probability-weighted average of the values.",
      },
      {
        heading: "Weight each value by its probability",
        body: "For a discrete random variable X, E[X] = Σ x · P(X = x), where Σ means 'add up over all values x'. For a die every value has probability 1/6, so E[X] = 1·(1/6) + 2·(1/6) + 3·(1/6) + 4·(1/6) + 5·(1/6) + 6·(1/6) = 21/6 = 3.5. Likely values count for more; unlikely ones count for less.",
      },
      {
        heading: "It need not be a possible value",
        body: "No roll ever shows 3.5. The expected value is a long-run average, not a prediction of any single outcome. After 12 rolls the average might be 3.8 or 3.2; after thousands it settles very close to 3.5. It is the balance point of the distribution.",
      },
      {
        heading: "Why it matters for ML",
        body: "Training is built on expectations. A model's loss on one example is a random quantity; what we really want to make small is its expected loss, the average loss over all the data the model could meet (the expected risk). If a model's squared error is 0 with probability 0.5, 1 with probability 0.3 and 4 with probability 0.2, its expected loss is 0×0.5 + 1×0.3 + 4×0.2 = 1.1.",
      },
    ],
    learnMore:
      "Worked example: twelve fair-die rolls 6, 2, 5, 1, 4, 3, 6, 2, 4, 3, 5, 1 average to exactly 3.5, but their running average moves around first (6, 4, 4.3, 3.5, 3.6, …). The more rolls, the smaller those swings.",
    python: `dist = {1: 1 / 6, 2: 1 / 6, 3: 1 / 6, 4: 1 / 6, 5: 1 / 6, 6: 1 / 6}
expected = sum(x * p for x, p in dist.items())
print(round(expected, 2))   # 3.5

# expected loss: squared-error value -> probability
loss_dist = {0: 0.5, 1: 0.3, 4: 0.2}
print(round(sum(loss * p for loss, p in loss_dist.items()), 2))   # 1.1`,
    quickCheck: {
      question: "A fair six-sided die has expected value 3.5. What does that mean?",
      options: [
        "Every roll of the die shows 3.5",
        "The die shows 3.5 about half of the time",
        "The long-run average of many rolls approaches 3.5, even though 3.5 can never be rolled",
        "The most likely single roll is 3 or 4",
      ],
      correctIndex: 2,
      explanation:
        "Expectation is a probability-weighted average. It describes where the average of many repetitions settles; it need not be a value that can actually occur.",
    },
  },
  {
    id: "probability-foundations-6",
    title: "Variance",
    subtitle: "How spread out a random quantity is",
    prerequisites: ["probability-foundations-5"],
    theory: [
      {
        heading: "Same average, different spread",
        body: "Expectation gives the center but not how spread out the values are. Two models can both have an average error of 0 and still behave very differently: one is always close, the other is sometimes far off. We need a number for spread.",
      },
      {
        heading: "Measure distance from the mean",
        body: "Take two distributions. A takes the values 4, 5 and 6 with probabilities 0.25, 0.5 and 0.25; B takes 0, 5 and 10 with the same probabilities. Both have mean 5. The deviation of a value is how far it sits from the mean: for A they are −1, 0 and +1; for B they are −5, 0 and +5.",
      },
      {
        heading: "Squaring prevents cancellation",
        body: "Averaging the deviations directly gives 0 for both, because negatives cancel positives. So we square each deviation first, which makes everything positive and punishes big misses more. Variance is the expected squared deviation: Var(X) = E[(X − E[X])²].",
      },
      {
        heading: "The two numbers",
        body: "For A: 0.25 × 1 + 0.5 × 0 + 0.25 × 1 = 0.5. For B: 0.25 × 25 + 0.5 × 0 + 0.25 × 25 = 12.5. Same mean, but B's variance is 25 times larger. The square root of the variance is the standard deviation, back in the original units: about 0.71 for A and 3.54 for B.",
      },
      {
        heading: "Why it matters for ML",
        body: "Variance measures how spread out a feature is (a feature that barely varies carries little information), how uncertain a prediction is, and how unstable a model's output is across different training sets.",
      },
    ],
    learnMore:
      "Worked example: for B, the value 10 is 5 above the mean and contributes 0.25 × 5² = 6.25; the value 0 contributes the same; the middle value contributes nothing. Total 12.5.",
    python: `def mean(dist):
    return sum(x * p for x, p in dist.items())

def variance(dist):
    m = mean(dist)
    return sum(p * (x - m) ** 2 for x, p in dist.items())

A = {4: 0.25, 5: 0.5, 6: 0.25}
B = {0: 0.25, 5: 0.5, 10: 0.25}
print(mean(A), mean(B))            # 5.0 5.0
print(variance(A), variance(B))    # 0.5 12.5
print(round(variance(A) ** 0.5, 2), round(variance(B) ** 0.5, 2))   # 0.71 3.54`,
    quickCheck: {
      question: "Two models both have an average error of 0. Model A's errors always fall between −1 and 1; Model B's fall between −10 and 10. Which has the larger variance?",
      options: [
        "B, because its errors are spread much further from the mean",
        "A, because smaller numbers produce a larger variance",
        "They are equal, because the means are equal",
        "Neither, because variance is always 0 when the mean is 0",
      ],
      correctIndex: 0,
      explanation:
        "Variance measures spread around the mean, not the mean itself. B's errors sit much farther from 0, so its expected squared deviation is far larger.",
    },
  },
  {
    id: "probability-foundations-7",
    title: "Common Probability Distributions",
    subtitle: "A small toolbox of named stories about how data occurs",
    prerequisites: ["probability-foundations-6"],
    theory: [
      {
        heading: "A distribution is a model of how values occur",
        body: "A probability distribution states which values a random variable can take and how likely each is. Instead of listing every probability by hand, we use a few named distributions that match common situations. Choosing one means choosing a simple story about where the data comes from.",
      },
      {
        heading: "Bernoulli: one yes-or-no",
        body: "A Bernoulli variable takes only the values 0 or 1, with P(1) = p. 'Is this email spam?' with p = 0.3 gives P(spam) = 0.3 and P(not spam) = 0.7. Every binary label in classification is a Bernoulli outcome.",
      },
      {
        heading: "Binomial: count the successes",
        body: "Repeat n independent Bernoulli trials with the same p and count the successes: that count is Binomial. For 10 emails, each spam with probability 0.3, the number of spam emails is Binomial. Three spam emails is the most common result (probability about 0.27) and zero is rare (about 0.03).",
      },
      {
        heading: "Uniform: no favorite",
        body: "A Uniform variable on the range [0, 1] has no favorite value: any slice of the range of the same width is equally likely. It models 'no preference', and some methods draw random starting weights from a uniform range.",
      },
      {
        heading: "Gaussian: the bell curve, and how to choose",
        body: "The Gaussian (normal) distribution is a symmetric bell centered at its mean μ, with its width set by the standard deviation σ; about 68% of values fall within one σ of the mean. It models quantities that are the sum of many small effects, such as measurement noise, which is why linear regression assumes Gaussian noise. To choose: a yes/no label is Bernoulli; the number of yeses in n tries is Binomial; no preference over a range is Uniform; a continuous quantity clustered around a typical value is Gaussian.",
      },
    ],
    learnMore:
      "Worked example: for the Binomial with n = 10 and p = 0.3, P(3 spam) = C(10, 3) × 0.3³ × 0.7⁷ = 120 × 0.027 × 0.0824 ≈ 0.267. The Gaussian with μ = 0 and σ = 1 has height about 0.399 at its center and about 0.242 one σ away.",
    python: `from math import comb, exp, pi, sqrt

p = 0.3
print({0: 1 - p, 1: p})            # Bernoulli: {0: 0.7, 1: 0.3}

def binomial(k, n, p):
    return comb(n, k) * p ** k * (1 - p) ** (n - k)

print(round(binomial(3, 10, 0.3), 3), round(binomial(0, 10, 0.3), 3))   # 0.267 0.028

def gaussian(x, mu=0.0, sigma=1.0):
    return exp(-((x - mu) ** 2) / (2 * sigma ** 2)) / (sigma * sqrt(2 * pi))

print(round(gaussian(0), 3), round(gaussian(1), 3))   # 0.399 0.242`,
    quickCheck: {
      question: "Each of 20 independent emails is spam with probability 0.3. Which distribution is the most natural model for the number of spam emails among them?",
      options: [
        "Bernoulli",
        "Uniform",
        "Gaussian measurement noise",
        "Binomial",
      ],
      correctIndex: 3,
      explanation:
        "Counting the successes in a fixed number of independent yes/no trials with the same probability is exactly the Binomial distribution. A single Bernoulli describes just one email.",
    },
  },
  {
    id: "probability-foundations-8",
    title: "Joint Distributions",
    subtitle: "Probabilities for two variables at once",
    prerequisites: ["probability-foundations-7"],
    theory: [
      {
        heading: "Two variables at once",
        body: "So far we studied one random variable at a time. Real data has many at once: a house has both a number of bedrooms and a price. To understand how they relate we need the probability of combinations.",
      },
      {
        heading: "The joint distribution",
        body: "Let X = the number of bedrooms (1, 2 or 3) and Y = the price band (Low or High). The joint distribution gives a probability to every pair of values: P(X = x, Y = y), read 'X is x and Y is y at the same time'. With 3 × 2 = 6 pairs, the numbers fit in a table.",
      },
      {
        heading: "Reading a joint table",
        body: "Rows are X, columns are Y. For 1 bedroom: Low 0.25, High 0.05. For 2 bedrooms: Low 0.20, High 0.20. For 3 bedrooms: Low 0.05, High 0.25. All six entries add up to 1. The entry P(X = 3, Y = High) = 0.25 means 25% of all houses are both 3-bedroom and High-priced.",
      },
      {
        heading: "Relationships become visible",
        body: "Look at the pattern: small houses are mostly Low, big ones mostly High. If bedrooms and price were unrelated, every entry would be the product of its row total and column total. How far the table departs from that pattern is the relationship between the two variables.",
      },
      {
        heading: "Why it matters for ML",
        body: "A dataset with several features is a sample from a joint distribution. Models that learn how features relate to each other and to labels are, one way or another, learning something about a joint distribution.",
      },
    ],
    learnMore:
      "Worked example: if the variables were unrelated, P(X = 3, Y = High) would be P(X = 3) × P(Y = High) = 0.30 × 0.50 = 0.15. The actual entry is 0.25, so 3-bedroom houses are more often High-priced than chance alone would suggest.",
    python: `joint = {
    (1, "Low"): 0.25, (1, "High"): 0.05,
    (2, "Low"): 0.20, (2, "High"): 0.20,
    (3, "Low"): 0.05, (3, "High"): 0.25,
}
print(round(sum(joint.values()), 2))   # 1.0: all six entries add to 1
print(joint[(3, "High")])              # 0.25: 3 bedrooms AND high price`,
    quickCheck: {
      question: "In the joint table, the entry P(X = 3, Y = High) = 0.25. What does it mean?",
      options: [
        "25% of all houses have 3 bedrooms",
        "25% of all houses are both 3-bedroom and High-priced",
        "Among 3-bedroom houses, 25% are High-priced",
        "Houses are High-priced 25% of the time",
      ],
      correctIndex: 1,
      explanation:
        "A joint probability is for the pair happening together, out of ALL houses. The other options describe a marginal or a conditional probability.",
    },
  },
  {
    id: "probability-foundations-9",
    title: "Marginal & Conditional Distributions",
    subtitle: "Collapsing one variable, or slicing by what we know",
    prerequisites: ["probability-foundations-8"],
    theory: [
      {
        heading: "Start from the joint table",
        body: "We keep the bedrooms × price table from the last checkpoint. From a single joint table we can answer two different kinds of questions: one by collapsing a variable, one by slicing.",
      },
      {
        heading: "Marginal: collapse a variable",
        body: "To get the distribution of bedrooms alone, ignore price by adding across it: P(X = x) = Σ over y of P(X = x, Y = y). That gives P(X = 1) = 0.25 + 0.05 = 0.30, P(X = 2) = 0.40 and P(X = 3) = 0.30. This is the marginal distribution of X (the name comes from totals written in the margins of the table).",
      },
      {
        heading: "Conditional: slice and renormalize",
        body: "Suppose we learn the house is High-priced. Keep only the High column: 0.05, 0.20, 0.25. These add up to 0.50, not 1, so divide each by 0.50: P(X | Y = High) = 0.10, 0.40, 0.50. In general P(X = x | Y = y) = P(X = x, Y = y) / P(Y = y), the same restrict-and-renormalize idea as conditional probability.",
      },
      {
        heading: "They answer different questions",
        body: "Marginal: how are bedrooms distributed over all houses? 0.30, 0.40, 0.30. Conditional: how are bedrooms distributed among High-priced houses? 0.10, 0.40, 0.50. Learning the price shifted the picture toward bigger houses. If X and Y were unrelated, the conditional would equal the marginal.",
      },
      {
        heading: "Why it matters for ML",
        body: "A feature's marginal describes its overall behavior. Making a prediction means conditioning: observing some variables and asking about the rest. Both operations return in every probabilistic model, including the Gaussian at the end of this module.",
      },
    ],
    learnMore:
      "Worked example: for the other conditional, P(Y = High | X = 3) = 0.25 / 0.30 ≈ 0.83: among 3-bedroom houses, five out of six are High-priced. Note it is a different number from P(X = 3 | Y = High) = 0.50.",
    python: `joint = {
    (1, "Low"): 0.25, (1, "High"): 0.05,
    (2, "Low"): 0.20, (2, "High"): 0.20,
    (3, "Low"): 0.05, (3, "High"): 0.25,
}
xs = [1, 2, 3]

# marginal: add across the other variable
marginal_x = {x: sum(p for (a, b), p in joint.items() if a == x) for x in xs}
print({x: round(p, 2) for x, p in marginal_x.items()})      # {1: 0.3, 2: 0.4, 3: 0.3}

# conditional: keep the Y = "High" slice, then renormalize
p_high = sum(p for (a, b), p in joint.items() if b == "High")
conditional = {x: joint[(x, "High")] / p_high for x in xs}
print({x: round(p, 2) for x, p in conditional.items()})     # {1: 0.1, 2: 0.4, 3: 0.5}`,
    quickCheck: {
      question: "Using the bedrooms × price table, what is P(X = 3 | Y = High)?",
      options: [
        "0.5: the 0.25 entry divided by the High column total of 0.5",
        "0.25: read straight from the table",
        "0.30: the marginal probability of 3 bedrooms",
        "0.83: the 0.25 entry divided by the 3-bedroom row total of 0.30",
      ],
      correctIndex: 0,
      explanation:
        "Conditioning on Y = High keeps only the High column, which totals 0.50, so we divide by 0.50. Dividing by the row total answers the reverse question, P(Y = High | X = 3).",
    },
  },
  {
    id: "probability-foundations-10",
    title: "Covariance & Correlation",
    subtitle: "Do two variables move together?",
    prerequisites: ["probability-foundations-9"],
    theory: [
      {
        heading: "Do two variables move together?",
        body: "Take 5 houses with size x = 1, 2, 3, 4, 5 (in units of 100 square metres) and price y = 2, 3, 5, 6, 9 (in units of 100 thousand). As size grows, price grows. We want one number that captures how much, and in which direction, two variables vary together.",
      },
      {
        heading: "Covariance: do the deviations agree?",
        body: "For each point, find how far x and y are from their means (x̄ = 3, ȳ = 5) and multiply: (x − x̄)(y − ȳ). The product is positive when both are above or both below their means and negative when one is above and the other below. Covariance is the average of these products: Cov(X, Y) = E[(X − E[X])(Y − E[Y])]. Here the products are 6, 2, 0, 1 and 8, so Cov = 17/5 = 3.4.",
      },
      {
        heading: "Reading the sign",
        body: "Positive covariance: the variables tend to rise together. Negative covariance: when one rises the other tends to fall (reverse the prices and the covariance becomes −3.4). Covariance near zero: no consistent straight-line trend.",
      },
      {
        heading: "Correlation removes the units",
        body: "Covariance depends on units: measure x ten times larger and the covariance becomes ten times larger (34) although the relationship is identical. Correlation divides by both standard deviations: Corr(X, Y) = Cov(X, Y) / (σ_X σ_Y). It is unit-free and always between −1 and +1. Here σ_X = √2 and σ_Y = √6, so Corr = 3.4 / √12 ≈ 0.98: a very strong positive linear relationship.",
      },
      {
        heading: "A warning, and why ML cares",
        body: "Zero correlation does not mean independent. Correlation only sees straight-line relationships: if y = (x − 3)² for x = 1 to 5, then y is completely determined by x, yet covariance and correlation are exactly 0. In ML, strongly correlated features are redundant, and the covariances of all feature pairs form the covariance matrix, the main ingredient of PCA and of the multivariate normal.",
      },
    ],
    learnMore:
      "Worked example: with x = 1, 2, 3, 4, 5, the deviations are −2, −1, 0, 1, 2. For y = 2, 3, 5, 6, 9 (mean 5) they are −3, −2, 0, 1, 4. The products are 6, 2, 0, 1, 8, which sum to 17.",
    python: `def mean(v):
    return sum(v) / len(v)

def cov(x, y):
    mx, my = mean(x), mean(y)
    return sum((a - mx) * (b - my) for a, b in zip(x, y)) / len(x)

def corr(x, y):
    return cov(x, y) / (cov(x, x) ** 0.5 * cov(y, y) ** 0.5)

x = [1, 2, 3, 4, 5]
y = [2, 3, 5, 6, 9]
print(round(cov(x, y), 2), round(corr(x, y), 2))      # 3.4 0.98

x10 = [10 * v for v in x]                              # change of units
print(round(cov(x10, y), 2), round(corr(x10, y), 2))  # 34.0 0.98

parabola = [(v - 3) ** 2 for v in x]                   # y fully determined by x
print(round(cov(x, parabola), 2), round(corr(x, parabola), 2))  # 0.0 0.0`,
    quickCheck: {
      question: "Features A and B have covariance 3.4. Feature A is converted to units 100 times larger. What happens?",
      options: [
        "Covariance stays 3.4 and correlation is multiplied by 100",
        "Neither changes",
        "Covariance becomes 340 and correlation does not change",
        "Both are multiplied by 100",
      ],
      correctIndex: 2,
      explanation:
        "Covariance scales with the units of the variables, so it grows by 100. Correlation divides out both standard deviations, so it is unchanged by rescaling.",
    },
  },
  {
    id: "probability-foundations-11",
    title: "Multivariate Normal",
    subtitle: "A bell curve over many variables, shaped by their covariance",
    prerequisites: ["probability-foundations-10"],
    theory: [
      {
        heading: "From one bell curve to two",
        body: "The one-dimensional Gaussian is a bell with a mean μ and a spread σ. Now describe two variables together, for example a house's size and price, with one smooth bell-shaped cloud over the plane. Each point in the plane is a pair of values, and the cloud is thickest where pairs are most likely.",
      },
      {
        heading: "The mean vector",
        body: "The center of the cloud is the mean vector μ = [μ₁, μ₂], one mean per variable, for instance μ = [3, 2]. It plays the same role as the 1D mean: it is where the bell peaks.",
      },
      {
        heading: "The covariance matrix sets the shape",
        body: "Spread and tilt come from the covariance matrix Σ: variances on its diagonal, covariances off the diagonal. Σ = [[1, 0], [0, 1]] means each variable has variance 1 and the covariance is 0, so the contours (curves of equal height) are circles. Σ = [[1, 0.8], [0.8, 1]] has covariance 0.8, and the circles stretch into tilted ellipses along the direction in which both variables rise together.",
      },
      {
        heading: "Reading the ellipse",
        body: "The long axis of the ellipse points along the direction of greatest variation, and the short axis lies across it. For that Σ the axes run along [1, 1] and [1, −1], with lengths proportional to √1.8 ≈ 1.34 and √0.2 ≈ 0.45. Samples cluster densely near the mean and thin out outward, mostly along the long axis.",
      },
      {
        heading: "Why it matters for ML",
        body: "Many models assume features follow a multivariate Gaussian, which is described by just μ and Σ. A Gaussian Mixture Model, coming later in the course, uses several such bells, each with its own mean and covariance, to describe clusters. The covariance matrix is also what PCA analyzes.",
      },
    ],
    learnMore:
      "Worked example: draw z1 and z2 as independent standard normal numbers and set x1 = 3 + z1 and x2 = 2 + 0.8·z1 + 0.6·z2. Then each variable has variance 1 and their covariance is 0.8, exactly the tilted example above.",
    python: `import random

random.seed(0)
mu = [3.0, 2.0]
samples = []
for _ in range(2000):
    z1, z2 = random.gauss(0, 1), random.gauss(0, 1)   # independent standard normals
    x1 = mu[0] + z1
    x2 = mu[1] + 0.8 * z1 + 0.6 * z2                  # gives covariance 0.8 with x1
    samples.append((x1, x2))

n = len(samples)
m1 = sum(s[0] for s in samples) / n
m2 = sum(s[1] for s in samples) / n
c = sum((s[0] - m1) * (s[1] - m2) for s in samples) / n
print(round(m1, 1), round(m2, 1), round(c, 1))   # 3.0 2.0 0.8`,
    quickCheck: {
      question: "The contours of a two-variable Gaussian are ellipses tilted from lower left to upper right. What does that tell you?",
      options: [
        "The two variables are independent",
        "The mean is at the top right of the picture",
        "Both variances are zero",
        "The two variables have positive covariance",
      ],
      correctIndex: 3,
      explanation:
        "A tilt along the rising diagonal means the variables tend to be high together and low together, which is positive covariance. Independent variables would give axis-aligned ellipses or circles.",
    },
  },
];

// MODULE 5 — Estimation & Uncertainty (8 checkpoints) in Probability Grove.
//
// Estimation for machine learning, taught intuition-first. Recurring examples:
//   - a coin with unknown probability p of heads, observed as H H T H H (4 heads, 1 tail)
//   - nine candidate values of p (0.1 ... 0.9) with a prior that favors p near 0.5
//   - a fair die, for the law of large numbers and the central limit theorem
// Plain readable formulas; Python uses only the standard library. Quick Check
// answer positions are deliberately varied.

import type { CheckpointSpec } from "./builder.js";

export const estimationUncertaintySpecs: CheckpointSpec[] = [
  {
    id: "estimation-uncertainty-1",
    title: "What Are We Estimating?",
    subtitle: "Guessing an unknown number from data, and knowing the guess can vary",
    prerequisites: [],
    theory: [
      {
        heading: "Data we see, numbers we do not",
        body: "Every model rests on numbers we cannot observe directly. A coin has some true probability p of landing heads, but nobody printed it on the coin. What we can observe is data: the flips. Estimation is the job of using observed data to say something sensible about an unknown quantity.",
      },
      {
        heading: "Parameters",
        body: "A quantity that describes a model or a distribution, such as the coin's probability of heads p or the mean μ of a Gaussian, is called a parameter. It is fixed but unknown. Learning a model largely means estimating its parameters, because the parameters determine the model's predictions.",
      },
      {
        heading: "A small example",
        body: "Flip the coin 5 times and see H H T H H: 4 heads out of 5. Which values of p make that plausible? If p were 0.2 we would expect about 1 head in 5; if p were 0.5, about 2.5; if p were 0.8, about 4. Only p = 0.8 matches what we saw, so 0.8 is the most natural guess.",
      },
      {
        heading: "Estimator, estimate, sample",
        body: "A rule that turns data into a guess is an estimator; here the rule is 'heads divided by flips'. The number it gives for one particular dataset, 4/5 = 0.8, is the estimate. Our 5 flips are a sample, a small part of the population (every flip this coin could ever make), and we use the sample to learn about the population.",
      },
      {
        heading: "Estimates vary",
        body: "A different 5 flips, such as H T T H T, gives 2/5 = 0.4 from the very same coin. The parameter did not change; the sample did. Because estimates change from sample to sample, good estimation also asks how far to trust them. That uncertainty is the theme of this whole module.",
      },
    ],
    learnMore:
      "Worked example: three samples from the same coin, H H T H H, H T T H T and H T H H T, give the estimates 0.8, 0.4 and 0.6. All three are honest estimates of one fixed p.",
    python: `samples = {
    "sample 1": "HHTHH",
    "sample 2": "HTTHT",
    "sample 3": "HTHHT",
}
for name, flips in samples.items():
    estimate = flips.count("H") / len(flips)     # the estimator: heads / flips
    print(name, flips, estimate)
# sample 1 HHTHH 0.8
# sample 2 HTTHT 0.4
# sample 3 HTHHT 0.6

# which candidate p best matches 4 heads in 5 flips?
for p in [0.2, 0.5, 0.8]:
    print(p, "expects", p * 5, "heads")          # 1.0, 2.5, 4.0`,
    quickCheck: {
      question: "You flip a coin 5 times and get H H T H H. A friend flips the same coin 5 times and estimates p = 0.4. How should you interpret this?",
      options: [
        "Your friend's coin must be a different coin",
        "One of the two estimates must contain a mistake",
        "Estimates change from sample to sample, while the coin's true p stays the same",
        "The rule 'heads divided by flips' is broken and must be replaced",
      ],
      correctIndex: 2,
      explanation:
        "The parameter p is fixed; each sample is random, so each estimate is random too. Different samples naturally give different estimates, which is why we also care about uncertainty.",
    },
  },
  {
    id: "estimation-uncertainty-2",
    title: "Maximum Likelihood Estimation",
    subtitle: "Choosing the parameter that makes the observed data most likely",
    prerequisites: ["estimation-uncertainty-1", "probability-foundations-7"],
    theory: [
      {
        heading: "Which p explains the data best?",
        body: "We saw H H T H H. Different values of p would have made this result more or less likely. Maximum likelihood estimation (MLE) turns that idea into a rule: pick the parameter value under which the data we actually observed would have been most likely.",
      },
      {
        heading: "Score a candidate",
        body: "Take a candidate p and compute how likely the exact sequence is, flip by flip. Each head contributes p and each tail contributes 1 − p, so for H H T H H the score is p × p × (1 − p) × p × p = p⁴(1 − p). This number is the likelihood of that candidate, written L(p).",
      },
      {
        heading: "Compare candidates",
        body: "p = 0.2 gives 0.2⁴ × 0.8 = 0.0013. p = 0.5 gives 0.5⁵ = 0.031. p = 0.8 gives 0.8⁴ × 0.2 = 0.082. The data are far more likely under 0.8 than under 0.2. Slide p across every value from 0 to 1 and the likelihood traces a curve with a single peak.",
      },
      {
        heading: "The MLE is the peak",
        body: "The value at the top of that curve is the maximum likelihood estimate: p_MLE = argmax over p of L(p), where argmax means 'the value that gives the largest result'. Here the peak is at p = 0.8 = 4/5, the observed fraction of heads. Notice what is fixed and what varies: the data are fixed, the parameter is what we vary.",
      },
      {
        heading: "Why it matters for ML",
        body: "Fitting a probabilistic model usually means maximum likelihood: choose the parameters that make the training data most likely. Logistic regression is trained this way, as we will see later. In practice people maximize the logarithm of the likelihood, because a product of many small numbers becomes a sum, but the peak stays in the same place.",
      },
    ],
    learnMore:
      "Worked example: the likelihood at 0.8 is 0.08192 and at 0.2 it is 0.00128, so the data are exactly 64 times more likely under 0.8. With a different dataset, 3 heads in 12 flips, the peak would be at 3/12 = 0.25.",
    python: `flips = "HHTHH"
heads = flips.count("H")
tails = len(flips) - heads

def likelihood(p):
    return p ** heads * (1 - p) ** tails

for p in [0.2, 0.5, 0.8]:
    print(p, round(likelihood(p), 5))
# 0.2 0.00128
# 0.5 0.03125
# 0.8 0.08192

grid = [i / 100 for i in range(1, 100)]
best = max(grid, key=likelihood)
print(best)   # 0.8`,
    quickCheck: {
      question: "For the flips H H T H H, a student finds L(0.2) = 0.0013, L(0.5) = 0.031 and L(0.8) = 0.082. What does maximum likelihood estimation choose among these three?",
      options: [
        "p = 0.8, because it makes the observed data most likely",
        "p = 0.2, because the smallest likelihood is the safest",
        "p = 0.5, because it is in the middle",
        "None of them, until the true p is known",
      ],
      correctIndex: 0,
      explanation:
        "MLE picks the candidate with the largest likelihood. The data are fixed, and 0.8 makes them the most likely of the three.",
    },
  },
  {
    id: "estimation-uncertainty-3",
    title: "Likelihood vs Probability",
    subtitle: "The same formula answered from two directions",
    prerequisites: ["estimation-uncertainty-2"],
    theory: [
      {
        heading: "One formula, two questions",
        body: "In the last checkpoint we used p⁴(1 − p) for the five flips H H T H H. The same kind of formula appears in two different questions, and mixing them up is a very common mistake. What changes is which part is held fixed.",
      },
      {
        heading: "Probability: the model is fixed",
        body: "Suppose we know the coin has p = 0.7. Now ask how probable each possible result of 5 flips is: 0 heads 0.002, 1 head 0.028, 2 heads 0.132, 3 heads 0.309, 4 heads 0.360, 5 heads 0.168. The parameter is fixed and the data vary. These numbers add up to 1.",
      },
      {
        heading: "Likelihood: the data are fixed",
        body: "Now reverse the viewpoint. We have already seen 4 heads in 5 flips. Ask how well each candidate p explains this result: evaluate the same formula at p = 0.1, 0.2, and so on, with the data held fixed. This is the likelihood function L(p). It is a function of the parameter, and its values do not need to add up to 1.",
      },
      {
        heading: "Compare, but do not misread",
        body: "L(0.7) = 5 × 0.7⁴ × 0.3 ≈ 0.360 and L(0.4) = 5 × 0.4⁴ × 0.6 ≈ 0.077, so 0.7 explains the observed data about 4.7 times better than 0.4. The factor 5 counts the orders in which 4 heads can occur; it scales every value equally, so it never changes where the peak is. A likelihood value is not 'the probability that p is true': it only measures how well a parameter value accounts for the data we saw.",
      },
      {
        heading: "Why it matters for ML",
        body: "Training looks at the likelihood: the training data are fixed and the parameters are varied until they explain it well. Asking a trained model about new data is the probability question: the parameters are now fixed and the data vary.",
      },
    ],
    learnMore:
      "Worked example: the likelihood function for 4 heads in 5 flips peaks at p = 0.8 with value about 0.41. Its values at the nine candidates 0.1 to 0.9 add up to about 1.6, not 1, which is a reminder that it is not a probability distribution over p.",
    python: `from math import comb

def binom(k, n, p):
    return comb(n, k) * p ** k * (1 - p) ** (n - k)

# Probability view: p is FIXED at 0.7, the data (k heads) vary
probs = [binom(k, 5, 0.7) for k in range(6)]
print([round(v, 3) for v in probs])   # [0.002, 0.028, 0.132, 0.309, 0.36, 0.168]
print(round(sum(probs), 2))           # 1.0: probabilities of all possible data add to 1

# Likelihood view: the data (4 heads in 5) are FIXED, p varies
def likelihood(p):
    return binom(4, 5, p)

print(round(likelihood(0.7), 3), round(likelihood(0.4), 3))   # 0.36 0.077
print(round(likelihood(0.7) / likelihood(0.4), 1))             # 4.7
grid = [i / 10 for i in range(1, 10)]
print(round(sum(likelihood(p) for p in grid), 2))              # 1.63: not 1`,
    quickCheck: {
      question: "You have already observed 4 heads in 5 flips and now compare p = 0.7 with p = 0.4. Which description is correct?",
      options: [
        "You ask how probable each possible dataset is while the parameter stays fixed",
        "The likelihood values must add up to 1 across all values of p",
        "The likelihood of 0.7 is the probability that p really equals 0.7",
        "You hold the data fixed and ask how well each value of p explains it",
      ],
      correctIndex: 3,
      explanation:
        "Likelihood fixes the observed data and varies the parameter. Probability does the opposite. Likelihood values are not a probability distribution over p and do not have to sum to 1.",
    },
  },
  {
    id: "estimation-uncertainty-4",
    title: "Bayesian Thinking",
    subtitle: "Updating a belief about a parameter after seeing data",
    prerequisites: ["estimation-uncertainty-3", "probability-foundations-3"],
    theory: [
      {
        heading: "Beliefs about p",
        body: "So far p was one unknown number to be estimated. A Bayesian describes the uncertainty about p with probabilities: for each candidate value of p, how plausible is it? We will use nine candidates, 0.1, 0.2, up to 0.9.",
      },
      {
        heading: "The prior",
        body: "Before any flips, suppose we think the coin is probably close to fair. We express that with a prior: weights 1, 2, 3, 4, 5, 4, 3, 2, 1 (out of 25) on the nine candidates, tallest at 0.5. The prior is the belief we hold before seeing data.",
      },
      {
        heading: "What the data say: the likelihood",
        body: "Now we observe H H T H H. The likelihood of each candidate is p⁴(1 − p), exactly as in the earlier checkpoints, and it is tallest near 0.8. It reports what the data say, ignoring our prior.",
      },
      {
        heading: "Combine: posterior ∝ likelihood × prior",
        body: "Multiply the prior and the likelihood candidate by candidate, then rescale the results so they add up to 1. This is Bayes' rule from the last module applied to a parameter: posterior ∝ likelihood × prior. The symbol ∝ means 'proportional to', so the exact normalizing constant can wait until the end.",
      },
      {
        heading: "The belief shifts",
        body: "The posterior is the updated belief. It sits between the prior (peak at 0.5) and the likelihood (peak at 0.8): the largest posterior weight is at 0.7 (about 0.24), with 0.6 close behind (about 0.23). The data moved the belief toward heads, but the prior kept it from jumping all the way to 0.8. In ML this lets us use prior knowledge and keep honest uncertainty about parameters.",
      },
    ],
    learnMore:
      "Worked example: with a flat prior (all nine candidates weighted equally) the posterior would be proportional to the likelihood alone, and its peak would be at 0.8. The 'close to fair' prior is what moves the peak to 0.7.",
    python: `thetas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
weights = [1, 2, 3, 4, 5, 4, 3, 2, 1]
prior = [w / sum(weights) for w in weights]

heads, tails = 4, 1                       # H H T H H
likelihood = [t ** heads * (1 - t) ** tails for t in thetas]

unnormalized = [pr * li for pr, li in zip(prior, likelihood)]
posterior = [u / sum(unnormalized) for u in unnormalized]

print([round(p, 3) for p in posterior])
best = thetas[posterior.index(max(posterior))]
print(best)    # 0.7`,
    quickCheck: {
      question: "In the coin example the prior favors p near 0.5 and the data (H H T H H) favor p near 0.8. What does the posterior look like?",
      options: [
        "Identical to the prior, because a prior always wins",
        "In between: the data move the belief toward 0.8 while the prior holds it back",
        "Identical to the likelihood, because data always win",
        "Undefined, because the prior and the data disagree",
      ],
      correctIndex: 1,
      explanation:
        "The posterior combines both. It shifts toward what the data favor, but the prior keeps it from moving all the way when the data are limited.",
    },
  },
  {
    id: "estimation-uncertainty-5",
    title: "MAP Estimation",
    subtitle: "The single most probable parameter after seeing the data",
    prerequisites: ["estimation-uncertainty-4"],
    theory: [
      {
        heading: "One best guess from a belief",
        body: "The posterior is a whole belief over parameter values, but sometimes we want a single number. The maximum a posteriori (MAP) estimate is the parameter value where the posterior is highest: θ_MAP = argmax over θ of P(θ | data).",
      },
      {
        heading: "Skip the normalizer",
        body: "Because posterior ∝ likelihood × prior, and the normalizing constant is the same for every candidate, the peak does not move if we leave it out. So θ_MAP = argmax over θ of P(data | θ) × P(θ): the same score that MLE maximizes, multiplied by the prior.",
      },
      {
        heading: "Same coin, two peaks",
        body: "For H H T H H and the prior from the last checkpoint, the likelihood peaks at 0.8 (the MLE) and the prior peaks at 0.5. Multiply them and the product peaks at 0.7. So MLE = 0.8 but MAP = 0.7.",
      },
      {
        heading: "The prior pulls",
        body: "The prior acts like a pull toward values we found plausible beforehand. With only 5 flips that pull is strong enough to move the peak from 0.8 down to 0.7. If the prior were flat, every candidate weighted equally, multiplying by it would change nothing and MAP would equal MLE.",
      },
      {
        heading: "Why it matters for ML",
        body: "Many training methods maximize a data-fit score plus a term that expresses a preference about the parameters. MAP is the probabilistic version of that idea. For now treat it as an intuition; we meet its relatives, such as regularization, later in the course.",
      },
    ],
    learnMore:
      "Worked example: the scores likelihood × prior on the candidates 0.6, 0.7, 0.8 are 4 × 0.0518 = 0.207, 3 × 0.0720 = 0.216 and 2 × 0.0819 = 0.164 (prior weights times the likelihood). The middle candidate wins, so MAP = 0.7.",
    python: `thetas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
weights = [1, 2, 3, 4, 5, 4, 3, 2, 1]
prior = dict(zip(thetas, weights))

def likelihood(t):
    return t ** 4 * (1 - t)               # H H T H H

def posterior_score(t):
    return likelihood(t) * prior[t]       # proportional to the posterior

mle = max(thetas, key=likelihood)
map_estimate = max(thetas, key=posterior_score)
print(mle, map_estimate)      # 0.8 0.7

flat = {t: 1 for t in thetas}
print(max(thetas, key=lambda t: likelihood(t) * flat[t]))   # 0.8: a flat prior changes nothing`,
    quickCheck: {
      question: "For H H T H H, the likelihood peaks at 0.8 and the prior peaks at 0.5, and the MAP estimate turns out to be 0.7. How should you read this?",
      options: [
        "The data must be wrong, because MAP disagrees with MLE",
        "MAP ignores the likelihood and simply returns the peak of the prior",
        "The product of likelihood and prior peaks between the two peaks, because the prior pulls the estimate",
        "MAP is always the average of the MLE and the prior's peak",
      ],
      correctIndex: 2,
      explanation:
        "MAP maximizes likelihood × prior. The prior pulls the peak away from the MLE toward its own favorite value. It is not an average (that would be 0.65), just where the product peaks.",
    },
  },
  {
    id: "estimation-uncertainty-6",
    title: "MLE vs MAP",
    subtitle: "Data only, or data plus a prior belief",
    prerequisites: ["estimation-uncertainty-5"],
    theory: [
      {
        heading: "What each one uses",
        body: "MLE uses only the likelihood: it asks which parameter makes the data most likely. MAP uses the likelihood and a prior: it asks which parameter is most probable after combining the data with what we believed. Neither is universally better; they answer slightly different questions.",
      },
      {
        heading: "Small data: they can disagree",
        body: "With 5 flips (4 heads), our nine-candidate example gives MLE = 0.8 and MAP = 0.7: the prior still has a say. An extreme case shows why that can help. Three flips that are all heads give MLE = 3/3 = 1.0, the claim that tails is impossible. A prior that favors moderate values keeps the estimate more cautious.",
      },
      {
        heading: "More data: they converge",
        body: "Keep the same share of heads but gather more flips. For 10 flips (8 heads) MAP is still 0.7. For 20 flips (16 heads) MAP becomes 0.8, and so does it for 50 flips (40 heads). The likelihood grows sharper and sharper, so it outweighs the same prior and MAP lands on the MLE. (These numbers are for our nine-candidate grid.)",
      },
      {
        heading: "A quick comparison",
        body: "Uses the likelihood: MLE yes, MAP yes. Uses a prior: MLE no, MAP yes. With little data: MLE follows the data alone, MAP blends data and prior. With lots of data: both end up close.",
      },
      {
        heading: "Why it matters for ML",
        body: "In machine learning you often have limited data and want to avoid extreme parameters. A prior that prefers modest parameters acts like a gentle brake, and in several models MAP estimation looks like regularized training. We return to regularization later; for now remember the pattern: little data, the prior matters; lots of data, the data dominate.",
      },
    ],
    learnMore:
      "Worked example: at 5 flips the likelihood curve is wide and the prior wins a tug of war (MAP 0.7). At 50 flips, the likelihood of 0.7 is only about 28% of the likelihood of 0.8, which is not enough to make up for the prior favoring 0.7 by a ratio of 3 to 2, so 0.8 wins.",
    python: `thetas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
weights = [1, 2, 3, 4, 5, 4, 3, 2, 1]
prior = dict(zip(thetas, weights))

def best(k, n, use_prior):
    def score(t):
        s = t ** k * (1 - t) ** (n - k)
        return s * (prior[t] if use_prior else 1)
    return max(thetas, key=score)

print("n  MLE  MAP")
for n in [5, 10, 20, 50]:
    k = round(0.8 * n)                    # same share of heads each time
    print(n, best(k, n, False), best(k, n, True))
# 5 0.8 0.7
# 10 0.8 0.7
# 20 0.8 0.8
# 50 0.8 0.8
print(3 / 3)   # 1.0: the MLE after 3 heads in 3 flips`,
    quickCheck: {
      question: "You have only 5 coin flips and a sensible prior. How will the MAP estimate relate to the MLE?",
      options: [
        "They are always identical, because MLE already uses all the information",
        "MAP is worse, because priors are always wrong",
        "MAP ignores the data and returns the prior",
        "MAP may differ from MLE, pulled toward the prior, and moves closer to it as more data arrive",
      ],
      correctIndex: 3,
      explanation:
        "With little data the prior still has influence, so MAP can differ from MLE. As data accumulate, the likelihood dominates and the two estimates come together.",
    },
  },
  {
    id: "estimation-uncertainty-7",
    title: "Law of Large Numbers",
    subtitle: "Why averages settle down as data accumulate",
    prerequisites: ["estimation-uncertainty-6", "probability-foundations-5"],
    theory: [
      {
        heading: "Estimating by averaging",
        body: "Suppose the coin truly has p = 0.8. The fraction of heads after n flips is a sample mean. Does it get close to 0.8? In the short run, not reliably: after 5 flips it could easily be 0.4 or 1.0.",
      },
      {
        heading: "Watch the running average",
        body: "Track the fraction of heads after each new flip. Early on it jumps around a lot, because a single flip is a big share of a small sample. After 10 flips it is still noisy, after 100 it moves less, and after 1000 flips it is usually close to 0.8.",
      },
      {
        heading: "The law",
        body: "The law of large numbers (LLN) says: as the number of independent samples grows, the sample mean settles toward the true expected value (here p = 0.8). It is a statement about what happens as n grows, not about every individual step.",
      },
      {
        heading: "What it does not promise",
        body: "It does not say every new flip brings the average closer: the running average can drift away for a stretch before returning. It says nothing certain about a small sample such as 5 flips. And two separate runs of flips wander differently while both heading toward the same value.",
      },
      {
        heading: "Why it matters for ML",
        body: "An average over a larger dataset is a more stable estimate of an expectation. That is why the average loss on a large dataset approximates the true expected loss from the Expectation lesson, and why more data generally gives steadier estimates. How tightly such averages cluster is the question of the next checkpoint.",
      },
    ],
    learnMore:
      "Worked example: with p = 0.8, the fraction of heads after 5 flips is one of 0, 0.2, 0.4, 0.6, 0.8 or 1.0, and each one occurs with a visible chance. After 1000 flips the fraction almost always lies within a few hundredths of 0.8.",
    python: `import random

random.seed(3)
p = 0.8
flips = [1 if random.random() < p else 0 for _ in range(1000)]

for n in [5, 10, 100, 1000]:
    print(n, round(sum(flips[:n]) / n, 3))
# with this seed: 5 1.0 / 10 0.9 / 100 0.71 / 1000 0.795
# the fraction wanders at first (and can even move away from 0.8), then settles near it`,
    quickCheck: {
      question: "After a very large number of flips of a coin, which statement matches the law of large numbers?",
      options: [
        "The fraction of heads is usually close to the coin's true p, and gets steadier as n grows",
        "Each additional flip always moves the fraction of heads closer to p",
        "The first 10 flips must already match p exactly",
        "The coin starts landing tails more often, to balance out earlier heads",
      ],
      correctIndex: 0,
      explanation:
        "LLN is about the sample mean settling near the expected value as n grows. It does not promise that every step improves, and it does not make the coin 'compensate' for earlier flips.",
    },
  },
  {
    id: "estimation-uncertainty-8",
    title: "Central Limit Theorem",
    subtitle: "Why repeated averages form a bell shape",
    prerequisites: ["estimation-uncertainty-7"],
    theory: [
      {
        heading: "A different question from LLN",
        body: "The law of large numbers asked: where does the sample mean go as n grows? The central limit theorem (CLT) asks something else. If we repeat the whole experiment many times, taking a fresh sample of n values each time and computing its mean, how are those sample means distributed?",
      },
      {
        heading: "Start with a flat population",
        body: "Roll a fair die. The population is flat: each face 1 to 6 has probability 1/6, the mean is μ = 3.5 and the standard deviation is σ ≈ 1.71. A single roll is clearly not bell-shaped.",
      },
      {
        heading: "Take samples, record the mean",
        body: "Roll the die 5 times and average: 2, 6, 6, 1, 4 has mean 3.8. Do it again, and again; each repetition gives one sample mean. Collect thousands of them and draw a histogram. This histogram is of the sample means, not of the individual rolls.",
      },
      {
        heading: "The means form a bell",
        body: "With samples of n = 5 the histogram of means is already roughly bell-shaped and centered at 3.5. With n = 30 it is more bell-shaped and much narrower. The CLT says that, for independent samples with finite variance, the distribution of the sample mean approaches a normal distribution as n grows, whatever the shape of the population.",
      },
      {
        heading: "Standard error, and why ML cares",
        body: "The spread of the sample means is σ/√n, called the standard error: about 0.76 for n = 5 and 0.31 for n = 30. Four times the data halves the uncertainty. This is why averages behave predictably, why estimates can carry error bars, and why Gaussian noise is a common modeling assumption. The raw die rolls never become bell-shaped; only their averages do.",
      },
    ],
    learnMore:
      "Worked example: σ for a fair die is √(35/12) ≈ 1.71. For n = 30, σ/√30 ≈ 0.31, so about two thirds of sample means fall within 0.31 of 3.5, that is between roughly 3.19 and 3.81.",
    python: `import random
from math import sqrt

random.seed(0)
sigma = sqrt(35 / 12)                      # standard deviation of one die roll

def sample_mean(n):
    return sum(random.randint(1, 6) for _ in range(n)) / n

for n in [5, 30]:
    means = [sample_mean(n) for _ in range(2000)]
    m = sum(means) / len(means)
    sd = sqrt(sum((x - m) ** 2 for x in means) / len(means))
    print(n, round(m, 2), round(sd, 2), round(sigma / sqrt(n), 2))
# 5 3.49 0.77 0.76
# 30 3.5 0.31 0.31
# columns: n, mean of the means, spread of the means, theory sigma / sqrt(n)`,
    quickCheck: {
      question: "You roll a fair die 30 times and record the average, then repeat this 2000 times. What does a histogram of the 2000 averages look like?",
      options: [
        "Flat, like the die itself, with every value from 1 to 6 equally common",
        "Roughly bell-shaped, centered near 3.5, and much narrower than the spread of single rolls",
        "The same flat shape as a single roll, only wider",
        "Bell-shaped but centered near 6, because larger faces count more",
      ],
      correctIndex: 1,
      explanation:
        "The CLT is about the distribution of sample means: approximately normal, centered at the population mean 3.5, with spread σ/√n. The individual rolls stay flat; only their averages become bell-shaped.",
    },
  },
];

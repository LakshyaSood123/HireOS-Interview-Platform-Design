// ZONE 1 — ML BASECAMP. The Machine Learning Foundations module keeps its three
// published checkpoints (1–3; content overrides live in module1-overrides.ts)
// and these four, numbered 4–7.

import type { CheckpointSpec } from "./builder.js";

export const basecampAdditions: CheckpointSpec[] = [
  {
    id: "ml-foundations-4",
    title: "Training, Validation & Testing",
    subtitle: "Why you hold data back, and what each split is for",
    prerequisites: ["ml-foundations-3"],
    theory: [
      {
        heading: "Why not train on everything?",
        body: "If the model sees every example while it is being fitted, its score only shows how well it memorized them. To estimate performance on unseen examples, some data has to be held back while the model is built.",
      },
      {
        heading: "Three sets, three jobs",
        body: "The training set fits the model's parameters. The validation set compares choices, such as model type or settings, and helps detect overfitting. The test set is used once, at the end, for the final unbiased evaluation.",
      },
      {
        heading: "An illustrative split",
        body: "A common example is 70% training, 15% validation and 15% test. This is an illustration, not a required ratio. The right split depends on how much data you have.",
      },
      {
        heading: "Data leakage",
        body: "If information from validation or test examples influences training, the reported score is too optimistic. For example, computing scaling statistics on all the data leaks the test set into training. Keep held-out examples out of every training decision.",
      },
    ],
    learnMore:
      "Worked example: 100 houses split 70 / 15 / 15. Model A has validation error 4.2 and model B has 3.1, so you choose B. If you retrain B on training plus validation data, the test set still gives one honest number, for example 3.5.",
    python: `import random

def train_val_test_split(rows, val_fraction=0.15, test_fraction=0.15, seed=0):
    rng = random.Random(seed)
    shuffled = rows[:]
    rng.shuffle(shuffled)
    n = len(shuffled)
    n_test = int(n * test_fraction)
    n_val = int(n * val_fraction)
    test = shuffled[:n_test]
    val = shuffled[n_test:n_test + n_val]
    train = shuffled[n_test + n_val:]
    return train, val, test

rows = list(range(100))
train, val, test = train_val_test_split(rows)
print(len(train), len(val), len(test))  # 70 15 15`,
    quickCheck: {
      question: "Which dataset should be used for the final, unbiased estimate of performance on new data?",
      options: [
        "The training set",
        "The test set, used once after all choices are fixed",
        "The validation set, after many rounds of tuning",
        "Whichever set has the highest accuracy",
      ],
      correctIndex: 1,
      explanation:
        "The test set was never used to train or to choose settings, so its score estimates performance on new data. The validation score is biased by repeated tuning, and the training score is biased by fitting.",
    },
  },
  {
    id: "ml-foundations-5",
    title: "Generalization, Underfitting & Overfitting",
    subtitle: "Why a model that is too simple or too flexible both fail",
    prerequisites: ["ml-foundations-4"],
    theory: [
      {
        heading: "The goal is unseen data",
        body: "Training error only tells you how well the model fits examples it has already seen. What we need is performance on new examples. That is generalization.",
      },
      {
        heading: "Underfitting",
        body: "An underfitting model is too simple for the pattern. A flat line through data that follows a curve misses the trend, so the error stays high on training examples and on validation examples too.",
      },
      {
        heading: "Overfitting",
        body: "An overfitting model is flexible enough to follow the noise in the training examples. Its training error becomes very low, but its validation error rises because the noise does not repeat in new data.",
      },
      {
        heading: "A good fit and the real goal",
        body: "A good fit captures the main trend without memorizing the noise, so training and validation errors both stay low. The goal is not the lowest training error. The goal is performance on unseen data.",
      },
    ],
    learnMore:
      "Worked example: points follow a gentle curve. A straight line misses the curve across the whole range (underfit). A degree-10 polynomial passes through every training point but swings wildly between them (overfit). A quadratic follows the curve and does well on new points (balanced).",
    python: `def mean_squared_error(predictions, actuals):
    return sum((p - a) ** 2 for p, a in zip(predictions, actuals)) / len(actuals)

actuals = [1, 9, 4]

# A model that predicts the same value everywhere is too simple here.
print(mean_squared_error([5, 5, 5], actuals))   # 11.0  (underfit: high error)

# A model that memorized these exact points is perfect on them.
print(mean_squared_error([1, 9, 4], actuals))   # 0.0   (training error only)`,
    quickCheck: {
      question: "A model has 99% training accuracy and 71% validation accuracy. What is the most likely problem?",
      options: [
        "The model generalizes well",
        "The validation set is too large",
        "The model is underfitting",
        "The model is overfitting",
      ],
      correctIndex: 3,
      explanation:
        "A 28-point gap between training and validation accuracy is the overfitting pattern. The model learned the training examples, including their noise, and does not carry that over to unseen examples.",
    },
  },
  {
    id: "ml-foundations-6",
    title: "Supervised vs Unsupervised Learning",
    subtitle: "Learning from known answers versus discovering structure",
    prerequisites: ["ml-foundations-5"],
    theory: [
      {
        heading: "Supervised: learn from known answers",
        body: "Every training example has a target y. The model learns a mapping from X to y. Classification predicts a category, such as spam or not spam. Regression predicts a number, such as a house price.",
      },
      {
        heading: "Unsupervised: find structure in X",
        body: "Only the inputs X are given. The algorithm looks for structure, such as clusters of similar examples (clustering), or a smaller set of features that still describes the data well (dimensionality reduction).",
      },
      {
        heading: "How to decide",
        body: "Ask: do I already know the answer I want the model to learn from? If yes, the problem is usually supervised. If not, and the goal is to discover groups or structure, it is usually unsupervised.",
      },
      {
        heading: "Same data, different question",
        body: "Emails labelled spam or not spam support supervised classification. The same emails without labels, grouped by their wording, support unsupervised clustering.",
      },
    ],
    learnMore:
      "Worked example: a list of emails with a word count and a label. Supervised learning receives pairs (word count, label). Unsupervised learning receives only the word counts and must find patterns without being told which emails are spam.",
    python: `emails = [
    {"words": 3, "label": "spam"},
    {"words": 40, "label": "not spam"},
]

# Supervised: the learner receives (x, y) pairs.
supervised_examples = [(e["words"], e["label"]) for e in emails]

# Unsupervised: the learner receives only x.
unsupervised_inputs = [e["words"] for e in emails]

print(supervised_examples)  # [(3, 'spam'), (40, 'not spam')]
print(unsupervised_inputs)  # [3, 40]`,
    quickCheck: {
      question: "Which scenario is unsupervised learning?",
      options: [
        "Predict whether a loan will default, using past loans labelled as defaulted or repaid",
        "Estimate a house price from past sales that have known prices",
        "Group shoppers into segments using purchase histories that have no segment labels",
      ],
      correctIndex: 2,
      explanation:
        "The shopper segments are not given in the data, so the algorithm must discover them from the features. The loan and house-price examples both have known answers to learn from, so they are supervised.",
    },
  },
  {
    id: "ml-foundations-7",
    title: "The Machine Learning Workflow",
    subtitle: "From a vague goal to a model you can trust",
    prerequisites: ["ml-foundations-6"],
    theory: [
      {
        heading: "From goal to model",
        body: "Define the problem, collect and understand the data, choose the features and the target, and split the data. Then choose a simple model and train it on the training houses only.",
      },
      {
        heading: "Validate, improve, test once",
        body: "Measure the error on validation houses. If it is too high, improve the features or the model and validate again. Only after every choice is fixed should the test houses be measured, and that happens once.",
      },
      {
        heading: "Use the model",
        body: "Inference: give the model a new house's features and it returns an estimated price. The model estimates the price; it does not look it up.",
      },
      {
        heading: "Monitor",
        body: "Real markets change over time: prices move and neighbourhoods change. Keep watching the errors after release, and revisit the model when they drift.",
      },
    ],
    learnMore:
      "Worked example, one house-price model throughout. Goal: predict sale price. Features: area, bedrooms, age. Target: sale price. Split 1,000 past sales into 70 / 15 / 15. Train a simple regression on the training houses. Validation error is too high, so you add a feature and retrain. Measure the test houses once and report that error. A new house then gets an estimated price.",
    python: `def split(data):
    n = len(data)
    return data[:int(0.7 * n)], data[int(0.7 * n):int(0.85 * n)], data[int(0.85 * n):]

def run_workflow(data, train_fn, eval_fn):
    train, val, test = split(data)     # split the data
    model = train_fn(train)            # train on the training set
    val_score = eval_fn(model, val)    # evaluate on validation
    return model, val_score            # test is reserved for the final report

houses = list(range(20))
model, score = run_workflow(
    houses,
    lambda t: sum(t) / len(t),
    lambda m, v: sum(abs(m - x) for x in v) / len(v),
)
print(round(model, 2), round(score, 2))  # 6.5 8.5`,
    quickCheck: {
      question: "You have trained a house-price model and are improving it by checking errors on the validation houses. What should happen before you measure the test houses?",
      options: [
        "Retrain the model on the test houses to improve it",
        "Finish improving the model using validation results, so every choice is fixed",
        "Check the test error repeatedly and adjust the features each time",
        "Remove the validation houses to save space",
      ],
      correctIndex: 1,
      explanation:
        "Validation results guide improvements. Only after the model and its settings are fixed should the test houses be measured, once, for the final estimate. Adjusting the model after seeing test results makes that estimate optimistic.",
    },
  },
];

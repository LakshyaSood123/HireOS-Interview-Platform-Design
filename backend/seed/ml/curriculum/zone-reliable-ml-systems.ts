// MODULE 13 — Building Reliable ML Systems (11 checkpoints) in Model Summit, the final zone.
//
// One project throughout: customer churn (positive class = churn). 1,000 observations over 20 weeks, split chronologically
// 700 / 150 / 150. Validation confusion matrices (TP, FP, FN, TN): baseline 12/10/18/110, logistic-style 21/12/9/108, tree-style
// 24/17/6/103. Tree depth results (train F1 / validation F1): 1: 0.48/0.46, 2: 0.62/0.58, 4: 0.76/0.676, 8: 0.97/0.59.
// Final test (tree-style, depth 4): 22/19/6/103. Python uses only the standard library; every snippet was executed and its real
// output is appended as comments.

import type { CheckpointSpec } from "./builder.js";

export const reliableMlSystemsModuleSpecs: CheckpointSpec[] = [
  {
    id: "reliable-ml-systems-1",
    title: "Frame the Problem",
    subtitle: "Start from the decision, not from the algorithm",
    prerequisites: ["ml-foundations-7"],
    theory: [
      {
        heading: "Machine learning starts before the algorithm",
        body: "This final module follows one project from start to finish: predicting customer churn for a subscription service. The request arrives as a wish: \"We want to reduce customer churn.\" That is a goal, not an ML task. Choosing a model now would be like choosing a tool before knowing what to build.",
      },
      {
        heading: "Turn the wish into a question",
        body: "A usable question names its parts. The prediction unit is one subscriber on the first day of a month. The target event is cancelling within the next 30 days. The horizon is 30 days. The inputs may only use what is known on that first day. The question becomes: using information available on the first day of the month, predict whether this customer will cancel in the next 30 days.",
      },
      {
        heading: "Say what success means",
        body: "Write the success criterion before modelling. Here the team can contact a limited number of customers with an offer, so the goal is to catch at least 75% of the customers who will churn while keeping at least half of the contacted customers genuine churners (recall of at least 0.75, precision of at least 0.50). Without a criterion, any result can be called good.",
      },
      {
        heading: "Know the base rate",
        body: "In our data about 20% of customers churn: 30 of 150 customers in the validation sample. A rule that predicts \"nobody churns\" is right for 120 of 150 customers, an accuracy of 0.80, and finds none of the churners. A baseline like this tells us what a model has to beat, and shows why accuracy alone will not do.",
      },
      {
        heading: "Not every problem needs ML",
        body: "Ask first whether a simple rule would work, whether there is enough history, and whether the outcome can be measured after the fact. If the answer to the last question is no, we cannot train or check a model at all. A clear framing also lists constraints, such as how often predictions are needed and who will act on them.",
      },
    ],
    learnMore:
      "Worked example: the framed task is: unit = one subscriber on the first day of a month; target = cancels within 30 days (1) or stays (0); inputs = information known on that day; success = recall at least 0.75 with precision at least 0.50. With 30 churners among 150 validation customers the base rate is 0.20, so the do-nothing rule scores 0.80 accuracy and 0 recall. Every later lesson in this module uses the same project and the same numbers.",
    python: `# the vague request, turned into a measurable ML task
task = {
    "goal": "reduce customer churn",
    "unit": "one subscriber on the first day of a month",
    "target": "churned_30d = 1 if the customer cancels within the next 30 days",
    "horizon_days": 30,
    "data_available": "only information known on that first day",
    "success": "recall >= 0.75 with precision >= 0.50",
}
required = ["unit", "target", "horizon_days", "data_available", "success"]
print("task fully framed:", all(task.get(key) for key in required))

# before any model: how common is the event, and what does a do-nothing rule score?
customers, churners = 150, 30
print("churn rate:", churners / customers)
print("'nobody churns' accuracy:", (customers - churners) / customers, " recall:", 0 / churners)

# Output:
# task fully framed: True
# churn rate: 0.2
# 'nobody churns' accuracy: 0.8  recall: 0.0`,
    quickCheck: {
      question: "A manager says: \"Use machine learning to fix churn.\" Which next step best turns this into an ML problem?",
      options: ["Pick the most accurate algorithm available and train it on all customer records", "Collect as many columns as possible and let the model decide what matters", "Define the prediction unit, the target event, the time horizon, the information available at prediction time, and how success will be measured", "Wait until a customer cancels, then record why"],
      correctIndex: 2,
      explanation:
        "A framed problem names the unit, the target, the horizon, the data available at prediction time and the success criterion. Choosing an algorithm or collecting columns first skips the decisions that make a model useful and testable.",
    },
  },
  {
    id: "reliable-ml-systems-2",
    title: "Define Features and Targets",
    subtitle: "What the model may see, and what it must predict",
    prerequisites: ["reliable-ml-systems-1"],
    theory: [
      {
        heading: "Features and target",
        body: "Features are the inputs the model may use. The target is the outcome it must predict. For our project the features are tenure in months, monthly usage in hours, support tickets, plan price and days since last activity. The target is churned_30d: 1 if the customer cancels in the next 30 days, 0 if they stay.",
      },
      {
        heading: "Available at prediction time",
        body: "A column is a valid feature only if its value would be known on the day the prediction is made. A customer's history of tickets and usage is known. Whether the customer will cancel next month is not, and neither is anything recorded because they cancelled.",
      },
      {
        heading: "A leaky column",
        body: "Suppose the table also has account_closed_date, filled in only after a customer leaves. Every churner has a date and every customer who stays has none, so the rule \"has a closed date\" predicts the target perfectly. That is leakage: the column contains the outcome, so the model looks brilliant in testing and fails in real use, when the date does not yet exist.",
      },
      {
        heading: "Strong is not the same as valid",
        body: "A feature can be highly predictive and still be invalid. Predictive power is only a reason to keep a feature after it passes the question: would we know this on the prediction day? A suspiciously perfect feature is a reason to look for leakage.",
      },
      {
        heading: "Build the feature set",
        body: "List every candidate column, mark each as available at prediction time or not, and drop the ones that are not. Then write the feature matrix X (one row per customer, one column per feature) and the target vector y. Leakage is far cheaper to remove now than to discover after launch.",
      },
    ],
    learnMore:
      "Worked example: six customers have tenure, usage, tickets, price, days inactive and an account_closed_date. The three who churned have dates in March; the three who stayed have none. The rule \"closed date present\" is right for 6 of 6 customers, which looks perfect, but the date is only written when the customer leaves, so it would be empty for everyone on the day of prediction. The five remaining columns form the feature set.",
    python: `columns = {                       # column: known on the prediction day?
    "tenure_months": True, "monthly_usage_hours": True, "support_tickets": True,
    "plan_price": True, "days_since_last_activity": True,
    "account_closed_date": False,       # only filled in AFTER a customer has left
}
rows = [
    {"tenure_months": 24, "monthly_usage_hours": 18.5, "support_tickets": 0, "plan_price": 20, "days_since_last_activity": 2, "account_closed_date": None, "churned_30d": 0},
    {"tenure_months": 3, "monthly_usage_hours": 4.0, "support_tickets": 3, "plan_price": 20, "days_since_last_activity": 28, "account_closed_date": "2024-03-02", "churned_30d": 1},
    {"tenure_months": 14, "monthly_usage_hours": 11.0, "support_tickets": 1, "plan_price": 30, "days_since_last_activity": 6, "account_closed_date": None, "churned_30d": 0},
    {"tenure_months": 8, "monthly_usage_hours": 6.5, "support_tickets": 2, "plan_price": 30, "days_since_last_activity": 21, "account_closed_date": "2024-03-10", "churned_30d": 1},
    {"tenure_months": 36, "monthly_usage_hours": 22.0, "support_tickets": 0, "plan_price": 20, "days_since_last_activity": 1, "account_closed_date": None, "churned_30d": 0},
    {"tenure_months": 5, "monthly_usage_hours": 5.0, "support_tickets": 4, "plan_price": 20, "days_since_last_activity": 35, "account_closed_date": "2024-03-18", "churned_30d": 1},
]
target = "churned_30d"
features = [name for name, known in columns.items() if known]
print("features:", features)
print("target:", target)

# a leaky column "predicts" perfectly, but it would not exist at prediction time
right = sum((row["account_closed_date"] is not None) == bool(row[target]) for row in rows)
print("closed-date rule is right for", right, "of", len(rows), "customers -> leakage, not skill")

X = [[row[name] for name in features] for row in rows]
y = [row[target] for row in rows]
print("first feature row:", X[0], " first target:", y[0])

# Output:
# features: ['tenure_months', 'monthly_usage_hours', 'support_tickets', 'plan_price', 'days_since_last_activity']
# target: churned_30d
# closed-date rule is right for 6 of 6 customers -> leakage, not skill
# first feature row: [24, 18.5, 0, 20, 2]  first target: 0`,
    quickCheck: {
      question: "A column called cancellation_reason is filled in for every customer who left and is empty for those who stayed. A model using it reaches 100% accuracy. What should the team conclude?",
      options: ["The column is the best feature, so it should be kept and the model shipped", "The column is leakage: it only exists after the outcome, so it must be removed before training and testing", "The model is overfitting, so a simpler algorithm should be used with the same column", "The result proves the other features are unnecessary"],
      correctIndex: 1,
      explanation:
        "A feature must be known when the prediction is made. cancellation_reason is recorded only after a customer leaves, so it contains the outcome. Perfect accuracy from such a column is a warning sign, not a success.",
    },
  },
  {
    id: "reliable-ml-systems-3",
    title: "Split the Data",
    subtitle: "Protecting the test set from every decision",
    prerequisites: ["reliable-ml-systems-2", "regression-practice-8"],
    theory: [
      {
        heading: "Three sets, three jobs",
        body: "Our churn project has 1,000 customer observations. We split them into 700 for training, 150 for validation and 150 for testing. Training data is used to fit the model's parameters. Validation data is used to choose between models, settings and thresholds. Test data gives one final estimate after every choice is locked.",
      },
      {
        heading: "Split before you look",
        body: "Make the split before exploring results and before choosing anything. Each time we look at a score and then change something, the data behind that score influences our decisions. If we use the test set that way, it stops being a fair estimate of new data.",
      },
      {
        heading: "The test set stays locked",
        body: "While we develop, the test set is not opened. No tuning, no peeking, no \"just checking\". If it is opened and used to make a choice, the final number is optimistic, and there is no untouched data left to measure how optimistic it is.",
      },
      {
        heading: "Respect time",
        body: "Churn prediction is about the future. If observations are spread over 20 weeks, a random split mixes weeks together, so a model may train on customers observed after some of the customers it is validated on. A chronological split is safer here: weeks 1 to 14 for training (700), weeks 15 to 17 for validation (150), weeks 18 to 20 for testing (150), so the model is always evaluated on later data.",
      },
      {
        heading: "What a split protects",
        body: "A split does not make a model good. It makes our measurements honest. A random split is fine for data without time structure. Here the choice depends on how the model will be used: it will predict forward in time, so the evaluation should do the same.",
      },
    ],
    learnMore:
      "Worked example: 1,000 customers are observed at 50 per week for 20 weeks. The chronological split gives 700 / 150 / 150 with no overlap, and every validation customer is observed after the newest training customer. A random split of the same customers puts nearly all of the 150 validation customers earlier than the newest training customer, which means the model has seen the future of the customers it is judged on.",
    python: `n = 1000
customers = [{"id": i, "week": i // 50 + 1} for i in range(n)]    # 50 observations per week, weeks 1-20
train = [c for c in customers if c["week"] <= 14]
valid = [c for c in customers if 15 <= c["week"] <= 17]
test = [c for c in customers if c["week"] >= 18]
print("train / validation / test:", len(train), len(valid), len(test))

ids = [{c["id"] for c in part} for part in (train, valid, test)]
print("overlap between the sets:", len(ids[0] & ids[1]) + len(ids[0] & ids[2]) + len(ids[1] & ids[2]))
print("newest training week:", max(c["week"] for c in train), " earliest validation week:", min(c["week"] for c in valid))

# a random-looking split of the same customers mixes the weeks together
shuffled = [customers[(i * 37) % n] for i in range(n)]
r_train, r_valid = shuffled[:700], shuffled[700:850]
newest = max(c["week"] for c in r_train)
print("validation customers observed before the newest training customer:")
print("  chronological split:", sum(c["week"] < max(t["week"] for t in train) for c in valid))
print("  random split:", sum(c["week"] < newest for c in r_valid))
test_opened = False       # the test set stays locked until the final evaluation
print("test set opened during development:", test_opened)

# Output:
# train / validation / test: 700 150 150
# overlap between the sets: 0
# newest training week: 14  earliest validation week: 15
# validation customers observed before the newest training customer:
#   chronological split: 0
#   random split: 144
# test set opened during development: False`,
    quickCheck: {
      question: "Which workflow uses the three data sets correctly?",
      options: ["Tune settings on the test set, then report the validation score", "Fit parameters on all data, then split it to measure the result", "Use the test set to pick the best of several models, then retrain on it", "Fit parameters on the training set, choose models and settings with the validation set, and evaluate once on the test set at the end"],
      correctIndex: 3,
      explanation:
        "Training fits the parameters, validation guides every choice, and the test set is opened once, after the choices are locked. Anything that uses the test set to decide makes the final estimate optimistic.",
    },
  },
  {
    id: "reliable-ml-systems-4",
    title: "Choose a Model",
    subtitle: "Start simple and justify every step up in complexity",
    prerequisites: ["reliable-ml-systems-3", "classification-foundations-6"],
    theory: [
      {
        heading: "Match the tool to the problem",
        body: "Churn is a binary classification problem: each customer is churn (1) or not (0). That narrows the choice to classifiers. Within that family we choose by data size, interpretability, complexity and constraints such as speed, not by fashion.",
      },
      {
        heading: "Start with a baseline",
        body: "A baseline is the simplest reasonable approach. For us it is a rule: flag a customer who has been inactive for more than 30 days. On the validation set it flags 22 customers and catches 12 of the 30 churners: accuracy 0.813 but recall only 0.40. Any model must beat this, and judging by recall rather than accuracy.",
      },
      {
        heading: "Candidates, not winners",
        body: "Two natural candidates are a logistic-style linear classifier, which weighs each feature and is easy to explain, and a tree-style model, which asks a sequence of yes/no questions about features and can capture interactions. Neither is chosen in advance. They are hypotheses we will train and measure.",
      },
      {
        heading: "More complex is not automatically better",
        body: "A more flexible model can fit more patterns, including accidental ones. It is also harder to explain, slower to tune and easier to overfit. Add complexity only when simpler models fall short on the criterion we set in the framing.",
      },
      {
        heading: "Write down the constraints",
        body: "Ours: churn staff need to understand why a customer was flagged (interpretability), the model scores customers once a day (speed is not critical), and we have 700 training examples (modest). These point to simple, explainable models first, and we will compare them fairly on the validation set.",
      },
    ],
    learnMore:
      "Worked example: the baseline rule on 150 validation customers has 12 true positives, 10 false positives, 18 false negatives and 110 true negatives. Accuracy is (12 + 110) / 150 = 0.813, precision is 12 / 22 = 0.545 and recall is 12 / 30 = 0.40. It looks respectable by accuracy and misses most churners, so the target for a model is to improve recall without wasting too many contacts.",
    python: `# validation confusion matrices, positive class = churn: (TP, FP, FN, TN), 150 validation customers
VAL = {"baseline": (12, 10, 18, 110), "logistic": (21, 12, 9, 108), "tree": (24, 17, 6, 103)}
def metrics(tp, fp, fn, tn):
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn)
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {"accuracy": (tp + tn) / (tp + fp + fn + tn), "precision": precision, "recall": recall, "f1": f1}

base = metrics(*VAL["baseline"])
print("baseline accuracy:", round(base["accuracy"], 3), " recall:", round(base["recall"], 2))

# candidates are hypotheses to test, not winners chosen in advance
candidates = {
    "baseline rule": {"complexity": 1, "explainable": "yes", "tunable settings": 0},
    "logistic-style": {"complexity": 2, "explainable": "yes", "tunable settings": 1},
    "tree-style": {"complexity": 3, "explainable": "yes at small depth", "tunable settings": 2},
}
for name, info in candidates.items():
    print(name, info)
print("chosen so far: none - all three go to the validation set")

# Output:
# baseline accuracy: 0.813  recall: 0.4
# baseline rule {'complexity': 1, 'explainable': 'yes', 'tunable settings': 0}
# logistic-style {'complexity': 2, 'explainable': 'yes', 'tunable settings': 1}
# tree-style {'complexity': 3, 'explainable': 'yes at small depth', 'tunable settings': 2}
# chosen so far: none - all three go to the validation set`,
    quickCheck: {
      question: "A team has a rule that already scores 0.81 accuracy on churn data where 20% of customers churn. A complex model scores 0.83. What is the best response?",
      options: ["Check recall and precision for the churn class and compare against the baseline, because accuracy hides how many churners are missed", "Ship the complex model, because any improvement in accuracy is enough", "Discard the baseline, because simple rules cannot be compared with models", "Choose the complex model because it has more parameters"],
      correctIndex: 0,
      explanation:
        "With 20% churners, a do-nothing rule scores 0.80 accuracy. Accuracy differences of two points say little about catching churners. Compare against the baseline on the metrics that match the goal, here recall and precision.",
    },
  },
  {
    id: "reliable-ml-systems-5",
    title: "Train the Model",
    subtitle: "Adjusting parameters on the training data to lower the loss",
    prerequisites: ["reliable-ml-systems-4", "optimization-3"],
    theory: [
      {
        heading: "What training changes",
        body: "Training adjusts the model's parameters using the training data so that an objective, the loss, gets smaller. A logistic-style churn model has a weight for each feature and a bias. At the start they are arbitrary, so the predictions are poor and the loss is high.",
      },
      {
        heading: "The loop",
        body: "Training repeats four moves: make predictions with the current parameters, measure the loss against the true labels, compute the gradient (the direction in which the loss rises fastest), and move the parameters a small step the opposite way. This is the gradient descent from the optimization lessons, applied to our churn labels.",
      },
      {
        heading: "Parameters and learning rate",
        body: "The weights and bias are parameters: they are learned from the data. The learning rate, the size of each step, is not learned by this loop. We choose it, and a poor choice makes training slow or unstable. That difference returns when we tune hyperparameters.",
      },
      {
        heading: "Training data only",
        body: "The loop uses the training set and nothing else. The validation set is for judging the finished model and comparing choices. If validation labels were used to update the parameters, the validation score would stop being an honest check.",
      },
      {
        heading: "A toy you can run",
        body: "The example below trains a one-feature churn model on 8 toy customers, not the full 700, with plain Python. The loss falls at each step while the weight and bias change. Real libraries add speed and care but do the same thing.",
      },
    ],
    learnMore:
      "Worked example: with weight 0 and bias 0 the model predicts 0.5 for everyone and the loss is about 0.693 (the log of 2). After each gradient step the weight on days-inactive grows, because longer inactivity goes with churn, and the loss falls. Training stops here after a fixed number of steps; in practice we also watch whether the loss has stopped improving.",
    python: `import math

days = [2, 5, 8, 12, 20, 25, 30, 35]        # toy training customers: days since last activity
churn = [0, 0, 0, 0, 1, 0, 1, 1]
x = [d / 10 for d in days]                  # scaled feature
w, b = 0.0, 0.0                             # parameters: learned from the training data
lr = 0.5                                    # learning rate: a hyperparameter WE choose

def predict(xi):
    return 1 / (1 + math.exp(-(w * xi + b)))

def loss():
    return -sum(y * math.log(predict(xi)) + (1 - y) * math.log(1 - predict(xi)) for xi, y in zip(x, churn)) / len(x)

print("start: loss", round(loss(), 4), "w", w, "b", b)
for step in range(1, 6):
    errors = [predict(xi) - y for xi, y in zip(x, churn)]
    grad_w = sum(e * xi for e, xi in zip(errors, x)) / len(x)
    grad_b = sum(errors) / len(x)
    w, b = w - lr * grad_w, b - lr * grad_b
    print("step", step, ": loss", round(loss(), 4), "w", round(w, 3), "b", round(b, 3))

# Output:
# start: loss 0.6931 w 0.0 b 0.0
# step 1 : loss 0.6674 w 0.103 b -0.062
# step 2 : loss 0.6487 w 0.165 b -0.139
# step 3 : loss 0.6318 w 0.211 b -0.219
# step 4 : loss 0.6162 w 0.251 b -0.299
# step 5 : loss 0.6016 w 0.287 b -0.378`,
    quickCheck: {
      question: "During training of the churn model, which statement is correct?",
      options: ["The validation labels are used in each step so that the loss reflects unseen data", "The learning rate is learned automatically from the training data by the same loop", "The test set is checked every few steps to decide when to stop", "The parameters are updated using the training data to reduce the loss, while the learning rate is a setting chosen by us"],
      correctIndex: 3,
      explanation:
        "Training updates parameters (weights and bias) by following the loss gradient on training data. The learning rate is a chosen setting, and validation and test labels are not used to update parameters.",
    },
  },
  {
    id: "reliable-ml-systems-6",
    title: "Evaluate Performance",
    subtitle: "Choosing the evaluation view that fits the goal",
    prerequisites: ["reliable-ml-systems-5", "model-evaluation-7"],
    theory: [
      {
        heading: "Evaluate on validation data",
        body: "After training, we measure the first candidate, the logistic-style model, on the 150 validation customers it has not trained on. Churn is the positive class. The confusion matrix counts four outcomes: 21 true positives (churners caught), 12 false positives (contacted but would have stayed), 9 false negatives (churners missed) and 108 true negatives.",
      },
      {
        heading: "Read several metrics",
        body: "From these counts: accuracy 0.86, precision 0.636 (of the customers we flag, how many really churn), recall 0.70 (of the real churners, how many we catch) and F1 0.667 (their harmonic mean). No single number tells the whole story.",
      },
      {
        heading: "Let the goal choose the view",
        body: "Our goal was recall of at least 0.75 with precision of at least 0.50. If missing a churner is costly because an offer could have kept them, recall matters most. If contacting too many people is expensive, precision matters. This model has recall 0.70, below the goal, even though its accuracy of 0.86 looks good.",
      },
      {
        heading: "Accuracy can flatter",
        body: "The baseline has accuracy 0.81 and the model 0.86, a small difference, yet recall rose from 0.40 to 0.70. With 20% churners, accuracy is dominated by the many customers who stay.",
      },
      {
        heading: "Validation, not test",
        body: "These numbers come from validation data and guide development. The test set is still locked. Evaluation here is a measurement of the current candidate against the goal, and the next lessons ask what to do when it falls short.",
      },
    ],
    learnMore:
      "Worked example: for the logistic-style model, precision = 21 / (21 + 12) = 0.636, recall = 21 / (21 + 9) = 0.70, F1 = 2 × 0.636 × 0.70 / (0.636 + 0.70) = 0.667 and accuracy = (21 + 108) / 150 = 0.86. Against the goal (recall ≥ 0.75, precision ≥ 0.50) it passes precision and misses recall.",
    python: `# validation confusion matrices, positive class = churn: (TP, FP, FN, TN), 150 validation customers
VAL = {"baseline": (12, 10, 18, 110), "logistic": (21, 12, 9, 108), "tree": (24, 17, 6, 103)}
def metrics(tp, fp, fn, tn):
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn)
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {"accuracy": (tp + tn) / (tp + fp + fn + tn), "precision": precision, "recall": recall, "f1": f1}
def meets_goal(m):      # the stated goal: catch at least 75% of churners with precision of at least 50%
    return m["recall"] >= 0.75 and m["precision"] >= 0.50

tp, fp, fn, tn = VAL["logistic"]
print("confusion matrix (TP, FP, FN, TN):", (tp, fp, fn, tn), " total:", tp + fp + fn + tn)
m = metrics(tp, fp, fn, tn)
for name in ("accuracy", "precision", "recall", "f1"):
    print(name, round(m[name], 3))
print("meets the stated goal:", meets_goal(m))
print("baseline accuracy for comparison:", round(metrics(*VAL["baseline"])["accuracy"], 3))

# Output:
# confusion matrix (TP, FP, FN, TN): (21, 12, 9, 108)  total: 150
# accuracy 0.86
# precision 0.636
# recall 0.7
# f1 0.667
# meets the stated goal: False
# baseline accuracy for comparison: 0.813`,
    quickCheck: {
      question: "Retention staff can contact only a limited number of customers, and each wasted contact costs money, but missing a churner loses the customer for good. Which view of the validation results is most useful?",
      options: ["Accuracy alone, because it counts all correct predictions", "The confusion matrix with precision and recall together, judged against the stated goal", "Only the training score, because validation is noisy", "Only the test score, to avoid bias"],
      correctIndex: 1,
      explanation:
        "The two kinds of mistake have different costs, so look at precision and recall together against the framed goal. Accuracy hides the minority class, and the training and test scores are not the right tools for development decisions.",
    },
  },
  {
    id: "reliable-ml-systems-7",
    title: "Diagnose Underfitting",
    subtitle: "Poor on training data and poor on validation data",
    prerequisites: ["reliable-ml-systems-6", "ml-foundations-5"],
    theory: [
      {
        heading: "The pattern",
        body: "Compare the score on training data with the score on validation data. If both are poor, the model has not captured the pattern even where it was allowed to learn it. We call this underfitting. Our tree-style model with a maximum depth of 1 has an F1 of 0.48 on training data and 0.46 on validation data: weak on both.",
      },
      {
        heading: "What the picture looks like",
        body: "A depth-1 tree asks one question, so its decision boundary is a single straight cut through the feature space. The churn pattern needs several signals together (long inactivity, many tickets, short tenure), and one cut cannot express that. Training performance is poor because the model cannot represent the pattern.",
      },
      {
        heading: "Several possible causes",
        body: "A model that is too simple is one cause. Others: the features carry little information about churn, training stopped too early or used a bad learning rate, the label is very noisy, or the problem was represented in a way that hides the signal. Underfitting is a symptom, and the cause needs checking.",
      },
      {
        heading: "Possible fixes",
        body: "Try a more suitable model or more flexibility, add or improve features, make sure training actually converged, or revisit the framing and the target. Collecting more data of the same kind rarely helps a model that cannot even fit the training data it has.",
      },
      {
        heading: "Diagnosis is evidence",
        body: "Low scores on both sets suggest underfitting but do not prove a single cause. We still need to look at the features and training. After a change we measure again on validation data, never on the test set.",
      },
    ],
    learnMore:
      "Worked example: depth 1 has train F1 0.48 and validation F1 0.46, a gap of only 0.02. Depth 2 reaches 0.62 and 0.58. Both are well below the F1 of about 0.67 that the goal needs, and the small gap between training and validation says the shortfall is not caused by memorizing the training data: the model is not fitting the pattern yet.",
    python: `# toy tuning results for the tree-style model: (max_depth, train F1, validation F1)
RESULTS = [(1, 0.48, 0.46), (2, 0.62, 0.58), (4, 0.76, 0.676), (8, 0.97, 0.59)]

def diagnose(train, valid):
    gap = train - valid
    if train < 0.65 and valid < 0.65 and gap < 0.10:
        return "underfitting: weak on both sets"
    if gap > 0.20:
        return "overfitting: strong on training, much weaker on validation"
    return "no clear fit problem"

for depth, train, valid in RESULTS:
    print("depth", depth, ": train", train, "validation", valid, "gap", round(train - valid, 2), "->", diagnose(train, valid))
print("possible fixes:", ["better features", "more suitable model", "check training converged", "revisit the framing"])

# Output:
# depth 1 : train 0.48 validation 0.46 gap 0.02 -> underfitting: weak on both sets
# depth 2 : train 0.62 validation 0.58 gap 0.04 -> underfitting: weak on both sets
# depth 4 : train 0.76 validation 0.676 gap 0.08 -> no clear fit problem
# depth 8 : train 0.97 validation 0.59 gap 0.38 -> overfitting: strong on training, much weaker on validation
# possible fixes: ['better features', 'more suitable model', 'check training converged', 'revisit the framing']`,
    quickCheck: {
      question: "A churn model scores 0.48 F1 on training data and 0.46 on validation data. Which conclusion is best supported?",
      options: ["The model is overfitting, so regularization should be increased", "The test set should be used to find out what is wrong", "The model is probably too simple or the features too weak, since it performs poorly even on data it trained on", "The model is fine, because the two scores are close"],
      correctIndex: 2,
      explanation:
        "Poor scores on both sets point to underfitting. Close scores only show there is little overfitting; they say nothing about whether the model is good enough. Check the model, features and training before changing anything else.",
    },
  },
  {
    id: "reliable-ml-systems-8",
    title: "Diagnose Overfitting",
    subtitle: "Strong on training data, clearly weaker on validation data",
    prerequisites: ["reliable-ml-systems-7", "regression-practice-6"],
    theory: [
      {
        heading: "The pattern",
        body: "Now let the churn model's tree grow to a maximum depth of 8. Its F1 on training data jumps to 0.97, while on validation data it falls to 0.59, lower than the depth-4 tree's 0.676. A large gap with strong training results is the signature of overfitting: the model has fitted details of the training customers that do not carry over.",
      },
      {
        heading: "Possible causes",
        body: "Excessive complexity for the amount of data is the classic cause: A deep tree can memorize which of our 700 training customers churned. Leakage can also produce a strong training score that collapses elsewhere. Other causes are noisy features, too little data for the model's flexibility, and over-tuning against the same validation data.",
      },
      {
        heading: "Possible remedies",
        body: "Use regularization, which penalizes complexity just as ridge regression penalizes large weights. Use a simpler model or a smaller depth. Clean up noisy features and check for leakage. Use a better validation scheme, and add useful training data where that is possible.",
      },
      {
        heading: "Evidence, not proof",
        body: "A gap of 0.38 between training and validation F1 tells us something is wrong. It does not by itself tell us which cause applies, and it does not prove the model is useless. We form a hypothesis, change one thing, and measure again on validation data.",
      },
      {
        heading: "Compare the two failure modes",
        body: "Underfitting: poor on both. Overfitting: strong on training, materially worse on validation. These descriptions are guides and not hard thresholds, and a model can show both problems in different parts of the data.",
      },
    ],
    learnMore:
      "Worked example: the training-validation gaps for the tree are 0.02 (depth 1), 0.04 (depth 2), 0.084 (depth 4) and 0.38 (depth 8). The validation score rises from 0.46 to 0.676 as the model gets more flexible, then falls to 0.59 at depth 8 while training keeps climbing. Choosing the depth with the best validation score, depth 4, is the next lesson.",
    python: `# toy tuning results for the tree-style model: (max_depth, train F1, validation F1)
RESULTS = [(1, 0.48, 0.46), (2, 0.62, 0.58), (4, 0.76, 0.676), (8, 0.97, 0.59)]

for depth, train, valid in RESULTS:
    print("depth", depth, ": train", train, " validation", valid, " gap", round(train - valid, 3))

worst = max(RESULTS, key=lambda r: r[1] - r[2])
print("largest train-validation gap at depth", worst[0], ":", round(worst[1] - worst[2], 2))
best_valid = max(RESULTS, key=lambda r: r[2])
print("best validation score at depth", best_valid[0], ":", best_valid[2])

checks = ["is any feature leaking the outcome?", "is the model too complex for 700 customers?", "is the validation set being over-used for tuning?"]
for question in checks:
    print("check:", question)

# Output:
# depth 1 : train 0.48  validation 0.46  gap 0.02
# depth 2 : train 0.62  validation 0.58  gap 0.04
# depth 4 : train 0.76  validation 0.676  gap 0.084
# depth 8 : train 0.97  validation 0.59  gap 0.38
# largest train-validation gap at depth 8 : 0.38
# best validation score at depth 4 : 0.676
# check: is any feature leaking the outcome?
# check: is the model too complex for 700 customers?
# check: is the validation set being over-used for tuning?`,
    quickCheck: {
      question: "A deep tree has training F1 0.97 and validation F1 0.59. What is the most accurate statement?",
      options: ["A large train-validation gap suggests overfitting, but leakage or noisy features could also contribute, so check them while trying a simpler or regularized model", "The model is certainly overfitting because of its depth, and nothing else needs to be checked", "The training F1 shows the model is excellent", "The validation score is unreliable, so the training score should be reported"],
      correctIndex: 0,
      explanation:
        "A big gap is evidence of overfitting, not proof of one cause. Check for leakage and noise, try regularization or a simpler model, and re-evaluate on validation data.",
    },
  },
  {
    id: "reliable-ml-systems-9",
    title: "Tune Hyperparameters",
    subtitle: "Choosing settings with validation data, not the test set",
    prerequisites: ["reliable-ml-systems-8", "regression-practice-8"],
    theory: [
      {
        heading: "Parameters versus hyperparameters",
        body: "Parameters, such as weights or the split values inside a tree, are learned from the training data. Hyperparameters are chosen outside that fitting process. Examples are the regularization strength, the maximum depth of a tree, the learning rate and the decision threshold for flagging a customer.",
      },
      {
        heading: "The tuning workflow",
        body: "Pick candidate settings. For each one, train on the training data. Evaluate each trained model on the validation data. Compare the results and choose a setting. The validation set plays the judge, which is why it must be kept separate from the data used to fit parameters.",
      },
      {
        heading: "Our tree depth",
        body: "For the churn model we try maximum depths 1, 2, 4 and 8. The validation F1 scores are 0.46, 0.58, 0.676 and 0.59. Depth 4 wins on validation. Notice that depth 8 has the best training score: the training score is not what we select on.",
      },
      {
        heading: "Do not tune on the test set",
        body: "If we picked the depth with the best test score, the test set would have been used to make a choice, and its score would be optimistic. The test set stays locked until the model and its settings are final. Even validation can be over-used if we try a huge number of settings, so keep the search modest.",
      },
      {
        heading: "Keep the churn search small and honest",
        body: "A short, deliberate list of candidates is often enough. Plain Python and a loop over a few settings is a complete tuning procedure. Record which settings were tried and their scores, so the choice can be checked later.",
      },
    ],
    learnMore:
      "Worked example: RESULTS = [(1, 0.48, 0.46), (2, 0.62, 0.58), (4, 0.76, 0.676), (8, 0.97, 0.59)]. Selecting by validation F1 gives depth 4 (0.676). Selecting by training F1 would give depth 8 (0.97), the overfitted model. The chosen depth 4 gives the tree-style model whose validation confusion matrix is 24 / 17 / 6 / 103 and whose recall is 0.80.",
    python: `# toy tuning results for the tree-style model: (max_depth, train F1, validation F1)
RESULTS = [(1, 0.48, 0.46), (2, 0.62, 0.58), (4, 0.76, 0.676), (8, 0.97, 0.59)]

test_used = False           # the test set must not take part in choosing a setting

print("hyperparameter: max_depth (chosen by us, not learned from the data)")
for depth, train, valid in RESULTS:
    print("  tried depth", depth, "-> validation F1", valid)

best_depth, best_train, best_valid = max(RESULTS, key=lambda r: r[2])      # select on VALIDATION
print("selected max_depth:", best_depth, " validation F1:", best_valid)
print("by training score we would wrongly pick depth:", max(RESULTS, key=lambda r: r[1])[0])
print("test set used for tuning:", test_used)

# Output:
# hyperparameter: max_depth (chosen by us, not learned from the data)
#   tried depth 1 -> validation F1 0.46
#   tried depth 2 -> validation F1 0.58
#   tried depth 4 -> validation F1 0.676
#   tried depth 8 -> validation F1 0.59
# selected max_depth: 4  validation F1: 0.676
# by training score we would wrongly pick depth: 8
# test set used for tuning: False`,
    quickCheck: {
      question: "Which description of tuning the tree depth is correct?",
      options: ["Try several depths and keep the one with the best training score", "Try several depths, fit each on the training set, choose the one with the best validation score, and leave the test set untouched until the end", "Try several depths on the test set and report the best test score as the final result", "Let the training loop learn the depth by gradient descent"],
      correctIndex: 1,
      explanation:
        "Hyperparameters such as depth are chosen using validation results. The best training score tends to favour overfitted settings, and using the test set to choose makes the final estimate optimistic.",
    },
  },
  {
    id: "reliable-ml-systems-10",
    title: "Compare Models",
    subtitle: "Fair comparison on the same data, protocol and metrics",
    prerequisites: ["reliable-ml-systems-9", "model-evaluation-8"],
    theory: [
      {
        heading: "One fair protocol",
        body: "Now compare the three candidates: the baseline rule, the logistic-style model and the tuned tree-style model (depth 4). They must use the same training data, the same validation set of 150 customers, and the same metrics. A comparison where each model is judged on different data or a different metric tells us little.",
      },
      {
        heading: "The metric table",
        body: "On validation data: the baseline has precision 0.55, recall 0.40 and F1 0.46. The logistic-style model has precision 0.64, recall 0.70 and F1 0.67. The tree-style model has precision 0.59, recall 0.80 and F1 0.68.",
      },
      {
        heading: "Return to the goal",
        body: "We framed success as recall of at least 0.75 with precision of at least 0.50. The baseline and the logistic model miss on recall. The tree-style model passes both: recall 0.80, precision 0.59. Its F1 is also the highest. The goal, not just the highest number, decides.",
      },
      {
        heading: "Other considerations",
        body: "Metrics are not the whole decision. Compare simplicity, interpretability, speed and stability too. The tree is still small enough to explain, and daily scoring is cheap, so nothing outweighs its recall advantage. If two candidates were close, a simpler or more stable one might be preferred.",
      },
      {
        heading: "Lock the choice",
        body: "Write down the chosen model, its settings (tree-style, maximum depth 4) and its decision rule. After this point nothing about the model changes. Only then is the model ready for a single evaluation on the test set.",
      },
    ],
    learnMore:
      "Worked example: validation results (precision / recall / F1): baseline 0.55 / 0.40 / 0.46; logistic-style 0.64 / 0.70 / 0.67; tree-style (depth 4) 0.59 / 0.80 / 0.68. Only the tree-style model meets both parts of the goal. The comparison also shows a trade-off: it gives up some precision (0.64 to 0.59) to gain recall (0.70 to 0.80).",
    python: `# validation confusion matrices, positive class = churn: (TP, FP, FN, TN), 150 validation customers
VAL = {"baseline": (12, 10, 18, 110), "logistic": (21, 12, 9, 108), "tree": (24, 17, 6, 103)}
def metrics(tp, fp, fn, tn):
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn)
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {"accuracy": (tp + tn) / (tp + fp + fn + tn), "precision": precision, "recall": recall, "f1": f1}
def meets_goal(m):      # the stated goal: catch at least 75% of churners with precision of at least 50%
    return m["recall"] >= 0.75 and m["precision"] >= 0.50

print("same data, same protocol: 150 validation customers, positive class = churn")
passing = []
for name, counts in VAL.items():
    m = metrics(*counts)
    ok = meets_goal(m)
    print(name, "precision", round(m["precision"], 2), "recall", round(m["recall"], 2), "F1", round(m["f1"], 2), "meets goal:", ok)
    if ok:
        passing.append(name)

chosen = max(passing, key=lambda name: metrics(*VAL[name])["f1"])
print("candidates that meet the goal:", passing)
print("locked choice:", chosen, "(tree-style, max_depth 4)")
test_opened = False
print("test set opened so far:", test_opened)

# Output:
# same data, same protocol: 150 validation customers, positive class = churn
# baseline precision 0.55 recall 0.4 F1 0.46 meets goal: False
# logistic precision 0.64 recall 0.7 F1 0.67 meets goal: False
# tree precision 0.59 recall 0.8 F1 0.68 meets goal: True
# candidates that meet the goal: ['tree']
# locked choice: tree (tree-style, max_depth 4)
# test set opened so far: False`,
    quickCheck: {
      question: "Three models are compared. Model X is evaluated on the validation set, Model Y on its own training data, and Model Z on the test set. What is wrong with this comparison?",
      options: ["Nothing: each model is measured on the most relevant data", "Models should be compared using only their parameter counts", "The models were not evaluated under one protocol, so their scores are not comparable; all should use the same validation data and metrics, with the test set kept for the final check", "Model Z should have been evaluated on the training data as well"],
      correctIndex: 2,
      explanation:
        "A fair comparison uses the same data, protocol and metrics for every candidate. Training scores flatter models and the test set should not drive model selection.",
    },
  },
  {
    id: "reliable-ml-systems-11",
    title: "Final ML Workflow",
    subtitle: "Putting the whole loop together, from problem to monitored model",
    prerequisites: ["reliable-ml-systems-10"],
    theory: [
      {
        heading: "The whole loop",
        body: "A reliable ML project is a disciplined, iterative process, not \"pick an algorithm, train, done\". For churn: frame the problem; define features and target; check for leakage; split the data; establish a baseline; choose candidate models; train; evaluate on validation data; diagnose underfitting and overfitting; tune hyperparameters; compare candidates; lock the model and its settings; evaluate once on the test set; document assumptions and limits; monitor after deployment.",
      },
      {
        heading: "Evaluate once on the test set",
        body: "With the model locked (tree-style, maximum depth 4), the 150 test customers, of whom 28 churn, give 22 true positives, 19 false positives, 6 false negatives and 103 true negatives. Precision is 0.54, recall 0.79 and F1 0.64, against validation F1 0.68. A small drop is normal: validation was used to make choices, the test set was not.",
      },
      {
        heading: "Check against the goal, then document",
        body: "Recall 0.79 is at least 0.75 and precision 0.54 is at least 0.50, so the goal is still met, with less margin than validation suggested. Write down what the model was trained on, how it was evaluated, what it is for and its limits: it is trained on past customers, scored on a first-of-month snapshot and tuned for recall.",
      },
      {
        heading: "Performance is not reliability",
        body: "A good test score is necessary but does not prove the model will stay good. The world changes: a new pricing plan, a competitor or a seasonal pattern can shift the customers' behaviour. This is data drift. A model trained on last year's customers can quietly become less accurate when conditions change.",
      },
      {
        heading: "Monitor and iterate",
        body: "After deployment, keep checking. Track the model's recall and precision as outcomes become known, and compare incoming feature values with the training data, such as the average monthly usage. A large shift is a signal to investigate and possibly retrain with new data. How large a shift matters depends on the problem, so the tolerance in our example is only a teaching value. The loop does not end at launch.",
      },
    ],
    learnMore:
      "Worked example: on the test set TP = 22, FP = 19, FN = 6, TN = 103, so precision = 22 / 41 = 0.537, recall = 22 / 28 = 0.786 and F1 = 0.638. Validation F1 was 0.676. As a toy monitoring example (the 15% tolerance is a teaching value, not a universal threshold), if average monthly usage was 12.0 hours in the training data and customers now average 9.0 hours, usage has shifted by 25%, beyond a 15% tolerance: investigate, and consider retraining.",
    python: `# validation confusion matrices, positive class = churn: (TP, FP, FN, TN), 150 validation customers
VAL = {"baseline": (12, 10, 18, 110), "logistic": (21, 12, 9, 108), "tree": (24, 17, 6, 103)}
def metrics(tp, fp, fn, tn):
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn)
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {"accuracy": (tp + tn) / (tp + fp + fn + tn), "precision": precision, "recall": recall, "f1": f1}
def meets_goal(m):      # the stated goal: catch at least 75% of churners with precision of at least 50%
    return m["recall"] >= 0.75 and m["precision"] >= 0.50

workflow = ["frame problem", "features and target", "check leakage", "split data", "baseline", "choose candidates",
            "train", "evaluate on validation", "diagnose fit", "tune hyperparameters", "compare candidates",
            "lock model and settings", "evaluate once on test", "document limits", "monitor after deployment"]
print(len(workflow), "steps, first:", workflow[0], "| last:", workflow[-1])

TEST = (22, 19, 6, 103)         # 150 test customers, evaluated ONCE after the choice was locked
val, test = metrics(*VAL["tree"]), metrics(*TEST)
print("validation F1:", round(val["f1"], 3), " test F1:", round(test["f1"], 3))
print("test precision:", round(test["precision"], 3), " recall:", round(test["recall"], 3))
print("still meets the goal on test:", meets_goal(test))

# toy monitoring example: has incoming data drifted from the training data? (15% is a teaching value, not a universal threshold)
train_usage, recent_usage, tolerance = 12.0, 9.0, 0.15
shift = (recent_usage - train_usage) / train_usage
print("usage shift since training:", round(shift, 2), "-> investigate:", abs(shift) > tolerance)

# Output:
# 15 steps, first: frame problem | last: monitor after deployment
# validation F1: 0.676  test F1: 0.638
# test precision: 0.537  recall: 0.786
# still meets the goal on test: True
# usage shift since training: -0.25 -> investigate: True`,
    quickCheck: {
      question: "The final model has been locked and scores well on the test set. Which next step best reflects a reliable ML workflow?",
      options: ["Document the assumptions and limits, deploy it, and keep monitoring outcomes and incoming data so drift is noticed and the model can be retrained", "Retune the settings on the test set to squeeze out a higher score before launch", "Deploy it and stop, because the test score proves the model will stay accurate", "Discard the validation results, because only the test score matters"],
      correctIndex: 0,
      explanation:
        "A good test score is an estimate for the data it came from. Reliability means documenting what the model assumes and watching for changes in the data or outcomes after launch. Retuning on the test set would ruin its value as a final check.",
    },
  },
];

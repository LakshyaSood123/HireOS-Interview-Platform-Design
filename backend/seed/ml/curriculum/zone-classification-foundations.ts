// MODULE 8 — Classification Foundations (7 checkpoints) in Classification Woods.
//
// One recurring email dataset (spam score 0-10, label 0 = not spam, 1 = spam):
//   not spam  0.5  1.0  2.0  3.0  4.5
//   spam      3.5  5.0  6.0  7.5  9.0
// Default rule: score >= 4 means spam (2 mistakes: 3.5 and 4.5). Logistic example: z = score - 4.
// Python uses only the standard library; every snippet was executed and its real output
// is appended as comments. Quick Check answer positions are deliberately varied.

import type { CheckpointSpec } from "./builder.js";

export const classificationFoundationsModuleSpecs: CheckpointSpec[] = [
  {
    id: "classification-foundations-1",
    title: "Regression vs Classification",
    subtitle: "Predicting a quantity versus predicting a category",
    prerequisites: [],
    theory: [
      {
        heading: "Two kinds of answers",
        body: "In the last module a model predicted a number: a house price such as 3.7, meaning $370k. That is regression: the answer is a quantity on a scale. Classification predicts a category instead, such as spam or not spam. The output is a label, not an amount.",
      },
      {
        heading: "One running example: email",
        body: "This module follows one example, deciding whether an email is spam. Each email gets a spam score from 0 to 10 that counts suspicious words, so higher means more suspicious. We will use ten emails throughout. Scores 0.5, 1, 2, 3 and 4.5 are real mail (label 0). Scores 3.5, 5, 6, 7.5 and 9 are spam (label 1).",
      },
      {
        heading: "Same pipeline, different output",
        body: "Both tasks share the pipeline: input features go into a model, which produces an output. In regression the output is 3.7. In classification the output is spam. The labels have no scale: spam is not 2.3 units away from not spam, so squared distance is the wrong way to judge a label.",
      },
      {
        heading: "Inside a classifier",
        body: "Many classifiers do not jump straight to a label. They first compute a score or a probability, then a decision rule turns it into a class, for example score 7.5 means spam. The next lessons open that box step by step. Classification is therefore not regression with the labels renamed: the output, the decision rule and the way we judge mistakes all differ.",
      },
      {
        heading: "Takeaway",
        body: "Ask what the answer looks like. If it is a quantity, it is regression. If it is one of a fixed set of categories, it is classification. A classifier often makes a score first and a class decision second.",
      },
    ],
    learnMore:
      "Worked example: a delivery app can predict the minutes until arrival (regression, for example 27.5) or whether the order will be late (classification: late or on time). The same features can feed either task. The output type decides the task.",
    python: `house_price = 3.7        # a number on a scale: regression
email_label = "spam"     # one of a few categories: classification

for name, value in [("house price", house_price), ("email label", email_label)]:
    kind = "regression" if isinstance(value, float) else "classification"
    print(name, "->", kind)

spam_score = 7.5         # an internal score ...
label = "spam" if spam_score >= 4.0 else "not spam"   # ... turned into a class by a rule
print(spam_score, label)

# Output:
# house price -> regression
# email label -> classification
# 7.5 spam`,
    quickCheck: {
      question: "Which of these is a classification problem?",
      options: ["Predicting the sale price of a house in dollars", "Predicting which of personal, promotional or spam an incoming email is", "Predicting tomorrow's temperature", "Predicting how many minutes a delivery will take"],
      correctIndex: 1,
      explanation:
        "The output is one of a fixed set of categories (personal, promotional, spam), which is classification. Price, temperature and delivery minutes are quantities on a scale, so they are regression.",
    },
  },
  {
    id: "classification-foundations-2",
    title: "Binary Classification",
    subtitle: "Two labels and one yes-or-no decision",
    prerequisites: ["classification-foundations-1"],
    theory: [
      {
        heading: "Two classes",
        body: "Binary classification has exactly two classes. Examples: spam or not spam, fraud or legitimate, disease or no disease. Every example belongs to exactly one of the two.",
      },
      {
        heading: "Labels are names",
        body: "We usually write the classes as 0 and 1: 0 means not spam and 1 means spam. These numbers are names. Spam is not twice as much as not spam, and we could swap the names without changing the problem as long as we stay consistent.",
      },
      {
        heading: "The pieces of one decision",
        body: "An email arrives with its spam score (the feature). The classifier looks at it and produces a predicted class. The email also has a true class, the label someone verified. Comparing the two tells us whether the prediction was correct or incorrect.",
      },
      {
        heading: "Our ten emails",
        body: "Take the rule predict spam when the score is at least 4. Email 7.5 is predicted spam and really is spam: correct. Email 3.5 is predicted not spam but really is spam: incorrect. Email 4.5 is predicted spam but is real mail: incorrect. On the ten emails the rule is right 8 times and wrong twice.",
      },
      {
        heading: "Takeaway",
        body: "Binary classification maps features to one of two classes. A prediction is correct when the predicted class equals the true class. Later lessons look at how the rule is built and what kind of mistakes it makes.",
      },
    ],
    learnMore:
      "Worked example: a hospital model flags scans as disease (1) or no disease (0). The 1 and 0 only name the two outcomes. We could call them positive and negative, or sick and healthy.",
    python: `spam_scores = [0.5, 1.0, 2.0, 3.0, 4.5, 3.5, 5.0, 6.0, 7.5, 9.0]   # suspicious-word score of ten emails
labels      = [0,   0,   0,   0,   0,   1,   1,   1,   1,   1]     # 0 = not spam, 1 = spam

def classify(score):
    return 1 if score >= 4.0 else 0       # a simple rule: score at least 4 means spam

predictions = [classify(s) for s in spam_scores]
print(predictions)

correct = [p == y for p, y in zip(predictions, labels)]
print(sum(correct), "of", len(labels), "correct")

for s, p, y in zip(spam_scores, predictions, labels):
    if p != y:
        print("wrong:", s, "predicted", p, "actual", y)

# Output:
# [0, 0, 0, 0, 1, 0, 1, 1, 1, 1]
# 8 of 10 correct
# wrong: 4.5 predicted 1 actual 0
# wrong: 3.5 predicted 0 actual 1`,
    quickCheck: {
      question: "In our data the label 1 means spam and 0 means not spam. What does the number 1 tell you?",
      options: ["That spam is worth twice as much as not spam", "That the email is exactly 1 unit away from not spam", "That a model must output the number 1.0 exactly", "Only the name of the class; the label is not a quantity"],
      correctIndex: 3,
      explanation:
        "Class labels are names. 1 and 0 do not measure anything, so there is no 'twice as much' and no distance between classes. We could swap the names and keep the same problem.",
    },
  },
  {
    id: "classification-foundations-3",
    title: "Scores and Decision Boundaries",
    subtitle: "Drawing the line that separates the classes",
    prerequisites: ["classification-foundations-2"],
    theory: [
      {
        heading: "A score first",
        body: "Many classifiers first compute a score for each example, a number that is larger when the model leans toward the positive class. For our emails the spam score is the score. A score is not automatically a probability: a score of 8 does not mean 80 percent.",
      },
      {
        heading: "A decision rule and a boundary",
        body: "A decision rule turns the score into a class. In one dimension: score below the boundary means class 0, score at or above it means class 1. With the boundary at 4, the score axis splits into a not-spam region on the left and a spam region on the right. The boundary is the place where the predicted class changes.",
      },
      {
        heading: "Near the boundary",
        body: "Emails far from the boundary, such as 0.5 or 9, are easy decisions. Emails close to it, such as 3.5 and 4.5, are the hard ones: a tiny change in score flips the class, so the model is least certain there. In our data both of the real mistakes sit right next to the boundary.",
      },
      {
        heading: "More than one feature",
        body: "With two features, for example suspicious words and number of links, each email is a point in a plane. The boundary becomes a line, and the plane splits into a class 0 region on one side and a class 1 region on the other. With more features the boundary is a plane or a higher-dimensional surface.",
      },
      {
        heading: "The boundary can move",
        body: "Moving the boundary changes predictions. Boundary 3 makes 2 mistakes on our ten emails, boundary 4 makes 2, and boundary 5 makes 1. Choosing it by eyeballing the data we already have is risky: the boundary should be chosen by training and checked on held-out data, as in the previous module.",
      },
    ],
    learnMore:
      "Worked example: emails with scores 3.9 and 4.1 look almost identical, but with the boundary at 4 the first is predicted not spam and the second spam. The prediction flipped because the score crossed the boundary, not because the email changed much.",
    python: `spam_scores = [0.5, 1.0, 2.0, 3.0, 4.5, 3.5, 5.0, 6.0, 7.5, 9.0]   # suspicious-word score of ten emails
labels      = [0,   0,   0,   0,   0,   1,   1,   1,   1,   1]     # 0 = not spam, 1 = spam

def errors_at(boundary):
    predictions = [1 if s >= boundary else 0 for s in spam_scores]
    return sum(p != y for p, y in zip(predictions, labels))

for boundary in (3.0, 4.0, 5.0):
    print("boundary", boundary, "mistakes", errors_at(boundary))

boundary = 4.0
for s in (0.5, 3.5, 4.5, 9.0):
    side = "spam region" if s >= boundary else "not-spam region"
    print(s, "distance to boundary", round(abs(s - boundary), 1), side)

# Output:
# boundary 3.0 mistakes 2
# boundary 4.0 mistakes 2
# boundary 5.0 mistakes 1
# 0.5 distance to boundary 3.5 not-spam region
# 3.5 distance to boundary 0.5 not-spam region
# 4.5 distance to boundary 0.5 spam region
# 9.0 distance to boundary 5.0 spam region`,
    quickCheck: {
      question: "The boundary is at score 4.0. Two emails have scores 3.9 and 4.1. Which statement is correct?",
      options: ["They get different predicted classes because they lie on opposite sides of the boundary, even though the emails are very similar", "They get the same class because their scores differ by only 0.2", "Both are certain predictions, because the boundary is exactly between them", "The score 4.1 means a 41 percent chance of spam"],
      correctIndex: 0,
      explanation:
        "The rule changes class at the boundary, so 3.9 gives not spam and 4.1 gives spam. Points near the boundary are the least certain decisions. A score is not a probability, so 4.1 does not mean 41 percent.",
    },
  },
  {
    id: "classification-foundations-4",
    title: "Probabilities and Thresholds",
    subtitle: "From a score to a probability to a decision",
    prerequisites: ["classification-foundations-3"],
    theory: [
      {
        heading: "Models that output probabilities",
        body: "Some classifiers output an estimated probability, for example P(spam | x) = 0.82 for one email: the model estimates an 82 percent chance that this email is spam. A probability is a number between 0 and 1. It is the model's estimate, not yet a decision.",
      },
      {
        heading: "A threshold turns it into a decision",
        body: "To act, we pick a threshold and apply a rule: if the probability is at least the threshold, predict spam, otherwise not spam. With threshold 0.5, probability 0.82 gives spam and probability 0.12 gives not spam. The probability is a continuous value; the prediction is a class.",
      },
      {
        heading: "Moving the threshold",
        body: "Our model gives the ten emails these spam probabilities: 0.03, 0.05, 0.12, 0.27, 0.62 for the real mail, and 0.38, 0.73, 0.88, 0.97, 0.99 for the spam. At threshold 0.5 we block email 4.5 (it is real mail) and let 3.5 through (it is spam). Raise the threshold to 0.8 and we block no real mail but let two spam emails through. Lower it to 0.3 and we catch every spam email but still block one real email.",
      },
      {
        heading: "The probabilities did not change",
        body: "Raising or lowering the threshold changes the decisions only. The underlying probabilities stay exactly the same. This is also how a threshold relates to the decision boundary of the last lesson: the threshold is a rule on the probability, and the boundary is where in feature space the predicted class flips. Moving the threshold moves the boundary.",
      },
      {
        heading: "Takeaway",
        body: "A probability expresses the model's estimate, a threshold turns it into a class, and 0.5 is a common default but not always best. Different thresholds make different mistakes. Why that matters is studied properly in Model Evaluation.",
      },
    ],
    learnMore:
      "Worked example: P(spam) = 0.62 for the email with score 4.5. At threshold 0.5 it is predicted spam; at threshold 0.8 it is predicted not spam. The probability 0.62 is the same in both cases.",
    python: `probabilities = [0.03, 0.05, 0.12, 0.27, 0.62, 0.38, 0.73, 0.88, 0.97, 0.99]
labels        = [0,    0,    0,    0,    0,    1,    1,    1,    1,    1]

def decide(p, threshold):
    return 1 if p >= threshold else 0

print(decide(0.82, 0.5), decide(0.12, 0.5))        # one spam-like and one real-mail-like email

for threshold in (0.3, 0.5, 0.8):
    predictions = [decide(p, threshold) for p in probabilities]
    real_blocked = sum(1 for pr, y in zip(predictions, labels) if pr == 1 and y == 0)
    spam_missed = sum(1 for pr, y in zip(predictions, labels) if pr == 0 and y == 1)
    print("threshold", threshold, "real mail blocked", real_blocked, "spam missed", spam_missed)

# Output:
# 1 0
# threshold 0.3 real mail blocked 1 spam missed 0
# threshold 0.5 real mail blocked 1 spam missed 1
# threshold 0.8 real mail blocked 0 spam missed 2`,
    quickCheck: {
      question: "A model says P(spam) = 0.82 for an email. The threshold is set to 0.9. What is the predicted class?",
      options: ["Spam, because 0.82 is above 0.5", "Spam, because the model is 82 percent sure", "Not spam, because 0.82 is below the threshold 0.9", "No prediction can be made until the probability is 1"],
      correctIndex: 2,
      explanation:
        "The rule is: predict spam only if the probability is at least the threshold. 0.82 is below 0.9, so the prediction is not spam. The probability stays 0.82; only the decision depends on the threshold.",
    },
  },
  {
    id: "classification-foundations-5",
    title: "Logistic Intuition",
    subtitle: "Squashing a score into a probability",
    prerequisites: ["classification-foundations-4"],
    theory: [
      {
        heading: "Start from a linear score",
        body: "Like linear regression, a logistic classifier starts with a linear score: z = w·x + b. For our emails take w = 1 and b = −4, so z = score − 4. This z can be any number from minus infinity to plus infinity. Email 0.5 has z = −3.5 and email 9 has z = 5.",
      },
      {
        heading: "Why a raw score is not a probability",
        body: "A probability must lie between 0 and 1, but z does not. We need a smooth function that squeezes any number into the range from 0 to 1 and keeps the order: bigger z must mean a bigger probability.",
      },
      {
        heading: "The sigmoid squashes",
        body: "The sigmoid does exactly that: σ(z) = 1 / (1 + e^(−z)). A strongly negative z, such as −5, gives a probability near 0 (0.007). z = 0 gives exactly 0.5. A strongly positive z, such as 5, gives a probability near 1 (0.993). Plotted, it is an S-shaped curve that is steep in the middle and flat at the ends.",
      },
      {
        heading: "From features to a class",
        body: "The whole chain is: features, then a linear score, then the sigmoid, then a probability, then a threshold, then a class. Email 7.5 gives z = 3.5, probability 0.971, and with threshold 0.5 the class spam. Because σ(0) = 0.5, the decision z ≥ 0 is the same as probability ≥ 0.5, so the decision boundary is where z = 0, here at score 4.",
      },
      {
        heading: "Function versus model",
        body: "The sigmoid is just a function. Logistic regression is a classification model that combines a linear score with the sigmoid and learns w and b from labelled data. How it learns them uses a loss function; the details are not needed yet.",
      },
    ],
    learnMore:
      "Worked example: z = −1 gives σ(−1) = 0.269, z = 1 gives 0.731, and they add to 1. The curve is symmetric around the point (0, 0.5).",
    python: `import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

for z in (-5, -1, 0, 1, 5):
    print("z =", z, "probability", round(sigmoid(z), 3))

w, b = 1.0, -4.0                       # linear score z = w * score + b
for score in (0.5, 4.0, 7.5):
    z = w * score + b
    p = sigmoid(z)
    label = "spam" if p >= 0.5 else "not spam"
    print("score", score, "z", z, "p", round(p, 3), label)

# Output:
# z = -5 probability 0.007
# z = -1 probability 0.269
# z = 0 probability 0.5
# z = 1 probability 0.731
# z = 5 probability 0.993
# score 0.5 z -3.5 p 0.029 not spam
# score 4.0 z 0.0 p 0.5 spam
# score 7.5 z 3.5 p 0.971 spam`,
    quickCheck: {
      question: "In a logistic classifier an email has linear score z = 0. What do we conclude?",
      options: ["Its probability of spam is 0, so it is certainly not spam", "Its probability of spam is 1, so it is certainly spam", "The model has failed because z must be positive", "Its probability is 0.5: it sits exactly on the decision boundary"],
      correctIndex: 3,
      explanation:
        "σ(0) = 1 / (1 + 1) = 0.5. A score of 0 maps to probability 0.5, which is the point where the predicted class flips when the threshold is 0.5.",
    },
  },
  {
    id: "classification-foundations-6",
    title: "Multiclass Classification",
    subtitle: "More than two labels",
    prerequisites: ["classification-foundations-5"],
    theory: [
      {
        heading: "More than two classes",
        body: "Binary classification has two classes. Multiclass classification has three or more: cat, dog or bird; or, in our email example, personal, promotional or spam. Each example still belongs to exactly one class.",
      },
      {
        heading: "One class score per class",
        body: "A common design gives the model one score per class. For one email the model might give personal 0.5, promotional 1.2 and spam 2.1. The predicted class is the one with the largest score, here spam. Scores are compared with each other; no single threshold is involved.",
      },
      {
        heading: "From scores to probabilities",
        body: "Often we want probabilities for the three classes that add up to 1. A function called softmax does this: it turns the class scores into positive numbers that sum to 1 and keeps the order. Our scores become personal 0.126, promotional 0.253 and spam 0.622. We use it here only for its purpose, not its derivation.",
      },
      {
        heading: "One-versus-rest",
        body: "Another way to get multiclass from binary is one-versus-rest: train one binary classifier per class (personal versus everything else, promotional versus everything else, spam versus everything else), then predict the class whose classifier is most confident. It reuses everything you know about binary classification.",
      },
      {
        heading: "Takeaway",
        body: "Multiclass classification picks one of several classes, usually by comparing one score or probability per class and choosing the largest. A class can win with less than 50 percent, for example 0.40 against 0.35 and 0.25. In feature space, the classes occupy regions whose boundaries meet.",
      },
    ],
    learnMore:
      "Worked example: probabilities personal 0.40, promotional 0.35, spam 0.25 add up to 1. The prediction is personal, even though 0.40 is below 0.5, because it is the largest.",
    python: `import math

scores = {"personal": 0.5, "promotional": 1.2, "spam": 2.1}     # one raw score per class

def softmax(values):
    exps = [math.exp(v) for v in values]
    total = sum(exps)
    return [e / total for e in exps]

probs = dict(zip(scores, softmax(list(scores.values()))))
for name, p in probs.items():
    print(name, round(p, 3))
print("sum", round(sum(probs.values()), 3))

prediction = max(probs, key=probs.get)      # choose the largest
print("predicted class:", prediction)

# Output:
# personal 0.126
# promotional 0.253
# spam 0.622
# sum 1.0
# predicted class: spam`,
    quickCheck: {
      question: "A three-class model gives probabilities personal 0.40, promotional 0.35 and spam 0.25. What does it predict?",
      options: ["Spam, because it is the riskiest class", "Personal, because it has the largest probability even though it is below 0.5", "Nothing, because no class reaches 0.5", "Promotional, because 0.35 is closest to 0.5"],
      correctIndex: 1,
      explanation:
        "In multiclass classification the predicted class is the one with the largest probability. The probabilities sum to 1, so with three classes the winner can easily have less than 0.5.",
    },
  },
  {
    id: "classification-foundations-7",
    title: "Classification Errors",
    subtitle: "Where a classifier goes wrong and what each mistake costs",
    prerequisites: ["classification-foundations-6"],
    theory: [
      {
        heading: "Every prediction is correct or incorrect",
        body: "Compare the predicted class with the true class. Equal means correct, different means incorrect. For a binary problem there are exactly four outcomes. Before naming them we must choose which class is the positive class. Positive just means the class we are looking for, not good. Here positive = spam.",
      },
      {
        heading: "Four outcomes",
        body: "True positive: predicted spam, actually spam. True negative: predicted not spam, actually not spam. False positive: predicted spam, actually real mail, so a legitimate email is wrongly marked spam. False negative: predicted not spam, actually spam, so spam slips through.",
      },
      {
        heading: "Our ten emails",
        body: "With the rule score at least 4, the ten emails give 4 true positives (5, 6, 7.5 and 9), 4 true negatives (0.5, 1, 2 and 3), 1 false positive (the real mail with score 4.5) and 1 false negative (the spam with score 3.5). The two errors are different kinds of mistake.",
      },
      {
        heading: "Different errors, different costs",
        body: "A false positive might send a job offer to the spam folder. A false negative might let a phishing email into the inbox. Which is worse depends on the application: for a cancer screening, a false negative (a missed disease) is usually much worse than a false positive. Counting only how many mistakes happened hides this.",
      },
      {
        heading: "Where this goes next",
        body: "Naming the four outcomes lets us organize them in a table and measure a classifier in more detail. That is the job of the next module, Model Evaluation. For now, remember the names and always define the positive class first.",
      },
    ],
    learnMore:
      "Worked example: positive = spam. Email score 4.5 is real mail (actual 0) but is predicted spam (1): false positive. Email score 3.5 is spam (actual 1) but is predicted not spam (0): false negative.",
    python: `spam_scores = [0.5, 1.0, 2.0, 3.0, 4.5, 3.5, 5.0, 6.0, 7.5, 9.0]   # suspicious-word score of ten emails
labels      = [0,   0,   0,   0,   0,   1,   1,   1,   1,   1]     # 0 = not spam, 1 = spam

predictions = [1 if s >= 4.0 else 0 for s in spam_scores]       # positive class = spam (1)

tp = sum(1 for p, y in zip(predictions, labels) if p == 1 and y == 1)
tn = sum(1 for p, y in zip(predictions, labels) if p == 0 and y == 0)
fp = sum(1 for p, y in zip(predictions, labels) if p == 1 and y == 0)
fn = sum(1 for p, y in zip(predictions, labels) if p == 0 and y == 1)
print("true positives", tp, "true negatives", tn)
print("false positives", fp, "false negatives", fn)
print("total", tp + tn + fp + fn)

for s, p, y in zip(spam_scores, predictions, labels):
    if p != y:
        print(s, "false positive" if p == 1 else "false negative")

# Output:
# true positives 4 true negatives 4
# false positives 1 false negatives 1
# total 10
# 4.5 false positive
# 3.5 false negative`,
    quickCheck: {
      question: "With positive = spam, a legitimate email from your manager is moved to the spam folder. What kind of outcome is this?",
      options: ["A false positive: predicted spam, actually not spam", "A false negative: predicted spam, actually not spam", "A true positive, because the model made a positive prediction", "A true negative, because the email is real mail"],
      correctIndex: 0,
      explanation:
        "The model predicted the positive class (spam) but the email was actually not spam, so it is a false positive. A false negative would be spam that was let through.",
    },
  },
];

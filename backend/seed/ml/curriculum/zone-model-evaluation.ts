// MODULE 9 — Model Evaluation (8 checkpoints) in Classification Woods.
//
// One recurring evaluation set of 100 emails, positive class = spam:
//   TP = 16, FN = 4, FP = 8, TN = 72   (accuracy 0.88, precision 0.667, recall 0.80, F1 0.727)
// Confusion-matrix orientation everywhere: rows = actual, columns = predicted.
// Python uses only the standard library; every snippet was executed and its real output is
// appended as comments. Quick Check answer positions are deliberately varied.

import type { CheckpointSpec } from "./builder.js";

export const modelEvaluationModuleSpecs: CheckpointSpec[] = [
  {
    id: "model-evaluation-1",
    title: "Train Accuracy vs Real Performance",
    subtitle: "Why a high training score is not a promise",
    prerequisites: ["classification-foundations-7"],
    theory: [
      {
        heading: "Accuracy is one score, performance is broader",
        body: "Accuracy is the fraction of predictions that are correct. It is one performance metric, not a synonym for how good a classifier is. This module builds a toolkit of metrics, starting with why a single accuracy number can mislead.",
      },
      {
        heading: "Seen data versus unseen data",
        body: "A classifier that scores 98 percent accuracy on the emails it trained on may score only 84 percent on emails it has never seen. The training score describes memory; the validation score, on examples not used to fit the parameters, is a much better guide to real use. A large gap is the overfitting you met in Regression in Practice, now in a classification setting.",
      },
      {
        heading: "Accuracy can hide a failed class",
        body: "Suppose a mailbox has 95 legitimate emails and 5 spam. A model that always answers legitimate is right 95 times in 100: 95 percent accuracy. Yet it catches 0 of the 5 spam emails. When one class is rare (class imbalance), a high accuracy can come from ignoring that class completely.",
      },
      {
        heading: "What accuracy cannot tell us",
        body: "Accuracy counts mistakes but does not say which kind they are. Blocking a legitimate email and letting spam through are different mistakes with different costs, and accuracy treats them the same. Rare classes are often the ones we care about most, such as fraud or disease.",
      },
      {
        heading: "Takeaway",
        body: "Judge a classifier on data it did not train on, and do not trust accuracy alone, especially with imbalanced classes. The next lessons break accuracy into the four kinds of outcome and build metrics that look at each class.",
      },
    ],
    learnMore:
      "Worked example: always predicting legitimate on 95 legitimate and 5 spam emails gives 95 correct out of 100, so accuracy 0.95, while the number of spam emails caught is 0.",
    python: `train_accuracy = 0.98
validation_accuracy = 0.84
print("gap:", round(train_accuracy - validation_accuracy, 2))

labels = [0] * 95 + [1] * 5            # 95 legitimate (0), 5 spam (1)
predictions = [0] * 100                # a model that always says legitimate

correct = sum(p == y for p, y in zip(predictions, labels))
spam_caught = sum(p == 1 and y == 1 for p, y in zip(predictions, labels))
print("accuracy:", correct / len(labels))
print("spam caught:", spam_caught, "of", labels.count(1))

# Output:
# gap: 0.14
# accuracy: 0.95
# spam caught: 0 of 5`,
    quickCheck: {
      question: "A spam classifier has 98% accuracy on its training emails and 84% on validation emails it never saw. Which number is the better guide to how it will behave on new mail, and why?",
      options: ["The training accuracy, because the model has seen more of those emails", "Neither, because accuracy cannot be computed for new mail", "The validation accuracy, because those emails were not used to fit the model's parameters", "Their average, because both are equally informative"],
      correctIndex: 2,
      explanation:
        "Validation emails were not used to fit the parameters, so their accuracy estimates how the model handles unseen mail. The 14-point gap suggests overfitting. Training accuracy only shows how well the model fits data it already saw.",
    },
  },
  {
    id: "model-evaluation-2",
    title: "Confusion Matrix",
    subtitle: "Counting every kind of outcome in one table",
    prerequisites: ["model-evaluation-1"],
    theory: [
      {
        heading: "Four outcomes, one table",
        body: "From Classification Errors you know the four outcomes for a binary classifier. With spam as the positive class: true positive (spam caught), false negative (spam missed), false positive (legitimate email blocked) and true negative (legitimate email allowed). A confusion matrix is a 2 by 2 table of how many emails fall in each outcome.",
      },
      {
        heading: "One orientation, used everywhere",
        body: "We always use this layout: rows are the actual class, columns are the predicted class. Row 1 is actual spam: TP in the predicted-spam column, FN in the predicted-legitimate column. Row 2 is actual legitimate: FP in the predicted-spam column, TN in the predicted-legitimate column.",
      },
      {
        heading: "Our evaluation set",
        body: "Take 100 emails: 20 are really spam and 80 are legitimate. The filter catches 16 spam emails (TP = 16) and misses 4 (FN = 4). It wrongly blocks 8 legitimate emails (FP = 8) and correctly allows 72 (TN = 72). The four counts add up to 100, and the rows add up to the actual class sizes, 20 and 80.",
      },
      {
        heading: "Reading the matrix",
        body: "Accuracy is the diagonal over the total: (16 + 72) / 100 = 0.88. But the matrix shows more: the 8 false positives and 4 false negatives are separate problems, and the 4 missed spam emails are 20 percent of all spam. Rows and columns answer different questions, which the next two lessons use.",
      },
      {
        heading: "Takeaway",
        body: "A confusion matrix reveals what kinds of mistakes a classifier makes, not just how many. Always say which class is positive and keep the actual-by-predicted orientation fixed.",
      },
    ],
    learnMore:
      "Worked example: row sums are the actual counts, 16 + 4 = 20 spam and 8 + 72 = 80 legitimate. Column sums are the predicted counts, 16 + 8 = 24 predicted spam and 4 + 72 = 76 predicted legitimate.",
    python: `labels = [1] * 20 + [0] * 80                        # 1 = spam (positive), 0 = legitimate
predictions = [1] * 16 + [0] * 4 + [1] * 8 + [0] * 72

tp = sum(p == 1 and y == 1 for p, y in zip(predictions, labels))
fn = sum(p == 0 and y == 1 for p, y in zip(predictions, labels))
fp = sum(p == 1 and y == 0 for p, y in zip(predictions, labels))
tn = sum(p == 0 and y == 0 for p, y in zip(predictions, labels))

matrix = [[tp, fn],        # actual spam:       predicted spam, predicted legitimate
          [fp, tn]]        # actual legitimate: predicted spam, predicted legitimate
print(matrix)
print("total:", tp + fn + fp + tn)
print("accuracy:", (tp + tn) / len(labels))

# Output:
# [[16, 4], [8, 72]]
# total: 100
# accuracy: 0.88`,
    quickCheck: {
      question: "In our matrix (rows = actual, columns = predicted, positive = spam), which cell counts legitimate emails that were wrongly blocked as spam?",
      options: ["Row actual legitimate, column predicted spam: the false positives", "Row actual spam, column predicted legitimate: the false negatives", "Row actual spam, column predicted spam: the true positives", "Row actual legitimate, column predicted legitimate: the true negatives"],
      correctIndex: 0,
      explanation:
        "A legitimate email is in the actual-legitimate row, and being blocked means it is in the predicted-spam column. That cell is the false positives, 8 emails here.",
    },
  },
  {
    id: "model-evaluation-3",
    title: "Precision",
    subtitle: "Of the positives you predicted, how many were right?",
    prerequisites: ["model-evaluation-2"],
    theory: [
      {
        heading: "The question precision answers",
        body: "When the filter says spam, how often is it right? Precision looks only at the emails the model flagged as positive and asks what share of them really are positive.",
      },
      {
        heading: "The formula and its denominator",
        body: "Precision = TP / (TP + FP). The denominator, TP + FP, is every email predicted spam: the predicted-spam column of the confusion matrix. The numerator keeps the ones that really were spam.",
      },
      {
        heading: "Our example",
        body: "The filter flags 16 + 8 = 24 emails as spam, and 16 of them are really spam. Precision = 16 / 24, which is about 0.667. Two thirds of the blocked emails were spam; one third were legitimate emails blocked by mistake.",
      },
      {
        heading: "What high and low precision mean",
        body: "High precision means that when we block an email, we are usually right: few false alarms. Low precision means many legitimate emails are being blocked. Precision says nothing about spam the filter never flagged, so by itself it can look good for a filter that flags almost nothing.",
      },
      {
        heading: "Takeaway",
        body: "Precision measures the reliability of positive predictions. Its denominator is all predicted positives. If nothing is predicted positive the denominator is 0 and precision is not defined, which code must handle.",
      },
    ],
    learnMore:
      "Worked example: column of predicted spam = 16 true positives + 8 false positives = 24. Precision = 16 / 24 = 0.667. If the filter flagged only the 5 most obvious spam emails and all 5 were spam, precision would be 1.0 yet 15 spam emails would be missed.",
    python: `def accuracy(tp, tn, fp, fn):
    return (tp + tn) / (tp + tn + fp + fn)

def precision(tp, fp):
    return tp / (tp + fp) if tp + fp > 0 else None      # not defined if nothing was predicted positive

def recall(tp, fn):
    return tp / (tp + fn) if tp + fn > 0 else None      # not defined if there are no actual positives

def f1(p, r):
    return 2 * p * r / (p + r) if p and r else 0.0

tp, fn, fp, tn = 16, 4, 8, 72        # positive class = spam; 100 emails
p = precision(tp, fp)
print("predicted spam:", tp + fp)
print("precision:", round(p, 3))
print("nothing flagged:", precision(0, 0))

# Output:
# predicted spam: 24
# precision: 0.667
# nothing flagged: None`,
    quickCheck: {
      question: "A spam filter has low precision. What does that mean in practice?",
      options: ["It misses a lot of the spam that arrives", "Its accuracy must be exactly 0.5", "It has not been trained on enough emails", "A large share of the emails it flags as spam are actually legitimate"],
      correctIndex: 3,
      explanation:
        "Precision is the share of predicted positives that are truly positive. Low precision means many flagged emails are legitimate. Missing spam is the problem that recall measures.",
    },
  },
  {
    id: "model-evaluation-4",
    title: "Recall",
    subtitle: "Of the real positives, how many did you find?",
    prerequisites: ["model-evaluation-3"],
    theory: [
      {
        heading: "The question recall answers",
        body: "Of all the emails that really are spam, how many did the filter catch? Recall starts from the real positives and asks what share the model found.",
      },
      {
        heading: "The formula and its denominator",
        body: "Recall = TP / (TP + FN). The denominator, TP + FN, is every actual spam email: the actual-spam row of the confusion matrix. Precision used a column; recall uses a row.",
      },
      {
        heading: "Our example",
        body: "There are 16 + 4 = 20 actual spam emails and the filter catches 16. Recall = 16 / 20 = 0.80. The filter finds 80 percent of the spam and lets 20 percent through.",
      },
      {
        heading: "Why recall matters",
        body: "High recall means few positives are missed. For spam that means most spam is caught. In a screening setting, such as looking for a disease, a missed positive can be costly, so recall is often watched closely there. This is only an intuition for why different problems care about different mistakes.",
      },
      {
        heading: "Precision and recall are different",
        body: "Precision asks about the predicted-positive column. Recall asks about the actual-positive row. A filter that flags every email has recall 1.0 but poor precision, and a filter that flags only one sure spam can have precision 1.0 but poor recall. Neither number alone tells the whole story.",
      },
    ],
    learnMore:
      "Worked example: actual-spam row = 16 true positives + 4 false negatives = 20. Recall = 16 / 20 = 0.80. The same filter has precision 0.667: it catches most spam, but about a third of what it blocks is legitimate.",
    python: `def accuracy(tp, tn, fp, fn):
    return (tp + tn) / (tp + tn + fp + fn)

def precision(tp, fp):
    return tp / (tp + fp) if tp + fp > 0 else None      # not defined if nothing was predicted positive

def recall(tp, fn):
    return tp / (tp + fn) if tp + fn > 0 else None      # not defined if there are no actual positives

def f1(p, r):
    return 2 * p * r / (p + r) if p and r else 0.0

tp, fn, fp, tn = 16, 4, 8, 72        # positive class = spam; 100 emails
r = recall(tp, fn)
print("actual spam:", tp + fn)
print("recall:", r)
print("flag everything, recall:", recall(20, 0), " precision:", round(precision(20, 80), 2))

# Output:
# actual spam: 20
# recall: 0.8
# flag everything, recall: 1.0  precision: 0.2`,
    quickCheck: {
      question: "A disease-screening model has recall 0.60 for a condition. What does that tell us?",
      options: ["60% of the people it flags actually have the condition", "It finds 60% of the people who really have the condition and misses the other 40%", "It is correct on 60% of all people tested", "40% of healthy people are flagged by mistake"],
      correctIndex: 1,
      explanation:
        "Recall = TP / (TP + FN): the share of actual positives that were found. 0.60 means 60% of real cases are found and 40% are missed. The share of flagged people who truly have it would be precision.",
    },
  },
  {
    id: "model-evaluation-5",
    title: "F1 Score",
    subtitle: "One number that balances precision and recall",
    prerequisites: ["model-evaluation-4"],
    theory: [
      {
        heading: "Which model is better?",
        body: "Model A has precision 0.95 and recall 0.40: very reliable when it flags something, but it misses most positives. Model B has precision 0.75 and recall 0.75: balanced. Which is better depends on the goal, so we often want a single number that reflects both.",
      },
      {
        heading: "F1 combines them",
        body: "F1 = 2 × (precision × recall) / (precision + recall). It is the harmonic mean of precision and recall. Unlike a plain average, the harmonic mean is pulled toward the smaller value.",
      },
      {
        heading: "Reading F1",
        body: "Model A has F1 = 2 × 0.95 × 0.40 / 1.35, about 0.563, and Model B has F1 = 0.75. F1 rewards balance and drops sharply when either precision or recall is low. If either is 0, F1 is 0.",
      },
      {
        heading: "Our example",
        body: "With precision 0.667 and recall 0.80, F1 = 2 × 0.667 × 0.80 / 1.467, about 0.727. That is below the plain average 0.733 and closer to the weaker number, precision.",
      },
      {
        heading: "F1 is a choice, not a law",
        body: "F1 treats precision and recall as equally important. If missing a positive is far worse than a false alarm, or the other way round, a different balance is better. F1 is a common summary, not the best metric in all cases, and it is a way to evaluate a model, not automatically the loss it is trained with.",
      },
    ],
    learnMore:
      "Worked example: Model A, precision 0.95 and recall 0.40: plain average 0.675 but F1 0.563. Model B, precision 0.75 and recall 0.75: average 0.75 and F1 0.75. F1 punishes A's imbalance.",
    python: `def accuracy(tp, tn, fp, fn):
    return (tp + tn) / (tp + tn + fp + fn)

def precision(tp, fp):
    return tp / (tp + fp) if tp + fp > 0 else None      # not defined if nothing was predicted positive

def recall(tp, fn):
    return tp / (tp + fn) if tp + fn > 0 else None      # not defined if there are no actual positives

def f1(p, r):
    return 2 * p * r / (p + r) if p and r else 0.0

for name, p, r in [("Model A", 0.95, 0.40), ("Model B", 0.75, 0.75)]:
    print(name, "average", round((p + r) / 2, 3), "F1", round(f1(p, r), 3))

tp, fn, fp, tn = 16, 4, 8, 72        # positive class = spam; 100 emails
p, r = precision(tp, fp), recall(tp, fn)
print("recurring example: precision", round(p, 3), "recall", r, "F1", round(f1(p, r), 3))
print("one metric is 0:", f1(0.9, 0.0))

# Output:
# Model A average 0.675 F1 0.563
# Model B average 0.75 F1 0.75
# recurring example: precision 0.667 recall 0.8 F1 0.727
# one metric is 0: 0.0`,
    quickCheck: {
      question: "A model has precision 0.95 but recall 0.10. What does its F1 score show?",
      options: ["F1 is low, because it is pulled toward the weaker of precision and recall", "F1 is high, because the average of the two is above 0.5", "F1 equals 0.95, the larger of the two", "F1 cannot be computed unless accuracy is known"],
      correctIndex: 0,
      explanation:
        "F1 is the harmonic mean, which is pulled toward the smaller value, so precision 0.95 with recall 0.10 gives F1 of about 0.18. A high value of one metric cannot hide a poor value of the other.",
    },
  },
  {
    id: "model-evaluation-6",
    title: "Threshold Trade-offs",
    subtitle: "Moving along the precision and recall curve",
    prerequisites: ["model-evaluation-5", "classification-foundations-4"],
    theory: [
      {
        heading: "The model's probabilities stay fixed",
        body: "A classifier outputs P(spam) for every email, as in Probabilities and Thresholds. We then choose a threshold to turn probabilities into decisions. Moving the threshold never changes the probabilities; it only changes which emails are predicted spam.",
      },
      {
        heading: "A small example",
        body: "Eight emails with P(spam) and true label: 0.92 spam, 0.83 spam, 0.71 spam, 0.62 legitimate, 0.58 spam, 0.45 legitimate, 0.38 spam, 0.20 legitimate. Five are spam. At threshold 0.5 five emails are flagged: 4 true positives and 1 false positive, with 1 spam missed. Precision 0.80, recall 0.80.",
      },
      {
        heading: "Lower the threshold",
        body: "At 0.3 seven emails are flagged. All 5 spam emails are caught (recall 1.00) but 2 legitimate emails are flagged too (precision 0.714). A lower threshold predicts more positives, which generally raises recall and may lower precision.",
      },
      {
        heading: "Raise the threshold",
        body: "At 0.7 only three emails are flagged, all spam: precision 1.00, but only 3 of 5 spam are found (recall 0.60). At 0.9 only one email is flagged: precision 1.00, recall 0.20. A higher threshold predicts fewer positives, which may raise precision and generally lowers recall.",
      },
      {
        heading: "Takeaway",
        body: "Thresholds trade precision against recall, and in this example they move in opposite directions. The wording is cautious because on a finite dataset precision can stay flat or wobble. The right threshold depends on which mistake costs more and is chosen on validation data.",
      },
    ],
    learnMore:
      "Worked example at threshold 0.7: flagged emails are 0.92, 0.83 and 0.71, all spam, so TP 3, FP 0, FN 2, TN 3. Precision 3 / 3 = 1.00 and recall 3 / 5 = 0.60.",
    python: `probs  = [0.92, 0.83, 0.71, 0.62, 0.58, 0.45, 0.38, 0.20]      # fixed model outputs
labels = [1,    1,    1,    0,    1,    0,    1,    0]         # 1 = spam

for threshold in (0.3, 0.5, 0.7, 0.9):
    preds = [1 if p >= threshold else 0 for p in probs]
    tp = sum(1 for p, y in zip(preds, labels) if p == 1 and y == 1)
    fp = sum(1 for p, y in zip(preds, labels) if p == 1 and y == 0)
    fn = sum(1 for p, y in zip(preds, labels) if p == 0 and y == 1)
    precision = tp / (tp + fp) if tp + fp else None
    recall = tp / (tp + fn)
    print(threshold, "flagged", tp + fp, "TP", tp, "FP", fp, "FN", fn,
          "precision", None if precision is None else round(precision, 3), "recall", round(recall, 2))

# Output:
# 0.3 flagged 7 TP 5 FP 2 FN 0 precision 0.714 recall 1.0
# 0.5 flagged 5 TP 4 FP 1 FN 1 precision 0.8 recall 0.8
# 0.7 flagged 3 TP 3 FP 0 FN 2 precision 1.0 recall 0.6
# 0.9 flagged 1 TP 1 FP 0 FN 4 precision 1.0 recall 0.2`,
    quickCheck: {
      question: "The probabilities from a spam model are fixed. You lower the threshold from 0.5 to 0.3. What is most likely to happen?",
      options: ["The model's probabilities all become smaller", "Fewer emails are flagged as spam, so precision always rises", "More emails are flagged as spam; recall stays the same or rises, and precision stays the same or falls", "Accuracy is guaranteed to rise"],
      correctIndex: 2,
      explanation:
        "Lowering the threshold flags more emails. More flagged emails can only catch more of the real spam (recall stays or rises) but may add legitimate ones (precision stays or falls). The probabilities themselves do not change, and accuracy can go either way.",
    },
  },
  {
    id: "model-evaluation-7",
    title: "Validation Metrics",
    subtitle: "Scores you use to choose, not to brag",
    prerequisites: ["model-evaluation-6"],
    theory: [
      {
        heading: "Choose the metric from the costs",
        body: "Which metric to optimise depends on the problem. In spam filtering a false positive, a blocked legitimate email, can be costly, so precision matters. In fraud detection a false negative, a missed fraud, can be costly, so recall matters. Where both matter, F1 is one balanced summary. There is no universal best metric.",
      },
      {
        heading: "Three candidate classifiers",
        body: "On the validation set, Model A has accuracy 0.92, precision 0.70, recall 0.95. Model B has accuracy 0.91, precision 0.86, recall 0.80. Model C has accuracy 0.94, precision 0.95, recall 0.45. Model C has the best accuracy and the worst recall.",
      },
      {
        heading: "Selection depends on the task",
        body: "If missing positives is the main danger, pick A (recall 0.95). If false alarms are the main danger, pick C (precision 0.95). If both matter equally, B has the best balance (F1 about 0.83, against about 0.81 for A and 0.61 for C). The metric follows the question; it should be chosen before looking at which model wins.",
      },
      {
        heading: "Validation for choosing, test for reporting",
        body: "We compare candidates and tune hyperparameters on validation data. The test set stays locked until the model and metric are final, then it is scored once. If we picked the winner by test score, the test set would stop being an honest estimate.",
      },
      {
        heading: "Takeaway",
        body: "Metrics are evaluation tools chosen to match the consequences of mistakes. They compare models, but precision or F1 are not automatically the loss used to train a model.",
      },
    ],
    learnMore:
      "Worked example: F1 for A = 2 × 0.70 × 0.95 / 1.65 = 0.806. For B = 2 × 0.86 × 0.80 / 1.66 = 0.829. For C = 2 × 0.95 × 0.45 / 1.40 = 0.611. Highest accuracy (C) is not highest recall (A) or best balance (B).",
    python: `def accuracy(tp, tn, fp, fn):
    return (tp + tn) / (tp + tn + fp + fn)

def precision(tp, fp):
    return tp / (tp + fp) if tp + fp > 0 else None      # not defined if nothing was predicted positive

def recall(tp, fn):
    return tp / (tp + fn) if tp + fn > 0 else None      # not defined if there are no actual positives

def f1(p, r):
    return 2 * p * r / (p + r) if p and r else 0.0

candidates = {"A": (0.92, 0.70, 0.95), "B": (0.91, 0.86, 0.80), "C": (0.94, 0.95, 0.45)}   # accuracy, precision, recall
for name, (acc, p, r) in candidates.items():
    print(name, "accuracy", acc, "precision", p, "recall", r, "F1", round(f1(p, r), 3))

print("best accuracy:", max(candidates, key=lambda k: candidates[k][0]))
print("best recall:", max(candidates, key=lambda k: candidates[k][2]))
print("best precision:", max(candidates, key=lambda k: candidates[k][1]))
print("best F1:", max(candidates, key=lambda k: f1(candidates[k][1], candidates[k][2])))

# Output:
# A accuracy 0.92 precision 0.7 recall 0.95 F1 0.806
# B accuracy 0.91 precision 0.86 recall 0.8 F1 0.829
# C accuracy 0.94 precision 0.95 recall 0.45 F1 0.611
# best accuracy: C
# best recall: A
# best precision: C
# best F1: B`,
    quickCheck: {
      question: "A bank wants to catch fraud, and every flagged transaction is reviewed by a person, so false alarms are cheap but missed fraud is very costly. On the validation set, which model should it prefer?",
      options: ["Model C, because it has the highest accuracy", "Model A, because it has the highest recall (0.95)", "Model B, because its accuracy is exactly between the others", "Whichever model scores highest on the test set"],
      correctIndex: 1,
      explanation:
        "Missed fraud is false negatives, which recall measures, so Model A (recall 0.95) fits. Highest accuracy does not mean highest recall. The choice is made on validation data; the test set stays locked until the end.",
    },
  },
  {
    id: "model-evaluation-8",
    title: "Cross-Validation",
    subtitle: "Stable metrics for classifiers with limited data",
    prerequisites: ["model-evaluation-7", "regression-practice-9"],
    theory: [
      {
        heading: "Building on K-fold",
        body: "You already know K-fold cross-validation from Regression in Practice: rotate which fold validates and average the scores. For classification the score is now a metric such as precision, recall or F1, computed on each validation fold.",
      },
      {
        heading: "One split can mislead",
        body: "Take 100 emails with 20 spam and 80 legitimate. With a single validation split, a handful of spam emails decides recall. A fold could by chance contain no spam at all, and then its recall is not defined. A single split is a noisy, sometimes misleading, estimate.",
      },
      {
        heading: "Stratified folds",
        body: "Stratified folds keep the class proportions in every fold. In 5-fold stratified cross-validation each fold of 20 emails has about 4 spam and 16 legitimate, like the whole set. Each fold's metrics are then comparable.",
      },
      {
        heading: "Fold metrics and averages",
        body: "Across five folds in our example, precision per fold is 0.60, 0.80, 0.60, 0.75 and 0.60, and recall is 0.75, 1.00, 0.75, 0.75 and 0.75. The averages are precision 0.67 and recall 0.80, which match the recurring evaluation example. The spread across folds shows how stable the estimate is.",
      },
      {
        heading: "Cross-validation is not the test set",
        body: "Cross-validation folds are used during development to estimate performance and compare models. The final test set is still locked; it is scored once, after every choice is made.",
      },
    ],
    learnMore:
      "Worked example: fold 2 has 4 true positives, 1 false positive, 0 false negatives and 15 true negatives: precision 4 / 5 = 0.80 and recall 4 / 4 = 1.00. Summed over folds the counts are TP 16, FP 8, FN 4, TN 72.",
    python: `def accuracy(tp, tn, fp, fn):
    return (tp + tn) / (tp + tn + fp + fn)

def precision(tp, fp):
    return tp / (tp + fp) if tp + fp > 0 else None      # not defined if nothing was predicted positive

def recall(tp, fn):
    return tp / (tp + fn) if tp + fn > 0 else None      # not defined if there are no actual positives

def f1(p, r):
    return 2 * p * r / (p + r) if p and r else 0.0

folds = [(3, 2, 1, 14), (4, 1, 0, 15), (3, 2, 1, 14), (3, 1, 1, 15), (3, 2, 1, 14)]   # (TP, FP, FN, TN) per stratified fold
ps, rs, f1s = [], [], []
for i, (tp, fp, fn, tn) in enumerate(folds, 1):
    p, r = precision(tp, fp), recall(tp, fn)
    ps.append(p); rs.append(r); f1s.append(f1(p, r))
    print("fold", i, "emails", tp + fp + fn + tn, "spam", tp + fn, "precision", round(p, 2), "recall", round(r, 2))

print("average precision", round(sum(ps) / 5, 3), "recall", round(sum(rs) / 5, 3), "F1", round(sum(f1s) / 5, 3))
print("a fold with no spam, recall:", recall(0, 0))

# Output:
# fold 1 emails 20 spam 4 precision 0.6 recall 0.75
# fold 2 emails 20 spam 4 precision 0.8 recall 1.0
# fold 3 emails 20 spam 4 precision 0.6 recall 0.75
# fold 4 emails 20 spam 4 precision 0.75 recall 0.75
# fold 5 emails 20 spam 4 precision 0.6 recall 0.75
# average precision 0.67 recall 0.8 F1 0.728
# a fold with no spam, recall: None`,
    quickCheck: {
      question: "Why do we use stratified folds when cross-validating a spam classifier with only 20% spam?",
      options: ["To make the final test set larger", "To guarantee the classifier reaches 100% accuracy", "To remove the need for a separate test set", "To keep roughly the same share of spam in every fold, so no fold has too little spam for its metrics to be meaningful"],
      correctIndex: 3,
      explanation:
        "Stratification preserves class proportions in every fold, so each fold has enough spam for recall and precision to mean something. It does not improve the model and does not replace the locked test set.",
    },
  },
];

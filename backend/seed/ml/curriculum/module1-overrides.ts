// Module 1 content overrides for the three checkpoints that are already
// published (v3). The expansion script merges these over the published
// workspace and KEEPS each checkpoint's existing animation and trace reference.
// Nothing here changes the checkpoint ids, titles, XP or prerequisites.

import type { QuickCheckSpec, TheoryBlock } from "./builder.js";

export interface WorkspaceOverride {
  theory: TheoryBlock[];
  learnMore?: string;
  codeExamples?: { language: "python"; code: string }[];
  quickCheck: QuickCheckSpec;
}

export const MODULE1_PUBLISHED_OVERRIDES: Record<string, WorkspaceOverride> = {
  "ml-foundations-1": {
    theory: [
      {
        heading: "Rules vs learning",
        body: "Traditional programming: rules + input → program → output. A person writes the rules. Machine learning reverses the direction: examples (data) + a learning algorithm → a model. The rules are learned from the examples instead of being written by hand.",
      },
      {
        heading: "What a model is",
        body: "A model is a learned function. It takes inputs and produces an output, such as a predicted price or a spam probability. Training chooses the numbers inside the function. Nothing about it is magic: it is a formula whose parameters came from data.",
      },
      {
        heading: "Training and inference",
        body: "Training: the algorithm adjusts the model using labelled examples. Inference: the finished model receives a new input and produces a prediction. Training happens once or occasionally; inference happens every time the model is used.",
      },
      {
        heading: "Generalization",
        body: "Memorizing the training examples is not learning. A useful model must work on examples it has never seen. That ability is generalization, and it is the real goal of training.",
      },
    ],
    learnMore:
      "Worked example: a spam filter. Training: it is shown 10,000 emails already marked spam or not spam, and it learns which patterns go with spam. Inference: a new email arrives and the model outputs spam or not spam. A filter that only remembered those 10,000 emails would fail on the next one, and generalization is what separates the two.",
    codeExamples: [
      {
        language: "python",
        code: "memory = {\"free money now\": 1, \"meeting at 3pm\": 0}  # memorized examples\n\nprint(memory.get(\"free money now\"))  # 1: seen during training\nprint(memory.get(\"win a prize\"))     # None: unseen, memory has no answer",
      },
    ],
    quickCheck: {
      question: "A spam filter was trained on 10,000 labelled emails. Which step happens when it classifies an email that arrives tomorrow?",
      options: [
        "Training: the filter updates its parameters",
        "Data labelling: a person marks the email",
        "Inference: the trained model predicts a label for a new input",
        "Feature selection: the model chooses new features",
      ],
      correctIndex: 2,
      explanation:
        "Inference is using a finished model on new data. Training is the earlier step that changes the parameters, and labelling is data preparation, not prediction.",
    },
  },
  "ml-foundations-2": {
    theory: [
      {
        heading: "Samples",
        body: "A dataset is a table of examples, and each row is one sample. For house prices, each row records a house that sold: its Area, Bedrooms, Age and Sale Price. Sale Price is known for past houses, which is why the model can learn from them.",
      },
      {
        heading: "Features (X)",
        body: "Features are the inputs the model may use: Area, Bedrooms and Age. One house becomes a feature vector x = [area, bedrooms, age], for example [1200, 2, 10].",
      },
      {
        heading: "Labels (y)",
        body: "The label is the target the model learns to predict. Here it is Sale Price, so y is the sale price. For a new house the price is unknown, which is exactly why we want the model to estimate it.",
      },
      {
        heading: "X and y together",
        body: "All feature rows together form X; all targets together form y. Training uses both. A new house gives a new x, and the trained model estimates its y.",
      },
    ],
    learnMore:
      "Worked example: row 1 is a house with area 1200, 2 bedrooms and age 10 that sold for 45 (thousands). Its sample is x = [1200, 2, 10] and its label is y = 45.",
    codeExamples: [
      {
        language: "python",
        code: "# Each row is one house: [area, bedrooms, age, sale price in thousands]\ndataset = [\n    [1200, 2, 10, 45],\n    [1800, 3, 4, 72],\n    [900, 1, 15, 32],\n]\n\nX = [row[:-1] for row in dataset]  # features: every column except the price\ny = [row[-1] for row in dataset]   # labels: the price column\n\nprint(X[0], y[0])  # [1200, 2, 10] 45",
      },
    ],
    quickCheck: {
      question: "A table has the columns Bedrooms, Sale Price, Age and Area. If the model should predict the sale price of a new house, which column is the label y?",
      options: [
        "Sale Price",
        "Bedrooms",
        "Age",
        "Area",
      ],
      correctIndex: 0,
      explanation:
        "The label is the target the model learns to predict, here the sale price. The other columns are features, the inputs the model receives.",
    },
  },
  "ml-foundations-3": {
    theory: [
      {
        heading: "Study hours to exam score",
        body: "Suppose we want to predict an exam score from the hours a student studied. Each student is one sample: x is the hours studied and y is the exam score.",
      },
      {
        heading: "A line as the model",
        body: "A linear model predicts ŷ = w·x + b. The slope w says how many points each extra hour adds, and the intercept b is the predicted score at zero hours. Training means choosing w and b.",
      },
      {
        heading: "Error and MSE",
        body: "The residual is actual − predicted. The mean squared error (MSE) averages the squared residuals: MSE = average((predicted − actual)²). Squaring stops positive and negative errors from cancelling, and it makes large misses count more.",
      },
      {
        heading: "Better parameters, lower error",
        body: "Different lines fit the same points very differently. The line with the smaller MSE fits this data better. Training searches for the w and b that make MSE small. How that search works is covered in the Gradient Descent checkpoint.",
      },
    ],
    learnMore:
      "Worked example: hours 1 to 5 with scores 42, 51, 61, 68, 78. The line ŷ = 9x + 33 predicts 42, 51, 60, 69, 78. The residuals are 0, 0, 1, −1 and 0, so MSE = 2 / 5 = 0.4. A flat line at zero would have MSE of about 3758.8.",
    codeExamples: [
      {
        language: "python",
        code: "hours = [1, 2, 3, 4, 5]\nscores = [42, 51, 61, 68, 78]\n\ndef predict(x, w, b):\n    return w * x + b\n\ndef mse(w, b):\n    errors = [(predict(x, w, b) - y) ** 2 for x, y in zip(hours, scores)]\n    return sum(errors) / len(errors)\n\nprint(round(mse(0, 0), 1))   # 3758.8: a flat line at zero\nprint(round(mse(9, 33), 1))  # 0.4: a much better line",
      },
    ],
    quickCheck: {
      question: "A student studies 3 hours. The model predicts a score of 60, but the actual score is 61. What is the residual, actual minus predicted?",
      options: [
        "-1",
        "60",
        "61",
        "+1",
      ],
      correctIndex: 3,
      explanation:
        "The residual is actual − predicted = 61 − 60 = +1. A positive residual means the model under-predicted this student's score.",
    },
  },
};

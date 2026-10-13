  var steps = [
    {"id": "vague-goal", "label": "Vague goal", "caption": "The request is a wish: \"We want to reduce customer churn.\" It is not yet a machine learning task."},
    {"id": "business-question", "label": "Business question", "caption": "Turn the wish into a question: who will cancel soon, while we can still act?"},
    {"id": "prediction-unit", "label": "Prediction unit", "caption": "The unit is one subscriber on the first day of a month: each row describes one customer at one moment."},
    {"id": "define-target", "label": "Define the target", "caption": "The target churned_30d is 1 if the customer cancels within 30 days and 0 if they stay."},
    {"id": "prediction-horizon", "label": "Prediction horizon", "caption": "The prediction is made on day 0 and the outcome is known by day 30."},
    {"id": "available-data", "label": "Available data", "caption": "Only information known on day 0 may be used: tenure, usage, tickets, price, days since last activity."},
    {"id": "success-metric", "label": "Success criterion", "caption": "Success is written before modelling: recall at least 0.75 with precision at least 0.50. About 20% of customers churn."},
    {"id": "ml-or-not", "label": "ML or not?", "caption": "Could a simple rule do it? Is there enough history? Can the outcome be measured? Here the answers allow a model."},
    {"id": "framed-problem", "label": "The framed problem", "caption": "Unit, target, horizon, inputs and success are written down. Now we can choose data and models."}
  ];

  function stage() { return el("g", {}, svg); }
  var g0 = stage();
  card(g0, 50, 80, 540, 160, "fillA");
  txt(g0, 320, 148, "big", "“We want to reduce customer churn.”", "middle");
  txt(g0, 320, 184, "note", "a wish, not yet a machine learning task", "middle");
  txt(g0, 320, 212, "lbl lbl-r", "which data? which customers? what counts as success?", "middle");
  var g1 = stage();
  card(g1, 50, 60, 540, 70, "fillA"); txt(g1, 320, 102, "lbl", "“We want to reduce customer churn.”", "middle");
  arrowLine(g1, "w", 3, 320, 134, 320, 172);
  card(g1, 50, 178, 540, 90, "fillG");
  txt(g1, 320, 212, "lbl lbl-y", "business question", "middle");
  txt(g1, 320, 240, "big", "Who will cancel soon, while we can still act?", "middle");
  var g2 = stage();
  txt(g2, 320, 70, "lbl lbl-y", "prediction unit: one subscriber on the first day of a month", "middle");
  for (var ci = 0; ci < 12; ci++) {
    var cxp = 62 + (ci % 6) * 94, cyp = 110 + Math.floor(ci / 6) * 80;
    card(g2, cxp, cyp, 80, 60, ci === 4 ? "fillB" : "fillA");
    el("circle", { cx: cxp + 40, cy: cyp + 22, r: 9, fill: CUST[ci % 6] }, g2);
    txt(g2, cxp + 40, cyp + 50, "tick", "customer " + (ci + 1), "middle");
  }
  txt(g2, 320, 290, "note", "each row of the data describes one customer at one moment", "middle");
  var g3 = stage();
  card(g3, 60, 80, 520, 90, "fillA");
  txt(g3, 320, 112, "lbl lbl-y", "target: churned_30d", "middle");
  txt(g3, 320, 146, "mono", "1 = cancels within 30 days     0 = stays", "middle");
  box(g3, 100, 210, 200, 44, "rgba(248,113,113,0.3)", K_BAD, 8); txt(g3, 200, 238, "lbl", "churn = 1", "middle");
  box(g3, 340, 210, 200, 44, "rgba(29,181,132,0.3)", K_OK, 8); txt(g3, 440, 238, "lbl", "stay = 0", "middle");
  var g4 = stage();
  el("line", { x1: 90, y1: 170, x2: 550, y2: 170, stroke: "#c9dccf", "stroke-width": 3 }, g4);
  el("circle", { cx: 130, cy: 170, r: 9, fill: K_VA }, g4); el("circle", { cx: 510, cy: 170, r: 9, fill: K_TE }, g4);
  txt(g4, 130, 148, "lbl lbl-y", "day 0", "middle"); txt(g4, 130, 204, "note", "prediction is made", "middle");
  txt(g4, 510, 148, "lbl lbl-p", "day 30", "middle"); txt(g4, 510, 204, "note", "outcome is known", "middle");
  el("path", { d: "M 130 120 Q 320 70 510 120", fill: "none", stroke: "#e6f5ec", "stroke-width": 2.5 }, g4);
  txt(g4, 320, 86, "big", "30-day horizon", "middle");
  var g5 = stage();
  card(g5, 30, 70, 330, 220, "fillG"); card(g5, 380, 70, 230, 220, "fillB");
  txt(g5, 195, 98, "lbl lbl-y", "known on day 0: allowed", "middle");
  ["tenure", "monthly usage", "support tickets", "plan price", "days since last activity"].forEach(function (s, k) { tick(g5, 70, 134 + k * 30, 8); txt(g5, 94, 139 + k * 30, "lbl", s, "start"); });
  txt(g5, 495, 98, "lbl lbl-r", "not known yet: not allowed", "middle");
  ["will they cancel?", "cancellation date", "exit survey"].forEach(function (s, k) { cross(g5, 408, 134 + k * 30, 7); txt(g5, 428, 139 + k * 30, "lbl", s, "start"); });
  var g6 = stage();
  card(g6, 40, 70, 560, 220, "fillA");
  txt(g6, 320, 98, "lbl lbl-y", "success criterion, written before modelling", "middle");
  txt(g6, 70, 140, "lbl", "recall (churners caught)", "start"); hbar(g6, 70, 148, 340, 18, 0.75, K_OK, 0.75); txt(g6, 430, 163, "mono", ">= 0.75", "start");
  txt(g6, 70, 200, "lbl", "precision (flagged who really churn)", "start"); hbar(g6, 70, 208, 340, 18, 0.5, K_VA, 0.5); txt(g6, 430, 223, "mono", ">= 0.50", "start");
  txt(g6, 320, 262, "note", "base rate: 30 of 150 customers churn (20%); “nobody churns” scores 0.80 accuracy, 0 recall", "middle");
  var g7 = stage();
  [["Could a simple rule do it?", "yes: tested as the baseline", true], ["Is there enough history?", "1,000 observations over 20 weeks", true], ["Can the outcome be measured?", "cancelled within 30 days: yes", true]].forEach(function (r, k) {
    card(g7, 50, 70 + k * 76, 540, 62, "fillG");
    txt(g7, 80, 96 + k * 76, "lbl", r[0], "start"); txt(g7, 80, 118 + k * 76, "note", r[1], "start");
    tick(g7, 556, 104 + k * 76, 11);
  });
  txt(g7, 320, 316, "lbl lbl-y", "if the outcome cannot be measured, we cannot train or check a model", "middle");
  var g8 = stage();
  card(g8, 40, 50, 560, 250, "fillG");
  txt(g8, 320, 82, "big", "The framed problem", "middle");
  [["unit", "one subscriber, first day of a month"], ["target", "churned_30d (1 = cancels within 30 days)"], ["horizon", "30 days, predicted on day 0"], ["inputs", "only what is known on that day"], ["success", "recall >= 0.75 with precision >= 0.50"], ["baseline", "“nobody churns”: accuracy 0.80, recall 0"]].forEach(function (r, k) {
    txt(g8, 70, 118 + k * 28, "lbl lbl-y", r[0], "start"); txt(g8, 160, 118 + k * 28, "lbl", r[1], "start");
  });
  var groups = [g0, g1, g2, g3, g4, g5, g6, g7, g8];
  function render(i) { groups.forEach(function (g, k) { show(g, k === i); }); }
  flatCards();

// MODULE 10 — Clustering (7 checkpoints) in Unsupervised Valley.
//
// One recurring customer dataset of twelve points (x = purchases per month, y = average spend):
//   (1,2) (1.5,1.8) (2,2.5) (2.2,1.7) | (6,6) (6.5,5.5) (7,6.2) (6.8,6.8) | (3,8) (3.5,8.5) (4,7.8) (4.2,8.8)
// K = 3 with starting centers (3,4), (5,3), (5,9.5): converges after two updates to centers
// (1.675,2.0), (6.575,6.125), (3.675,8.275) with WCSS 4.18. Python uses only the standard library; every
// snippet was executed and its real output is appended as comments.

import type { CheckpointSpec } from "./builder.js";

export const clusteringModuleSpecs: CheckpointSpec[] = [
  {
    id: "clustering-1",
    title: "Unsupervised Learning",
    subtitle: "Finding structure when nobody gives you the answers",
    prerequisites: [],
    theory: [
      {
        heading: "Learning without answers",
        body: "In supervised learning every example comes with a known label, such as spam or not spam, and the model learns a rule that predicts it. In unsupervised learning we have only the features. There is no answer key, so the goal changes: discover structure that is already in the data, such as groups of similar examples.",
      },
      {
        heading: "Our dataset: customer behaviour",
        body: "From here on we follow twelve customers. Each is one point: x is purchases per month and y is average spend. Nobody has told us which kind of customer each one is. Looking at the plot, the points seem to fall into about three clumps: a low-purchase, low-spend group, a middle group, and a high-spend group with few purchases.",
      },
      {
        heading: "Clustering",
        body: "Clustering is the main unsupervised technique for this. A clustering algorithm groups points so that points in the same group are more similar to each other than to points in other groups. It is not given labels, so it outputs groups, not named classes.",
      },
      {
        heading: "Be careful with the groups",
        body: "Clustering is not classification without labels. The algorithm only reports which points sit together under its notion of similarity. A cluster does not automatically correspond to a meaningful real-world category, and the cluster numbers 0, 1, 2 are arbitrary names. A person still has to interpret what, if anything, a group means.",
      },
      {
        heading: "Takeaway",
        body: "Supervised learning learns from features and known labels. Unsupervised learning looks for structure in features alone. Clustering is the first example: it proposes groups, and it is up to us to judge whether they are useful.",
      },
    ],
    learnMore:
      "Worked example: an online shop could group customers into segments to plan offers. The algorithm may return three groups, but it cannot say they are budget, regular and big spenders. It only says which customers behave alike.",
    python: `points = [(1, 2), (1.5, 1.8), (2, 2.5), (2.2, 1.7),      # group near the origin
          (6, 6), (6.5, 5.5), (7, 6.2), (6.8, 6.8),      # upper right
          (3, 8), (3.5, 8.5), (4, 7.8), (4.2, 8.8)]      # top left
# x = purchases per month, y = average spend (in $10s)

# supervised view: every example has a known label
labeled = [(p, "budget" if p[0] < 3 else "other") for p in points[:4]]
print(labeled[:2])

# unsupervised view: the same points with no labels at all
print(len(points), "points, no labels")

# a clustering algorithm only reports groups; the numbers are arbitrary ids
centers = [(2, 2), (6.5, 6), (3.5, 8)]
groups = [min(range(3), key=lambda i: (p[0] - centers[i][0]) ** 2 + (p[1] - centers[i][1]) ** 2) for p in points]
print(groups)

# Output:
# [((1, 2), 'budget'), ((1.5, 1.8), 'budget')]
# 12 points, no labels
# [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2]`,
    quickCheck: {
      question: "An online shop has records of purchases per month and average spend for thousands of customers, but no customer-type labels. It wants to discover natural customer segments. Which statement is correct?",
      options: ["This is supervised classification, because the segments are the classes", "This is unsupervised learning: clustering looks for groups using the features alone, and a person must interpret the groups", "This cannot be done, because without labels no model can be trained", "This is regression, because spend is a number"],
      correctIndex: 1,
      explanation:
        "With no labels, the task is to find structure in the features: unsupervised learning, here clustering. The groups it finds are not automatically meaningful categories, so someone has to interpret them.",
    },
  },
  {
    id: "clustering-2",
    title: "Similarity and Distance",
    subtitle: "Deciding which examples are close",
    prerequisites: ["clustering-1"],
    theory: [
      {
        heading: "To group, we must compare",
        body: "A clustering algorithm needs a way to say that two examples are similar. For points in a plane the natural idea is closeness: points that are near each other are alike, points far apart are different. Distance turns similarity into a number we can compute with.",
      },
      {
        heading: "Euclidean distance",
        body: "The straight-line distance between a = (a1, a2) and b = (b1, b2) is d(a, b) = sqrt((a1 − b1)² + (a2 − b2)²). Take the difference in each coordinate, square, add, and take the square root. The customers (1, 2) and (2, 2.5) are at distance about 1.118. The customers (1, 2) and (6, 6) are at distance about 6.403.",
      },
      {
        heading: "Nearest neighbours",
        body: "With a distance we can ask which point is nearest to a given one. For the customer at (1, 2) the nearest of the other eleven is (1.5, 1.8), at distance about 0.539. Everything the next lessons do rests on this single operation.",
      },
      {
        heading: "The feature-scale problem",
        body: "Raw distance mixes all features in one number. If income runs from 0 to 100000 and purchases per month from 0 to 20, the income difference dominates. Customers A = (50000, 2) and B = (50100, 10) look much closer than A and C = (58000, 2.5) even though B buys five times as often. Rescaling each feature to a comparable spread, a scaling or normalization step, fixes this: after dividing by typical spreads, C becomes closer to A than B is.",
      },
      {
        heading: "Distance is a modelling choice",
        body: "Euclidean distance is common, not mandatory. Other measures, and other ways of scaling features, give other neighbours and other groups. Clustering results depend on the notion of similarity we choose, so that choice should match the problem.",
      },
    ],
    learnMore:
      "Worked example with scaling: A = (50000, 2), B = (50100, 10), C = (58000, 2.5). Raw distances: A to B 100.3, A to C 8000. Divide income by 10000 and purchases by 4: A = (5, 0.5), B = (5.01, 2.5), C = (5.8, 0.625). Now A to B is about 2.0 and A to C about 0.8.",
    python: `import math

def distance(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)

def nearest_center(point, centers):
    distances = [distance(point, c) for c in centers]
    return min(range(len(centers)), key=lambda i: distances[i])
points = [(1, 2), (1.5, 1.8), (2, 2.5), (2.2, 1.7),      # group near the origin
          (6, 6), (6.5, 5.5), (7, 6.2), (6.8, 6.8),      # upper right
          (3, 8), (3.5, 8.5), (4, 7.8), (4.2, 8.8)]      # top left
# x = purchases per month, y = average spend (in $10s)

print(round(distance((1, 2), (2, 2.5)), 3))
print(round(distance((1, 2), (6, 6)), 3))

# nearest of the other points to (1, 2)
others = points[1:]
nearest = min(others, key=lambda p: distance((1, 2), p))
print(nearest, round(distance((1, 2), nearest), 3))

# feature scale: income (dollars) and purchases per month
A, B, C = (50000, 2), (50100, 10), (58000, 2.5)
print("raw:", round(distance(A, B), 1), round(distance(A, C), 1))
scale = lambda p: (p[0] / 10000, p[1] / 4)
print("scaled:", round(distance(scale(A), scale(B)), 2), round(distance(scale(A), scale(C)), 2))

# Output:
# 1.118
# 6.403
# (1.5, 1.8) 0.539
# raw: 100.3 8000.0
# scaled: 2.0 0.81`,
    quickCheck: {
      question: "Customers A = (income 50000, 2 purchases a month), B = (50100, 10) and C = (58000, 2.5). Using raw Euclidean distance, B is far closer to A than C is. What is the real problem?",
      options: ["Euclidean distance cannot be computed for two features", "C must be an outlier and should be deleted", "B and A are truly most similar, so nothing is wrong", "Income is measured in much larger numbers, so it dominates the distance; the features should be scaled before comparing"],
      correctIndex: 3,
      explanation:
        "The raw distance is essentially the income difference, because income values are thousands of times larger than purchase counts. Scaling the features to comparable spreads lets purchasing behaviour count, and then C is the closer match to A.",
    },
  },
  {
    id: "clustering-3",
    title: "K-Means Intuition",
    subtitle: "Alternating between centers and members",
    prerequisites: ["clustering-2"],
    theory: [
      {
        heading: "The idea",
        body: "K-Means groups points into K clusters, where we choose K in advance. For our customers use K = 3. Each cluster is represented by one point, its center (also called a centroid). The method looks for centers so that every point is close to the center of its own cluster.",
      },
      {
        heading: "A loop with two moves",
        body: "K-Means alternates two simple moves. First, assign every point to its nearest center. Second, move each center to the mean position of the points assigned to it. Then repeat. Neither move needs labels, only distances and averages.",
      },
      {
        heading: "Watching it on our customers",
        body: "Start with three centers placed at (3, 4), (5, 3) and (5, 9.5). Assigning each customer to its nearest center gives a rough grouping that is wrong for one customer. Moving the centers to the averages of their groups, then assigning again, fixes the mistake. After the second round the three natural groups are found, with centers near (1.68, 2.0), (6.58, 6.12) and (3.67, 8.28).",
      },
      {
        heading: "Why repeat",
        body: "Moving a center changes which center is nearest for some points, and reassigning those points changes the next averages. Each round improves the fit of centers to their points, until nothing changes. The next lessons study the two moves one at a time.",
      },
      {
        heading: "Takeaway",
        body: "K-Means: choose K, place K centers, then repeat assign-to-nearest-center and move-center-to-mean. The centers are in the same space as the data, and the cluster ids 0, 1, 2 are just names.",
      },
    ],
    learnMore:
      "Worked example, first round: the customer at (6.8, 6.8) is nearest to the center (5, 9.5), so it starts in the wrong group. After the centers move to the group averages, (6.8, 6.8) is nearest to the center near (6.5, 5.9) and joins its natural group.",
    python: `points = [(1, 2), (1.5, 1.8), (2, 2.5), (2.2, 1.7),      # group near the origin
          (6, 6), (6.5, 5.5), (7, 6.2), (6.8, 6.8),      # upper right
          (3, 8), (3.5, 8.5), (4, 7.8), (4.2, 8.8)]      # top left
# x = purchases per month, y = average spend (in $10s)

import math

def distance(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)

K = 3
centers = [(3, 4), (5, 3), (5, 9.5)]                  # K starting centers
for round_number in range(1, 4):
    labels = [min(range(K), key=lambda i: distance(p, centers[i])) for p in points]      # assign
    members = [[p for p, l in zip(points, labels) if l == i] for i in range(K)]
    centers = [(sum(p[0] for p in m) / len(m), sum(p[1] for p in m) / len(m)) for m in members]   # move
    print(round_number, labels, [(round(x, 2), round(y, 2)) for x, y in centers])

# Output:
# 1 [0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2] [(1.68, 2.0), (6.5, 5.9), (4.3, 7.98)]
# 2 [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2] [(1.68, 2.0), (6.58, 6.12), (3.67, 8.28)]
# 3 [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2] [(1.68, 2.0), (6.58, 6.12), (3.67, 8.28)]`,
    quickCheck: {
      question: "After a few rounds of K-Means, why does the algorithm keep repeating assignment and update instead of doing each once?",
      options: ["Because moving the centers changes which center is nearest for some points, so the groups can change and the centers must be recomputed", "Because each round adds one more cluster to the model", "Because the first assignment is chosen at random and must be redone", "Because the labels are revealed gradually to the algorithm"],
      correctIndex: 0,
      explanation:
        "Updating the centers moves them, so some points may now be nearer a different center. Reassigning them changes the group averages, so the centers move again. The loop stops when the assignments no longer change.",
    },
  },
  {
    id: "clustering-4",
    title: "Assignment Step",
    subtitle: "Every point chooses its nearest center",
    prerequisites: ["clustering-3"],
    theory: [
      {
        heading: "Centers are fixed",
        body: "In the assignment step the centers do not move. Each point looks at the current centers, measures its distance to each one, and joins the cluster of the nearest. Only the memberships can change.",
      },
      {
        heading: "One point first",
        body: "Take the customer P = (6.8, 6.8) and the centers C1 = (3, 4), C2 = (5, 3), C3 = (5, 9.5). The distances are 4.72 to C1, 4.20 to C2 and 3.24 to C3. The smallest is C3, so P is assigned to cluster 3 (id 2) for now.",
      },
      {
        heading: "All the points",
        body: "Doing the same for all twelve customers gives three groups: the four low-purchase customers join C1, three of the upper-right customers join C2, and five customers (the four top-left ones and P) join C3. The assignment is rough because the centers are only a first guess.",
      },
      {
        heading: "Labels are just names",
        body: "The cluster ids 0, 1, 2 only say which center a point chose. Cluster 1 is not better, larger or more important than cluster 3, and renaming them changes nothing.",
      },
      {
        heading: "Takeaway",
        body: "Assignment = compute the distance from each point to every center and pick the smallest. The centers stay where they are. It can place a point in a cluster that looks wrong, because the centers have not been updated yet.",
      },
    ],
    learnMore:
      "Worked example: P = (6.8, 6.8). To C1 = (3, 4): sqrt(3.8² + 2.8²) = 4.72. To C2 = (5, 3): sqrt(1.8² + 3.8²) = 4.20. To C3 = (5, 9.5): sqrt(1.8² + 2.7²) = 3.24. P joins C3.",
    python: `points = [(1, 2), (1.5, 1.8), (2, 2.5), (2.2, 1.7),      # group near the origin
          (6, 6), (6.5, 5.5), (7, 6.2), (6.8, 6.8),      # upper right
          (3, 8), (3.5, 8.5), (4, 7.8), (4.2, 8.8)]      # top left
# x = purchases per month, y = average spend (in $10s)
import math

def distance(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)

def nearest_center(point, centers):
    distances = [distance(point, c) for c in centers]
    return min(range(len(centers)), key=lambda i: distances[i])

centers = [(3, 4), (5, 3), (5, 9.5)]                  # fixed during this step
P = (6.8, 6.8)
for i, c in enumerate(centers, 1):
    print("distance to C" + str(i), round(distance(P, c), 2))
print("P goes to cluster id", nearest_center(P, centers))

labels = [nearest_center(p, centers) for p in points]
print(labels)
print("centers unchanged:", centers)

# Output:
# distance to C1 4.72
# distance to C2 4.2
# distance to C3 3.24
# P goes to cluster id 2
# [0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2]
# centers unchanged: [(3, 4), (5, 3), (5, 9.5)]`,
    quickCheck: {
      question: "A point P = (4, 5) is at distance 4.24 from center C1, 1.41 from C2 and 4.0 from C3. During the assignment step, what happens?",
      options: ["P becomes the new center of cluster 1, because it is far from everything", "P is assigned to C1 and C1 moves to P's position", "P is assigned to cluster 2 because C2 is nearest, and all three centers stay exactly where they are", "P is split between all three clusters in proportion to the distances"],
      correctIndex: 2,
      explanation:
        "Assignment picks the nearest center, C2 here, and leaves the centers untouched. Centers move only in the update step. K-Means gives P to exactly one cluster; it is not shared.",
    },
  },
  {
    id: "clustering-5",
    title: "Update Step",
    subtitle: "Moving each center to the middle of its group",
    prerequisites: ["clustering-4"],
    theory: [
      {
        heading: "Memberships are fixed",
        body: "In the update step the assignments are frozen. Each cluster looks at the points currently assigned to it and moves its center to their average position. Now the centers move and the memberships stay put.",
      },
      {
        heading: "The centroid is a mean",
        body: "The new centroid of a cluster is the coordinate-wise mean of its members: average all the x values, average all the y values. If a cluster has x values 1, 2 and 3, the mean x is 2, and y is averaged the same way. The centroid is the point that minimizes the total squared distance to its members.",
      },
      {
        heading: "Our customers after the first assignment",
        body: "The four low-purchase customers average to (1.675, 2.0). The three upper-right customers (6, 6), (6.5, 5.5) and (7, 6.2) average to (6.5, 5.9). The five customers in the third cluster average to (4.3, 7.98). The third centroid sits between the top-left group and the stray customer at (6.8, 6.8), pulled toward it.",
      },
      {
        heading: "Cluster versus centroid",
        body: "A cluster is a set of points. A centroid is one location that represents the cluster. The centroid need not be an actual data point, and it can sit in empty space between the points.",
      },
      {
        heading: "Takeaway",
        body: "Update = replace each center by the mean of its assigned points. Points do not move, only centers do. The next assignment, with the new centers, can then change some memberships.",
      },
    ],
    learnMore:
      "Worked example: members (1, 2), (2, 3) and (3, 7). Mean x = (1 + 2 + 3) / 3 = 2 and mean y = (2 + 3 + 7) / 3 = 4, so the new centroid is (2, 4).",
    python: `points = [(1, 2), (1.5, 1.8), (2, 2.5), (2.2, 1.7),      # group near the origin
          (6, 6), (6.5, 5.5), (7, 6.2), (6.8, 6.8),      # upper right
          (3, 8), (3.5, 8.5), (4, 7.8), (4.2, 8.8)]      # top left
# x = purchases per month, y = average spend (in $10s)
import math

def distance(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)

def nearest_center(point, centers):
    distances = [distance(point, c) for c in centers]
    return min(range(len(centers)), key=lambda i: distances[i])
def mean_point(members):
    return (sum(p[0] for p in members) / len(members), sum(p[1] for p in members) / len(members))

centers = [(3, 4), (5, 3), (5, 9.5)]
labels = [nearest_center(p, centers) for p in points]            # assignments, frozen from here
new_centers = []
for i in range(3):
    members = [p for p, l in zip(points, labels) if l == i]
    c = mean_point(members)
    new_centers.append(c)
    print("cluster", i, "has", len(members), "points; new centroid", (round(c[0], 3), round(c[1], 3)))
print("labels unchanged:", labels == [nearest_center(p, centers) for p in points])

print(mean_point([(1, 2), (2, 3), (3, 7)]))

# Output:
# cluster 0 has 4 points; new centroid (1.675, 2.0)
# cluster 1 has 3 points; new centroid (6.5, 5.9)
# cluster 2 has 5 points; new centroid (4.3, 7.98)
# labels unchanged: True
# (2.0, 4.0)`,
    quickCheck: {
      question: "A cluster currently contains the points (1, 2), (2, 3) and (3, 7). In the update step, where does its center move?",
      options: ["To (3, 7), the point farthest from the others", "To (2, 3), the middle point in the list", "To (1, 2), the first point", "To (2, 4), the mean of the x values and the mean of the y values"],
      correctIndex: 3,
      explanation:
        "The update step moves the center to the coordinate-wise mean: x = (1 + 2 + 3) / 3 = 2 and y = (2 + 3 + 7) / 3 = 4. The memberships stay as they are while the center moves.",
    },
  },
  {
    id: "clustering-6",
    title: "Convergence",
    subtitle: "Why the loop stops and what it guarantees",
    prerequisites: ["clustering-5"],
    theory: [
      {
        heading: "The loop and its objective",
        body: "K-Means alternates assignment and update. We can watch how well the centers fit the points with one number: the sum of squared distances from every point to its assigned center, the within-cluster sum of squares (WCSS). Smaller means tighter clusters.",
      },
      {
        heading: "Each step helps",
        body: "Reassigning a point to a nearer center cannot raise the WCSS, and replacing a center by the mean of its points cannot raise it either. On our customers: with the starting centers WCSS is 82.06. Moving the centers lowers it to 13.06 with the same assignments. Reassigning gives 6.31. The next update gives 4.18, and then nothing changes.",
      },
      {
        heading: "Convergence",
        body: "When an assignment step changes no memberships, the update step then leaves the centers where they are, and the loop is stable. That is convergence. K-Means is guaranteed to reach such a stable state in a finite number of rounds.",
      },
      {
        heading: "Converged does not mean best",
        body: "The stable solution depends on the starting centers. From the starting centers (1, 2), (2, 2) and (5, 7) the loop also converges, but with two centers inside one group, two natural groups merged, and a WCSS of 29.48 instead of 4.18. K-Means finds a local solution, not necessarily the global best.",
      },
      {
        heading: "Takeaway",
        body: "K-Means lowers or preserves its objective every step and stops when the centers and assignments stop changing. Convergence is not a guarantee of the best clustering: initialization matters, and runs are often repeated from several starting positions.",
      },
    ],
    learnMore:
      "Worked example, WCSS per step on our customers: 82.06 after the first assignment, 13.06 after the first update, 6.31 after the second assignment, 4.18 after the second update, 4.18 at the third assignment (no change).",
    python: `points = [(1, 2), (1.5, 1.8), (2, 2.5), (2.2, 1.7),      # group near the origin
          (6, 6), (6.5, 5.5), (7, 6.2), (6.8, 6.8),      # upper right
          (3, 8), (3.5, 8.5), (4, 7.8), (4.2, 8.8)]      # top left
# x = purchases per month, y = average spend (in $10s)
import math

def distance(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)

def nearest_center(point, centers):
    distances = [distance(point, c) for c in centers]
    return min(range(len(centers)), key=lambda i: distances[i])
def mean_point(members):
    return (sum(p[0] for p in members) / len(members), sum(p[1] for p in members) / len(members))

def wcss(centers, labels):
    return sum(distance(p, centers[l]) ** 2 for p, l in zip(points, labels))

def kmeans(centers):
    labels = None
    for step in range(1, 11):
        new_labels = [nearest_center(p, centers) for p in points]
        print("assign", step, "WCSS", round(wcss(centers, new_labels), 2))
        if new_labels == labels:
            print("converged")
            break
        labels = new_labels
        centers = [mean_point([p for p, l in zip(points, labels) if l == i]) for i in range(len(centers))]
        print("update", step, "WCSS", round(wcss(centers, labels), 2))
    return round(wcss(centers, labels), 2)

print("final:", kmeans([(3, 4), (5, 3), (5, 9.5)]))
print("different start, final:", kmeans([(1, 2), (2, 2), (5, 7)]))

# Output:
# assign 1 WCSS 82.06
# update 1 WCSS 13.06
# assign 2 WCSS 6.31
# update 2 WCSS 4.18
# assign 3 WCSS 4.18
# converged
# final: 4.18
# assign 1 WCSS 30.11
# update 1 WCSS 29.48
# assign 2 WCSS 29.48
# converged
# different start, final: 29.48`,
    quickCheck: {
      question: "K-Means has converged: another assignment step changes no memberships. Which statement is correct?",
      options: ["The result is guaranteed to be the best possible clustering of the data", "The loop has reached a stable solution, but a different set of starting centers could converge to a different, possibly worse, one", "K-Means has failed, because the centers will keep moving forever", "The number of clusters K has been optimized automatically"],
      correctIndex: 1,
      explanation:
        "Convergence means a stable solution: no point changes cluster, so the centers stop moving. It is a local solution. Different initial centers can give different final clusterings, so convergence is not a guarantee of the global optimum, and K is never chosen by the loop itself.",
    },
  },
  {
    id: "clustering-7",
    title: "Limitations of Hard Clustering",
    subtitle: "When the shape of the groups breaks K-means",
    prerequisites: ["clustering-6"],
    theory: [
      {
        heading: "Hard clustering",
        body: "K-Means is a hard clustering method: every point belongs to exactly one cluster. Customer P is in cluster B, full stop. There is no way to say that P is 60 percent B and 40 percent C. For clearly separated groups that is fine, but real data is often messier.",
      },
      {
        heading: "Ambiguous points",
        body: "A customer at (5, 7) lies between the upper-right and the top-left groups. Its distance to the upper-right center is 1.80 and to the top-left center 1.84: almost a tie. K-Means must still pick one, and a tiny move, to (4.7, 7.1), flips the choice. The hard label hides how uncertain it is.",
      },
      {
        heading: "Shapes, sizes and the starting point",
        body: "K-Means measures distance to centers, so it prefers compact, roughly round clusters of similar size. Long thin groups can be cut across instead of along, and a large dense group next to a small one may be split unintuitively. From the last lesson, different starting centers can give different solutions.",
      },
      {
        heading: "K must be chosen",
        body: "We supply K. Too small merges real groups, too large splits them, and the WCSS always falls as K grows, so it cannot choose K alone. Deciding K takes extra judgement or extra methods.",
      },
      {
        heading: "What comes next",
        body: "Sometimes we want soft membership instead: for the ambiguous customer something like cluster A 0.02, cluster B 0.52, cluster C 0.46, numbers that say how strongly a point belongs to each group. How such memberships are computed is the subject of the next module, on Gaussian Mixture Models. Here we only note what hard clustering cannot say.",
      },
    ],
    learnMore:
      "Worked example: for P = (5, 7), the distance to the center near (6.58, 6.12) is 1.80 and to the center near (3.67, 8.28) is 1.84. The 0.04 difference decides the hard label. The soft numbers above are an illustration of the idea, not computed by K-Means.",
    python: `points = [(1, 2), (1.5, 1.8), (2, 2.5), (2.2, 1.7),      # group near the origin
          (6, 6), (6.5, 5.5), (7, 6.2), (6.8, 6.8),      # upper right
          (3, 8), (3.5, 8.5), (4, 7.8), (4.2, 8.8)]      # top left
# x = purchases per month, y = average spend (in $10s)
import math

def distance(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)

def nearest_center(point, centers):
    distances = [distance(point, c) for c in centers]
    return min(range(len(centers)), key=lambda i: distances[i])
def mean_point(members):
    return (sum(p[0] for p in members) / len(members), sum(p[1] for p in members) / len(members))

centers = [(1.675, 2.0), (6.575, 6.125), (3.675, 8.275)]      # the converged centers
for P in [(5, 7), (4.7, 7.1)]:
    d = [round(distance(P, c), 2) for c in centers]
    print(P, "distances", d, "hard label", nearest_center(P, centers))

# soft membership is not something K-Means can say: it only returns one id per point
print("K-Means returns a single id:", nearest_center((5, 7), centers))

# Output:
# (5, 7) distances [6.0, 1.8, 1.84] hard label 1
# (4.7, 7.1) distances [5.93, 2.11, 1.56] hard label 2
# K-Means returns a single id: 1`,
    quickCheck: {
      question: "A customer lies almost exactly midway between two clusters (distances 1.80 and 1.84 to the two centers). What does K-Means output for that customer?",
      options: ["A 50/50 split between both clusters", "No cluster, because the point is ambiguous", "Exactly one cluster, even though the choice is nearly a tie; it cannot express uncertainty, which is what soft clustering would add", "A new cluster centered on that point"],
      correctIndex: 2,
      explanation:
        "K-Means is a hard clustering method: each point gets exactly one cluster, here decided by a tiny difference in distance. Expressing partial or uncertain membership requires a soft clustering method.",
    },
  },
];

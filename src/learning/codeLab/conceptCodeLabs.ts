// Concept Code Lab definitions — one entry per animation that offers a Code
// Lab. Data only: the page (ConceptCodeLabView) renders whatever is here, so a
// new lab is a new entry, not a new page.
//
// Deliberately separate from graded coding activities: no function-name
// contract, no tests, no required keywords, no demoSolution. Each starter is a
// complete program that runs as written and prints something meaningful.
// Wording follows the CURRENT lesson that shows the animation.

import type { AlgorithmAnimationId } from "../types"

export type LabLanguage = "python" | "cpp" | "java"

export const LAB_LANGUAGES: readonly LabLanguage[] = ["python", "cpp", "java"]

export const LAB_LANGUAGE_LABELS: Record<LabLanguage, string> = {
  python: "Python",
  cpp: "C++",
  java: "Java",
}

export interface ConceptCodeLab {
  animationId: AlgorithmAnimationId
  /** Module the lesson belongs to, shown as the eyebrow. */
  moduleTitle: string
  /** The lesson (checkpoint) the animation appears in. */
  lessonTitle: string
  /** Concept title. */
  title: string
  /** "What are we doing?" */
  summary: string
  /** "Why does it matter?" */
  whyItMatters: string
  /** "In this lesson" — what the animation itself shows. */
  lessonContext: string
  example: { input: string; result: string }
  /** Short, optional nudges for what to change. */
  tryThis: string[]
  starters: Record<LabLanguage, string>
}

const arraysInPlaceReversal: ConceptCodeLab = {
  animationId: "arrays-in-place-reversal",
  moduleTitle: "Arrays & Strings",
  lessonTitle: "Traversal & In-Place Thinking",
  title: "Reversing an Array In Place",
  summary:
    "We swap the value at the left end with the value at the right end, then move both positions inward and repeat until they meet.",
  whyItMatters:
    "Editing in place means writing results back into the array you were given, so the extra space stays O(1). The trade-off is that the original order is gone.",
  lessonContext:
    "The animation reverses [4, 8, 1, 9, 3, 6] with three swaps: 4 and 6, then 8 and 3, then 1 and 9. No second array is needed.",
  example: { input: "[4, 8, 1, 9, 3, 6]", result: "[6, 3, 9, 1, 8, 4]" },
  tryThis: [
    "Change the numbers in the array.",
    "Change while left < right to left <= right. Does anything change?",
    "Remove the left += 1 line and see what happens.",
  ],
  starters: {
    python: `nums = [4, 8, 1, 9, 3, 6]
print("before:", nums)

left = 0
right = len(nums) - 1
while left < right:
    nums[left], nums[right] = nums[right], nums[left]
    left += 1
    right -= 1

print("after: ", nums)
`,
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

void show(const string& label, const vector<int>& nums) {
    cout << label;
    for (int i = 0; i < (int)nums.size(); i++) {
        cout << (i == 0 ? "[" : ", ") << nums[i];
    }
    cout << "]" << endl;
}

int main() {
    vector<int> nums = {4, 8, 1, 9, 3, 6};
    show("before: ", nums);

    int left = 0;
    int right = nums.size() - 1;
    while (left < right) {
        swap(nums[left], nums[right]);
        left++;
        right--;
    }

    show("after:  ", nums);
    return 0;
}
`,
    java: `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] nums = {4, 8, 1, 9, 3, 6};
        System.out.println("before: " + Arrays.toString(nums));

        int left = 0;
        int right = nums.length - 1;
        while (left < right) {
            int temp = nums[left];
            nums[left] = nums[right];
            nums[right] = temp;
            left++;
            right--;
        }

        System.out.println("after:  " + Arrays.toString(nums));
    }
}
`,
  },
}

const binarySearchDecision: ConceptCodeLab = {
  animationId: "binary-search-decision",
  moduleTitle: "Binary Search",
  lessonTitle: "Binary Search Mental Model",
  title: "Halving a Sorted Search Space",
  summary:
    "The array is sorted, so we compare the middle value with the target. That one comparison lets us discard the middle and the whole half that cannot hold the target.",
  whyItMatters:
    "Each comparison removes half of what remains, so the search takes about log₂(n) steps instead of scanning every value.",
  lessonContext:
    "The animation searches [-1, 0, 3, 5, 9, 12] for 9. The two ends of the remaining range are called low and high, and mid sits between them.",
  example: { input: "nums = [-1, 0, 3, 5, 9, 12], target = 9", result: "index 4" },
  tryThis: [
    "Change target to 2, which is not in the array. What is printed?",
    "Change the array, keeping it sorted.",
    "Swap the two range updates to see why they matter.",
  ],
  starters: {
    python: `nums = [-1, 0, 3, 5, 9, 12]
target = 9

low = 0
high = len(nums) - 1
found = -1

while low <= high:
    mid = low + (high - low) // 2
    print(f"low={low} high={high} mid={mid} nums[mid]={nums[mid]}")
    if nums[mid] == target:
        found = mid
        break
    elif nums[mid] < target:
        low = mid + 1    # discard mid and everything to its left
    else:
        high = mid - 1   # discard mid and everything to its right

print("index of target:", found)
`,
    cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {-1, 0, 3, 5, 9, 12};
    int target = 9;

    int low = 0;
    int high = nums.size() - 1;
    int found = -1;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        cout << "low=" << low << " high=" << high << " mid=" << mid
             << " nums[mid]=" << nums[mid] << endl;
        if (nums[mid] == target) {
            found = mid;
            break;
        } else if (nums[mid] < target) {
            low = mid + 1;    // discard mid and everything to its left
        } else {
            high = mid - 1;   // discard mid and everything to its right
        }
    }

    cout << "index of target: " << found << endl;
    return 0;
}
`,
    java: `public class Main {
    public static void main(String[] args) {
        int[] nums = {-1, 0, 3, 5, 9, 12};
        int target = 9;

        int low = 0;
        int high = nums.length - 1;
        int found = -1;

        while (low <= high) {
            int mid = low + (high - low) / 2;
            System.out.println("low=" + low + " high=" + high + " mid=" + mid
                    + " nums[mid]=" + nums[mid]);
            if (nums[mid] == target) {
                found = mid;
                break;
            } else if (nums[mid] < target) {
                low = mid + 1;    // discard mid and everything to its left
            } else {
                high = mid - 1;   // discard mid and everything to its right
            }
        }

        System.out.println("index of target: " + found);
    }
}
`,
  },
}

const twoPointersOppositeSum: ConceptCodeLab = {
  animationId: "two-pointers-opposite-sum",
  moduleTitle: "Two Pointers",
  lessonTitle: "Opposite-End Pointers",
  title: "Finding a Pair in Sorted Input",
  summary:
    "On a sorted array, we look at the values at the left and right ends and compare their sum with the target. Too high moves right inward; too low moves left forward.",
  whyItMatters:
    "Because the array is sorted, each move safely throws one value away, so the search finishes in at most n steps instead of checking every pair.",
  lessonContext:
    "The animation looks for a pair that adds up to 8 in [1, 2, 4, 6, 10]. The first sum, 1 + 10 = 11, is too high, so 10 cannot be in any pair and right moves inward.",
  example: { input: "values = [1, 2, 4, 6, 10], target = 8", result: "2 + 6 = 8, pair found" },
  tryThis: [
    "Change target to 100. When does the loop stop?",
    "Change the target to 7 or 12 and follow the pointers.",
    "Swap the two pointer updates. Why does the answer break?",
  ],
  starters: {
    python: `values = [1, 2, 4, 6, 10]
target = 8

left = 0
right = len(values) - 1
found = False

while left < right:
    total = values[left] + values[right]
    print(f"left={left} right={right}: {values[left]} + {values[right]} = {total}")
    if total == target:
        found = True
        break
    elif total > target:
        right -= 1    # too high: the right value cannot be in any pair
    else:
        left += 1     # too low: the left value cannot be in any pair

print("pair found:", "yes" if found else "no")
`,
    cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> values = {1, 2, 4, 6, 10};
    int target = 8;

    int left = 0;
    int right = values.size() - 1;
    bool found = false;

    while (left < right) {
        int sum = values[left] + values[right];
        cout << "left=" << left << " right=" << right << ": "
             << values[left] << " + " << values[right] << " = " << sum << endl;
        if (sum == target) {
            found = true;
            break;
        } else if (sum > target) {
            right--;    // too high: the right value cannot be in any pair
        } else {
            left++;     // too low: the left value cannot be in any pair
        }
    }

    cout << "pair found: " << (found ? "yes" : "no") << endl;
    return 0;
}
`,
    java: `public class Main {
    public static void main(String[] args) {
        int[] values = {1, 2, 4, 6, 10};
        int target = 8;

        int left = 0;
        int right = values.length - 1;
        boolean found = false;

        while (left < right) {
            int sum = values[left] + values[right];
            System.out.println("left=" + left + " right=" + right + ": "
                    + values[left] + " + " + values[right] + " = " + sum);
            if (sum == target) {
                found = true;
                break;
            } else if (sum > target) {
                right--;    // too high: the right value cannot be in any pair
            } else {
                left++;     // too low: the left value cannot be in any pair
            }
        }

        System.out.println("pair found: " + (found ? "yes" : "no"));
    }
}
`,
  },
}

const slidingWindowVariable: ConceptCodeLab = {
  animationId: "sliding-window-variable",
  moduleTitle: "Sliding Window",
  lessonTitle: "Fixed vs. Variable Window",
  title: "A Variable Window Under a Sum Limit",
  summary:
    "The window grows by moving right. Whenever its total goes over the limit, we shrink it from the left until it is valid again, then record its length.",
  whyItMatters:
    "The window keeps a running total instead of re-adding its values every time, so the whole array is handled in one pass. The window's size is part of the answer.",
  lessonContext:
    "The animation uses [2, 1, 3, 2, 4, 1] with a sum limit of 6. It expands right, checks the total, and removes values from the left while the total is above the limit.",
  example: { input: "values = [2, 1, 3, 2, 4, 1], limit = 6", result: "longest window length 3" },
  tryThis: [
    "Raise limit to 10 and watch the window grow.",
    "Change while window_sum > limit to an if. What breaks?",
    "Set limit to 1. How long can the window get?",
  ],
  starters: {
    python: `values = [2, 1, 3, 2, 4, 1]
limit = 6

left = 0
window_sum = 0
best = 0

for right in range(len(values)):
    window_sum += values[right]           # expand right
    while window_sum > limit:             # shrink from the left until valid
        window_sum -= values[left]
        left += 1
    best = max(best, right - left + 1)
    print(f"right={right} window={values[left:right + 1]} sum={window_sum}")

print("longest window length:", best)
`,
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> values = {2, 1, 3, 2, 4, 1};
    int limit = 6;

    int left = 0;
    int sum = 0;
    int best = 0;

    for (int right = 0; right < (int)values.size(); right++) {
        sum += values[right];             // expand right
        while (sum > limit) {             // shrink from the left until valid
            sum -= values[left];
            left++;
        }
        best = max(best, right - left + 1);

        cout << "right=" << right << " window=[";
        for (int i = left; i <= right; i++) {
            cout << (i == left ? "" : ", ") << values[i];
        }
        cout << "] sum=" << sum << endl;
    }

    cout << "longest window length: " << best << endl;
    return 0;
}
`,
    java: `public class Main {
    public static void main(String[] args) {
        int[] values = {2, 1, 3, 2, 4, 1};
        int limit = 6;

        int left = 0;
        int sum = 0;
        int best = 0;

        for (int right = 0; right < values.length; right++) {
            sum += values[right];             // expand right
            while (sum > limit) {             // shrink from the left until valid
                sum -= values[left];
                left++;
            }
            best = Math.max(best, right - left + 1);

            StringBuilder window = new StringBuilder();
            for (int i = left; i <= right; i++) {
                window.append(i == left ? "" : ", ").append(values[i]);
            }
            System.out.println("right=" + right + " window=[" + window + "] sum=" + sum);
        }

        System.out.println("longest window length: " + best);
    }
}
`,
  },
}

const hashingComplementLookup: ConceptCodeLab = {
  animationId: "hashing-complement-lookup",
  moduleTitle: "Hashing",
  lessonTitle: "Lookup vs. Brute Force",
  title: "Finding a Pair With a Complement Lookup",
  summary:
    "For each number we work out the partner it needs, target minus the current number, and look for that complement among the values we have already seen.",
  whyItMatters:
    "One pass with a map costs about O(n) expected time and O(n) extra space, replacing the O(n²) scan over every pair.",
  lessonContext:
    "The animation walks [2, 7, 11, 15] with target 9. At 2 the complement is 7, which has not been seen, so 2 is stored. At 7 the complement is 2, which is stored, so the pair is indices 0 and 1.",
  example: { input: "nums = [2, 7, 11, 15], target = 9", result: "indices [0, 1]" },
  tryThis: [
    "Change target to 26 and follow the lookups.",
    "Try [3, 2, 4] with target 6. Then move the store line above the check.",
    "Print the whole seen map on each step.",
  ],
  starters: {
    python: `nums = [2, 7, 11, 15]
target = 9

seen = {}
result = None

for i, n in enumerate(nums):
    complement = target - n
    print(f"i={i} n={n} complement={complement} stored={len(seen)}")
    if complement in seen:
        result = [seen[complement], i]
        break
    seen[n] = i

print("pair of indices:", result if result else "none")
`,
    cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;

    unordered_map<int, int> seen;
    bool found = false;
    int first = -1, second = -1;

    for (int i = 0; i < (int)nums.size(); i++) {
        int complement = target - nums[i];
        cout << "i=" << i << " n=" << nums[i] << " complement=" << complement
             << " stored=" << seen.size() << endl;
        if (seen.count(complement)) {
            first = seen[complement];
            second = i;
            found = true;
            break;
        }
        seen[nums[i]] = i;
    }

    if (found) {
        cout << "pair of indices: [" << first << ", " << second << "]" << endl;
    } else {
        cout << "pair of indices: none" << endl;
    }
    return 0;
}
`,
    java: `import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;

        Map<Integer, Integer> seen = new HashMap<>();
        boolean found = false;
        int first = -1, second = -1;

        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            System.out.println("i=" + i + " n=" + nums[i] + " complement=" + complement
                    + " stored=" + seen.size());
            if (seen.containsKey(complement)) {
                first = seen.get(complement);
                second = i;
                found = true;
                break;
            }
            seen.put(nums[i], i);
        }

        if (found) {
            System.out.println("pair of indices: [" + first + ", " + second + "]");
        } else {
            System.out.println("pair of indices: none");
        }
    }
}
`,
  },
}

/** Keyed by animation id. Adding a lab = adding one entry here. */
export const CONCEPT_CODE_LABS: Partial<Record<AlgorithmAnimationId, ConceptCodeLab>> = {
  "arrays-in-place-reversal": arraysInPlaceReversal,
  "binary-search-decision": binarySearchDecision,
  "two-pointers-opposite-sum": twoPointersOppositeSum,
  "sliding-window-variable": slidingWindowVariable,
  "hashing-complement-lookup": hashingComplementLookup,
}

export function getConceptCodeLab(animationId: AlgorithmAnimationId | undefined): ConceptCodeLab | undefined {
  return animationId ? CONCEPT_CODE_LABS[animationId] : undefined
}

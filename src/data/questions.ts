export type QuestionType = "video" | "text" | "code"
export type QuestionCategory = "behavioral" | "technical" | "coding" | "situational" | "culture"

export interface Question {
  id: number
  type: QuestionType
  category: QuestionCategory
  text: { en: string; hi: string }
  duration: number // seconds allotted
  starterCode?: string
  codeLanguage?: string
}

export const questions: Question[] = [
  {
    id: 1,
    type: "video",
    category: "behavioral",
    text: {
      en: "Tell me about yourself and your professional background.",
      hi: "अपने बारे में और अपनी व्यावसायिक पृष्ठभूमि के बारे में बताएं।",
    },
    duration: 150,
  },
  {
    id: 2,
    type: "video",
    category: "behavioral",
    text: {
      en: "Describe a challenging project you led and how you overcame obstacles.",
      hi: "एक चुनौतीपूर्ण प्रोजेक्ट का वर्णन करें जिसका आपने नेतृत्व किया और आपने बाधाओं पर कैसे काबू पाया।",
    },
    duration: 150,
  },
  {
    id: 3,
    type: "text",
    category: "technical",
    text: {
      en: "In your own words, explain the difference between synchronous and asynchronous code, and give one real example of each.",
      hi: "अपने शब्दों में, समकालिक (synchronous) और असमकालिक (asynchronous) कोड के बीच का अंतर समझाएं, और प्रत्येक का एक वास्तविक उदाहरण दें।",
    },
    duration: 240,
  },
  {
    id: 4,
    type: "code",
    category: "coding",
    text: {
      en: "Write a function that takes an array of numbers and returns the two numbers that add up to a given target sum.",
      hi: "एक फ़ंक्शन लिखें जो संख्याओं की एक सरणी लेता है और उन दो संख्याओं को लौटाता है जिनका योग दिए गए लक्ष्य योग के बराबर हो।",
    },
    duration: 420,
    codeLanguage: "javascript",
    starterCode: `function twoSum(nums, target) {\n  // your code here\n}\n`,
  },
  {
    id: 5,
    type: "video",
    category: "situational",
    text: {
      en: "How do you handle disagreements with teammates or stakeholders?",
      hi: "आप टीम के सदस्यों या हितधारकों के साथ असहमति को कैसे संभालते हैं?",
    },
    duration: 150,
  },
  {
    id: 6,
    type: "text",
    category: "situational",
    text: {
      en: "What's your approach to prioritizing tasks under tight deadlines? Walk through a recent example.",
      hi: "तंग समय सीमा के तहत कार्यों को प्राथमिकता देने का आपका दृष्टिकोण क्या है? एक हालिया उदाहरण के माध्यम से बताएं।",
    },
    duration: 240,
  },
  {
    id: 7,
    type: "code",
    category: "coding",
    text: {
      en: "Given a string, write a function that returns true if it reads the same forwards and backwards (a palindrome), ignoring case and spaces.",
      hi: "एक स्ट्रिंग दी गई है, एक फ़ंक्शन लिखें जो सही (true) लौटाए यदि वह आगे और पीछे से समान पढ़ी जाती है (एक पैलिंड्रोम), बड़े-छोटे अक्षर और स्पेस को नज़रअंदाज़ करते हुए।",
    },
    duration: 420,
    codeLanguage: "javascript",
    starterCode: `function isPalindrome(str) {\n  // your code here\n}\n`,
  },
  {
    id: 8,
    type: "video",
    category: "culture",
    text: {
      en: "Where do you see yourself in five years, and why does this role fit that path?",
      hi: "आप खुद को पांच साल में कहां देखते हैं, और यह भूमिका उस रास्ते में क्यों फिट बैठती है?",
    },
    duration: 150,
  },
  {
    id: 9,
    type: "text",
    category: "culture",
    text: {
      en: "How do you stay updated with industry trends and new technologies relevant to this role?",
      hi: "आप इस भूमिका से संबंधित उद्योग के रुझानों और नई तकनीकों से खुद को कैसे अपडेट रखते हैं?",
    },
    duration: 200,
  },
  {
    id: 10,
    type: "video",
    category: "behavioral",
    text: {
      en: "What questions do you have for us about the role or the company?",
      hi: "भूमिका या कंपनी के बारे में आपके पास हमारे लिए क्या प्रश्न हैं?",
    },
    duration: 150,
  },
]

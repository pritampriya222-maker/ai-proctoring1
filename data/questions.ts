import type { Question } from "@/types"

/**
 * Sample question bank for the proctored examination
 * In production, this would be fetched from a database or API
 * Each question includes difficulty and minimum expected time for behavior analysis
 */

export const sampleQuestions: Question[] = [
  {
    questionId: "q1",
    question: "What is the time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    correctAnswer: 1,
    difficulty: "easy",
    minimumExpectedTime: 15,
  },
  {
    questionId: "q2",
    question: "Which data structure uses LIFO (Last In First Out) principle?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    correctAnswer: 1,
    difficulty: "easy",
    minimumExpectedTime: 10,
  },
  {
    questionId: "q3",
    question: "What is the output of: console.log(typeof null)?",
    options: ["null", "undefined", "object", "number"],
    correctAnswer: 2,
    difficulty: "medium",
    minimumExpectedTime: 20,
  },
  {
    questionId: "q4",
    question: "Which sorting algorithm has the best average-case time complexity?",
    options: ["Bubble Sort", "Quick Sort", "Selection Sort", "Insertion Sort"],
    correctAnswer: 1,
    difficulty: "medium",
    minimumExpectedTime: 25,
  },
  {
    questionId: "q5",
    question: "What is the space complexity of merge sort?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correctAnswer: 2,
    difficulty: "medium",
    minimumExpectedTime: 30,
  },
  {
    questionId: "q6",
    question: "In a Binary Search Tree, what is the time complexity of searching for an element in the worst case?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: 2,
    difficulty: "hard",
    minimumExpectedTime: 45,
  },
  {
    questionId: "q7",
    question: "Which of the following is NOT a characteristic of a Red-Black Tree?",
    options: [
      "Every node is either red or black",
      "The root is always black",
      "All leaves are red",
      "Red nodes cannot have red children",
    ],
    correctAnswer: 2,
    difficulty: "hard",
    minimumExpectedTime: 60,
  },
  {
    questionId: "q8",
    question: "What is the amortized time complexity of inserting n elements into a dynamic array?",
    options: ["O(1) per insertion", "O(n) per insertion", "O(log n) per insertion", "O(n²) total"],
    correctAnswer: 0,
    difficulty: "hard",
    minimumExpectedTime: 50,
  },
  {
    questionId: "q9",
    question: "Which traversal of a Binary Search Tree gives nodes in ascending order?",
    options: ["Preorder", "Postorder", "Inorder", "Level order"],
    correctAnswer: 2,
    difficulty: "easy",
    minimumExpectedTime: 15,
  },
  {
    questionId: "q10",
    question: "What is the maximum number of nodes at level L in a binary tree?",
    options: ["L", "2^L", "2L", "L²"],
    correctAnswer: 1,
    difficulty: "medium",
    minimumExpectedTime: 25,
  },
]

// Exam configuration
export const EXAM_CONFIG = {
  duration: 30, // minutes
  passingScore: 60, // percentage
  questionPollInterval: 30000, // 30 seconds - for dynamic question updates
}

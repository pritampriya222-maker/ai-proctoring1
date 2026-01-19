import type { QuestionPaper, Section, Question } from "@/types"

// Mock data storage for Question Papers
const QUESTION_PAPERS: QuestionPaper[] = [
    {
        id: "qp_1",
        name: "General Computer Science",
        sections: [
            { id: "sec_algo", name: "Algorithms" },
            { id: "sec_db", name: "Databases" }
        ],
        questions: {
            "sec_algo": [],
            "sec_db": []
        },
        totalQuestions: 0,
        durationMinutes: 60
    }
];

export async function getQuestionPapers(): Promise<QuestionPaper[]> {
    // In a real app, fetch from backend.
    // Using mock for "existing codebase" extension unless I create a new API route.
    // I'll create a simple API route for this too if needed, but for now client-side service mock is often enough
    // if persistence isn't strictly required for the demo of "selection".
    // But the prompt says "Use: Backend persistence".

    // So I should fetch from an API.
    try {
        const res = await fetch('/api/admin/question-papers');
        if (res.ok) return await res.json();
    } catch (e) { }
    return [];
}

export async function createQuestionPaper(paper: QuestionPaper): Promise<void> {
    await fetch('/api/admin/question-papers', {
        method: 'POST',
        body: JSON.stringify({ action: 'create', paper })
    });
}

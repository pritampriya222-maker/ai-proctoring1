
import { NextResponse } from 'next/server';
import type { Question } from '@/types';
import { sampleQuestions } from '@/data/questions';

// Global memory for questions
declare global {
    var globalQuestions: Question[] | undefined;
    var globalQuestionVersion: number | undefined;
}

if (!globalThis.globalQuestions) {
    globalThis.globalQuestions = [...sampleQuestions];
    globalThis.globalQuestionVersion = 1;
}

export async function GET() {
    return NextResponse.json({
        questions: globalThis.globalQuestions,
        version: globalThis.globalQuestionVersion
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, question, questionId, updates } = body;

        if (action === 'update') {
            const index = globalThis.globalQuestions?.findIndex(q => q.questionId === questionId);
            if (index !== undefined && index !== -1 && globalThis.globalQuestions) {
                globalThis.globalQuestions[index] = { ...globalThis.globalQuestions[index], ...updates };
                globalThis.globalQuestionVersion!++;
            }
        } else if (action === 'add') {
            globalThis.globalQuestions?.push(question);
            globalThis.globalQuestionVersion!++;
        } else if (action === 'reset') {
            globalThis.globalQuestions = [...sampleQuestions];
            globalThis.globalQuestionVersion = 1;
        }

        return NextResponse.json({
            success: true,
            questions: globalThis.globalQuestions,
            version: globalThis.globalQuestionVersion
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

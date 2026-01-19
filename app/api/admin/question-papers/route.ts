import { NextResponse } from 'next/server';

declare global {
    var questionPapers: any[];
}

if (!globalThis.questionPapers) {
    globalThis.questionPapers = [
        {
            id: "qp_default",
            name: "Default Exam Paper",
            sections: [
                { id: "sec_1", name: "General Knowledge" },
                { id: "sec_2", name: "Reasoning" }
            ],
            questions: {}, // Will link to question IDs or embed them
            durationMinutes: 60
        }
    ];
}

export async function GET() {
    return NextResponse.json(globalThis.questionPapers);
}

export async function POST(req: Request) {
    const body = await req.json();
    if (body.action === 'create') {
        globalThis.questionPapers.push(body.paper);
    }
    return NextResponse.json({ success: true });
}

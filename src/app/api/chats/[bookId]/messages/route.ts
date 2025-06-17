import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BOOK_PERSONA_PROMPT = `You are a wise, knowledgeable, and empathetic book. 
You only talk about books, literature, and reading. 
Never discuss anything else. 
Answer as if you are the book itself, 
guiding the user on a literary journey.`;

export async function GET(
	req: NextRequest,
	{ params }: { params: { bookId: string } }
) {
	const { bookId } = await params;
	const cookieStore = await cookies();
	const supabase = createRouteHandlerClient<Database>({
		// @ts-expect-error Next.js cookies() is actually async at runtime
		cookies: () => cookieStore,
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
	}

	// Try to get the chat session
	const { data: session, error: sessionError } = await supabase
		.from('chat_sessions')
		.select('id')
		// @ts-expect-error Supabase type mismatch, runtime is correct
		.eq('user_id', user.id)
		// @ts-expect-error Supabase type mismatch, runtime is correct
		.eq('book_id', bookId)
		.single();

	if (sessionError) {
		return NextResponse.json([]);
	}
	if (!session || typeof session !== 'object' || !('id' in session)) {
		// No session: return empty array
		return NextResponse.json([]);
	}

	// Get messages for this session
	const { data: messages, error: messagesError } = await supabase
		.from('messages')
		.select('*')
		.eq('session_id', session.id)
		.order('created_at', { ascending: true });

	if (messagesError) {
		return NextResponse.json({ error: messagesError.message }, { status: 500 });
	}

	return NextResponse.json(messages);
}

export async function POST(
	req: NextRequest,
	{ params }: { params: { bookId: string } }
) {
	const { bookId } = await params;
	const cookieStore = await cookies();
	const supabase = createRouteHandlerClient<Database>({
		// @ts-expect-error Supabase type mismatch, runtime is correct
		cookies: () => cookieStore,
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
	}
	const { content } = await req.json();

	// Try to get the chat session
	let { data: session } = await supabase
		.from('chat_sessions')
		.select('id')
		// @ts-expect-error Supabase type mismatch, runtime is correct
		.eq('user_id', user.id)
		// @ts-expect-error Supabase type mismatch, runtime is correct
		.eq('book_id', bookId)
		.single();

	if (!session || typeof session !== 'object' || !('id' in session)) {
		// Create the session if it doesn't exist
		const { data: newSession, error: sessionError } = await supabase
			.from('chat_sessions')
			// @ts-expect-error Supabase type mismatch, runtime is correct
			.insert({
				user_id: user.id,
				book_id: bookId,
				context: {},
			} satisfies Database['public']['Tables']['chat_sessions']['Insert'])
			.select()
			.single();
		if (sessionError || !newSession) {
			return NextResponse.json(
				{ error: sessionError?.message || 'Session creation failed' },
				{ status: 500 }
			);
		}
		// @ts-expect-error Supabase type mismatch, runtime is correct
		session = newSession;
	}

	// Save the user's message
	const { data: userMsg, error: userMsgError } = await supabase
		.from('messages')
		// @ts-expect-error Supabase type mismatch, runtime is correct
		.insert({
			// @ts-expect-error Supabase type mismatch, runtime is correct
			session_id: session.id,
			content,
			role: 'user',
			metadata: {},
		} satisfies Database['public']['Tables']['messages']['Insert'])
		.select()
		.single();
	if (userMsgError) {
		return NextResponse.json({ error: userMsgError.message }, { status: 500 });
	}

	// Prepare messages for OpenAI
	const messagesForAI: ChatCompletionMessageParam[] = [
		{ role: 'system', content: BOOK_PERSONA_PROMPT },
	];
	// Get all previous messages for this session (including the new user message)
	const { data: allMessages } = await supabase
		.from('messages')
		.select('*')
		// @ts-expect-error Supabase type mismatch, runtime is correct
		.eq('session_id', session.id)
		.order('created_at', { ascending: true });
	if (allMessages) {
		for (const msg of allMessages) {
			// @ts-expect-error Supabase type mismatch, runtime is correct
			messagesForAI.push({ role: msg.role, content: msg.content });
		}
	}

	const aiResponses: { role: 'assistant' | 'user'; content: string }[] = [];

	// Call OpenAI for the AI's response
	const completion = await openai.chat.completions.create({
		model: 'gpt-4o',
		messages: messagesForAI,
		max_tokens: 300,
		temperature: 0.7,
	});
	const aiContent = completion.choices[0]?.message?.content?.trim() || '';
	aiResponses.push({ role: 'assistant', content: aiContent });

	// Save the AI's response(s)
	for (const aiMsg of aiResponses) {
		// @ts-expect-error Supabase type mismatch, runtime is correct
		await supabase.from('messages').insert({
			// @ts-expect-error Supabase type mismatch, runtime is correct
			session_id: session.id,
			content: aiMsg.content,
			role: 'assistant',
			metadata: {},
		} satisfies Database['public']['Tables']['messages']['Insert']);
	}

	// Return all new messages (user + AI responses)
	return NextResponse.json([
		userMsg,
		...aiResponses.map(msg => ({
			// @ts-expect-error Supabase type mismatch, runtime is correct
			session_id: session.id,
			content: msg.content,
			role: msg.role,
			metadata: {},
		})),
	]);
}

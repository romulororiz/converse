import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

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

	// Find the chat session for this user and book
	const { data: session, error } = await supabase
		.from('chat_sessions')
		.select('*')
		// @ts-expect-error Next.js params is actually async at runtime
		.eq('user_id', user.id)
		// @ts-expect-error Next.js params is actually async at runtime

		.eq('book_id', bookId)
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	if (!session || typeof session !== 'object' || !('id' in session)) {
		return NextResponse.json({ error: 'Session not found' }, { status: 404 });
	}

	return NextResponse.json(session);
}

export async function POST(
	req: NextRequest,
	{ params }: { params: { bookId: string } }
) {
	const { bookId } = await params;
	const cookieStore = await cookies();
	const supabase = createRouteHandlerClient<Database>({
	// @ts-expect-error Next.js params is actually async at runtime
		cookies: () => cookieStore,
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
	}

	// Check if a chat session already exists
	const { data: existingSession } = await supabase
		.from('chat_sessions')
		.select('id')
		// @ts-expect-error Next.js params is actually async at runtime
		.eq('user_id', user.id)
		// @ts-expect-error Next.js params is actually async at runtime
		.eq('book_id', bookId)
		.single();

	if (
		existingSession &&
		typeof existingSession === 'object' &&
		'id' in existingSession
	) {
		return NextResponse.json({ sessionId: existingSession.id });
	}

	// Create a new chat session
	const { data: newSession, error } = await supabase
		.from('chat_sessions')
		// @ts-expect-error Next.js params is actually async at runtime
		.insert({
			user_id: user.id,
			book_id: bookId,
			context: {},
		} satisfies Database['public']['Tables']['chat_sessions']['Insert'])
		.select()
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	if (!newSession || typeof newSession !== 'object' || !('id' in newSession)) {
		return NextResponse.json(
			{ error: 'Session creation failed' },
			{ status: 500 }
		);
	}
	// @ts-expect-error Next.js params is actually async at runtime
	return NextResponse.json({ sessionId: newSession.id });
}

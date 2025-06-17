import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const userId = searchParams.get('userId');
	if (!userId)
		return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

	const cookieStore = await cookies();
	const supabase = createRouteHandlerClient<Database>({
		// @ts-expect-error Next.js cookies() is actually async at runtime
		cookies: () => cookieStore,
	});

	const { data, error } = await supabase
		.from('chat_sessions')
		.select('*, books(title, cover_url)')
		// @ts-expect-error Next.js params is actually async at runtime
		.eq('user_id', userId)
		.order('updated_at', { ascending: false });

	if (error)
		return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
	const { userId, bookId } = await req.json();
	if (!userId || !bookId)
		return NextResponse.json(
			{ error: 'Missing userId or bookId' },
			{ status: 400 }
		);

	const cookieStore = await cookies();
	// @ts-expect-error Next.js cookies() is actually async at runtime
	const supabase = createRouteHandlerClient<Database>({ cookieStore });

	// Try to find existing session
	const { data: session } = await supabase
		.from('chat_sessions')
		.select('*')
		.eq('user_id', userId)
		.eq('book_id', bookId)
		.single();

	if (session && typeof session === 'object' && 'id' in session)
		return NextResponse.json(session);

	// If not found, create it
	const { data, error: insertError } = await supabase
		.from('chat_sessions')
		// @ts-expect-error Next.js cookies() is actually async at runtime
		.insert({ user_id: userId, book_id: bookId })
		.select()
		.single();

	if (insertError)
		return NextResponse.json({ error: insertError.message }, { status: 500 });
	return NextResponse.json(data);
}

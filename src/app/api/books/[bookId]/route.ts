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

	const { data, error } = await supabase
		.from('books')
		.select('*')
		// @ts-expect-error Next.js params is actually async at runtime
		.eq('id', bookId)
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json(data);
}

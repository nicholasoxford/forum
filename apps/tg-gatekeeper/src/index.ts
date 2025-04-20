/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { createClient } from '@libsql/client/web';

export interface Env {
	BOT_TOKEN: string;
	WEBHOOK_SECRET: string;
	PUBLIC_URL: string;
	HELIUS_API_KEY: string;
	TURSO_URL: string;
	TURSO_AUTH_TOKEN: string;
}

const encoder = new TextEncoder();

/* ------------------------------------------------------------ */
/* Entry point                                                  */
/* ------------------------------------------------------------ */
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		console.log('HITTING THIS WEBHOOK');
		console.log({ request });
		console.log({ url });

		// 1️⃣ Telegram webhook
		if (request.method === 'POST' && url.pathname === `/tg/${env.WEBHOOK_SECRET}`) {
			return handleTelegram(request, env);
		}

		// 2️⃣ Wallet verifier callback
		if (request.method === 'POST' && url.pathname === '/api/verify') {
			return handleVerify(request, env);
		}

		// 3️⃣ Test database endpoint
		if (request.method === 'GET' && url.pathname === '/api/test-db') {
			return handleTestDb(request, env);
		}

		return new Response('Not found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;

/* ------------------------------------------------------------ */
/* 1️⃣ /tg/… – Telegram sends chat_join_request                  */
/* ------------------------------------------------------------ */
async function handleTelegram(req: Request, env: Env): Promise<Response> {
	const { BOT_TOKEN, PUBLIC_URL } = env;
	const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

	const body = await req.json<any>();
	const join = body?.chat_join_request;
	if (!join) return new Response('ignored');

	const { chat, from } = join;

	// DM user with inline button – chat & user embedded in URL
	await fetch(`${API}/sendMessage`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			chat_id: from.id,
			text:
				`👋 To enter *${chat.title}* please sign a message proving you own ` +
				`the required Solana wallet.\n\n• Tap the button\n• Sign\n• Jump back ✨`,
			parse_mode: 'Markdown',
			reply_markup: {
				inline_keyboard: [[{ text: 'Verify wallet', url: `${PUBLIC_URL}/verify?chat=${chat.id}&user=${from.id}` }]],
			},
		}),
	});

	return new Response('sent');
}

/* ------------------------------------------------------------ */
/* 2️⃣ /api/verify – Next.js page posts here with signature       */
/* ------------------------------------------------------------ */
async function handleVerify(req: Request, env: Env): Promise<Response> {
	const { BOT_TOKEN, HELIUS_API_KEY, TURSO_URL, TURSO_AUTH_TOKEN } = env;
	const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

	const { chatId, userId, pubkey, signature } = await req.json<{
		chatId: number;
		userId: number;
		pubkey: string;
		signature: number[];
	}>();

	// --- Fetch mint & required holdings from Turso ---
	let mint: string | undefined;
	let requiredHoldings = '1';
	try {
		const client = createClient({ url: TURSO_URL, authToken: TURSO_AUTH_TOKEN });
		const res = await client.execute('SELECT token_mint_address, required_holdings FROM group_chats WHERE telegram_chat_id = ? LIMIT 1', [
			chatId.toString(),
		]);
		if (res.rows.length) {
			mint = res.rows[0].token_mint_address as string;
			requiredHoldings = res.rows[0].required_holdings as string;
		}
	} catch (err) {
		console.error('Turso query error', err);
		return new Response('db error', { status: 500 });
	}
	if (!mint) return new Response('unknown chat', { status: 400 });

	// ——— A) verify signature ———
	const text = `Join request for ${chatId} by ${userId}`;
	const okSig = nacl.sign.detached.verify(encoder.encode(text), Uint8Array.from(signature), bs58.decode(pubkey));
	if (!okSig) return new Response('bad signature');

	// ——— B) check wallet balance ———
	const helius = await fetch(`https://api.helius.xyz/v0/addresses/${pubkey}/balances?api-key=${HELIUS_API_KEY}`).then((r) =>
		r.json<{ tokens: any[] }>(),
	);
	const holds = helius.tokens.some((t) => t.mint === mint && Number(t.amount) >= Number(requiredHoldings));

	// ——— C) approve or decline in Telegram ———
	const method = holds ? 'approveChatJoinRequest' : 'declineChatJoinRequest';
	await fetch(`${API}/${method}`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			user_id: userId,
		}),
	});

	return new Response(holds ? 'approved' : 'denied');
}

/* ------------------------------------------------------------ */
/* 3️⃣ /api/test-db – Test database connection and query           */
/* ------------------------------------------------------------ */
async function handleTestDb(req: Request, env: Env): Promise<Response> {
	const { TURSO_URL, TURSO_AUTH_TOKEN } = env;

	try {
		const client = createClient({ url: TURSO_URL, authToken: TURSO_AUTH_TOKEN });

		// Test query to get all group chats
		const result = await client.execute('SELECT * FROM group_chats LIMIT 10');

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Database connection successful',
				data: result.rows,
			}),
			{
				headers: { 'Content-Type': 'application/json' },
			},
		);
	} catch (error) {
		console.error('Database test error:', error);
		return new Response(
			JSON.stringify({
				success: false,
				message: 'Database connection failed',
				error: error instanceof Error ? error.message : String(error),
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}
}

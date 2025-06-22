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


export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		if(url.pathname === "/api/blogs"){
			const { results } = await env.DB_BLOG.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
			return Response.json(results);
		}

		if(url.pathname === "/api/projects"){
			const { results } = await env.DB_PROJECTS.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
			return Response.json(results);
		}
		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;

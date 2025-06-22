import { Hono, Context, Next } from "hono";
import { cors } from "hono/cors";
import { handleRest } from "./rest";

export interface Env {
	DB_BLOG: D1Database;
	DB_PROJECTS: D1Database;
	DB_IMAGES: D1Database;
	DB_VIDEOS: D1Database;
	DB_MODELS: D1Database;
	DB_COMMENTS: D1Database;
	DB_USERS: D1Database;
	SECRET: SecretsStoreSecret;
}


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

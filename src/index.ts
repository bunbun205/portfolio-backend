import { Hono, Context, Next } from "hono";
import { cors } from "hono/cors";
import { handleRest } from './rest';

export interface Env {
	DB_BLOG: D1Database;
	DB_PROJECTS: D1Database;
	DB_IMAGES: D1Database;
	DB_VIDEOS: D1Database;
	DB_MODELS: D1Database;
	DB_COMMENTS: D1Database;
	DB_USERS: D1Database;
	SECRET: SecretsStoreSecret;

	IMAGES_BUCKET: R2Bucket;
	VIDEOS_BUCKET: R2Bucket;
	MODELS_BUCKET: R2Bucket;
	ASSETS_BUCKET: R2Bucket;
}

function resolveBucket(env: Env, bucketName: string): R2Bucket | null {
	switch (bucketName) {
		case 'images': return env.IMAGES_BUCKET;
		case 'videos': return env.VIDEOS_BUCKET;
		case 'models': return env.MODELS_BUCKET;
		case 'assets': return env.ASSETS_BUCKET;
		default: return null;
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const app = new Hono<{ Bindings: Env }>();

		app.use('*', async (c, next) => cors()(c, next));

		const secret = await env.SECRET.get();

		const authMiddleware = async (c: Context, next: Next) => {
			const authHeader = c.req.header('Authorization');
			if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
			const token = authHeader.startsWith('Bearer ')
				? authHeader.substring(7)
				: authHeader;
			if (token !== secret) return c.json({ error: 'Unauthorized' }, 401);
			return next();
		};

		app.all('/rest/*', authMiddleware, handleRest);

		app.post('/query', authMiddleware, async (c) => {
			const body = await c.req.json();
			const { query, params, db } = body;

			if (!query || !db) {
				return c.json({ error: 'Query and db are required' }, 400);
			}

			const selectedDb = (env as any)[`DB_${db.toUpperCase()}`] as D1Database;
			if (!selectedDb) {
				return c.json({ error: `Invalid database: ${db}` }, 400);
			}

			try {
				const result = await selectedDb.prepare(query).bind(...(params || [])).all();
				return c.json(result);
			} catch (error: any) {
				return c.json({ error: error.message }, 500);
			}
		});

		// Upload asset to R2
		app.post('/upload/:bucketName/:filename', authMiddleware, async (c) => {
			const { bucketName, filename } = c.req.param();
			const bucket = resolveBucket(env, bucketName);
			if (!bucket) return c.json({ error: 'Invalid bucket' }, 400);

			const contentType = c.req.header('content-type') ?? 'application/octet-stream';
			const body = await c.req.arrayBuffer();

			await bucket.put(filename, body, {
				httpMetadata: { contentType }
			});

			return c.json({ success: true, filename, contentType }, 201);
		});


		return app.fetch(request, env, ctx);
	}
} satisfies ExportedHandler<Env>;

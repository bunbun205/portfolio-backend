import { Hono, Context, Next } from "hono";
import { cors } from "hono/cors";
import { handleRest } from './rest';

export interface Env {
	DB_BLOG: D1Database;
	DB_PROJECTS: D1Database;
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

		app.get('/list/:bucket', authMiddleware, async (c) => {
			const bucketName = c.req.param('bucket');
			const bucket = resolveBucket(c.env, bucketName);

			if (!bucket) {
				return c.json({ error: `Bucket '${bucketName}' not found` }, 404);
			}

			try {
				const objects = await bucket.list();
				return c.json({ files: objects.objects });
			} catch (err: any) {
				return c.json({ error: err.message || 'Failed to list objects' }, 500);
			}
		});

		app.get('/preview/:bucket/:key', authMiddleware, async (c) => {
			const bucketName = c.req.param('bucket');
			const key = c.req.param('key');
			const bucket = resolveBucket(c.env, bucketName);

			if (!bucket) {
				return c.json({ error: `Bucket '${bucketName}' not found` }, 404);
			}

			try {
				const obj = await bucket.get(decodeURIComponent(key));

				if (!obj || !obj.body) {
					return c.json({ error: 'Object not found' }, 404);
				}

				const headers = new Headers();
				headers.set(
					'Content-Type',
					(obj.httpMetadata && obj.httpMetadata.contentType) || 'application/octet-stream'
				);

				return new Response(obj.body, { headers });
			} catch (err: any) {
				return c.json({ error: err.message || 'Failed to preview object' }, 500);
			}
		});

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
		app.put('/upload/:bucket/:filename', authMiddleware, async (c) => {
			const bucketName = c.req.param('bucket');
			const filename = c.req.param('filename');

			if (!['images', 'videos', 'models', 'assets'].includes(bucketName)) {
				return c.json({ error: 'Invalid bucket' }, 400);
			}

			const r2 = c.env[`${bucketName.toUpperCase()}_BUCKET` as keyof Env] as R2Bucket;
			const contentType = c.req.header('content-type') || 'application/octet-stream';
			const body = await c.req.arrayBuffer();

			await r2.put(filename, body, {
				httpMetadata: { contentType }
			});

			return c.json({ success: true, key: filename, url: `${bucketName}/${filename}` });
		});

		app.delete('/delete/:bucket/:key', async (c) => {
			const { bucket, key } = c.req.param();
			const bucketObj = resolveBucket(c.env, bucket);
			if (!bucketObj) return c.json({ error: 'Invalid bucket' }, 400);

			await bucketObj.delete(decodeURIComponent(key));
			return c.json({ success: true });
		});

		return app.fetch(request, env, ctx);
	}
} satisfies ExportedHandler<Env>;

import Fastify from "fastify";

function adaptHandler(handler: (req: any, res: any) => Promise<any>) {
  return async (request: any, reply: any) => {
    const req: any = {
      query: request.query,
      params: request.params,
      body: request.body,
      headers: request.headers,
    };

    const res: any = {
      _status: 200,
      _headers: {} as Record<string, string>,
      status(code: number) {
        this._status = code;
        return this;
      },
      setHeader(key: string, value: string | number) {
        this._headers[key] = String(value);
        return this;
      },
      json(data: unknown) {
        reply.status(this._status).headers(this._headers).send(data);
      },
      send(data: unknown) {
        reply.status(this._status).headers(this._headers).send(data);
      },
    };

    await handler(req, res);
  };
}

async function startDevServer() {
  let welcomeHandler, profileHandler, rankHandler, quoteHandler, outputHandler;
  try {
    welcomeHandler = (await import("../api/welcome.js")).default;
    profileHandler = (await import("../api/profile.js")).default;
    rankHandler = (await import("../api/rank.js")).default;
    quoteHandler = (await import("../api/quote.js")).default;
    outputHandler = (await import("../api/output/[id].js")).default;
  } catch (err) {
    console.error("Failed to import API handlers. Did you run 'npm run build'?");
    console.error(err);
    return;
  }

  const app = Fastify({ logger: true });

  app.get("/api/welcome", adaptHandler(welcomeHandler));
  app.get("/api/profile", adaptHandler(profileHandler));
  app.get("/api/rank", adaptHandler(rankHandler));
  app.get("/api/quote", adaptHandler(quoteHandler));
  app.get("/output/:id", adaptHandler(outputHandler));

  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server running on http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  startDevServer().catch(console.error);
} else {
  console.log("Running on Vercel - Fastify server not started.");
}
/*import Fastify from "fastify";
import welcomeHandler from "../api/welcome";
import profileHandler from "../api/profile";
import rankHandler from "../api/rank";
import quoteHandler from "../api/quote";
import outputHandler from "../api/output/[id]";

const app = Fastify({ logger: true });

function adaptHandler(
  handler: (req: any, res: any) => Promise<any>
) {
  return async (request: any, reply: any) => {
    const req: any = {
      query: request.query,
      params: request.params,
      body: request.body,
      headers: request.headers,
    };

    const res: any = {
      _status: 200,
      _headers: {} as Record<string, string>,
      status(code: number) {
        this._status = code;
        return this;
      },
      setHeader(key: string, value: string | number) {
        this._headers[key] = String(value);
        return this;
      },
      json(data: unknown) {
        reply.status(this._status).headers(this._headers).send(data);
      },
      send(data: unknown) {
        reply.status(this._status).headers(this._headers).send(data);
      },
    };

    await handler(req, res);
  };
}

app.get("/api/welcome", adaptHandler(welcomeHandler));
app.get("/api/profile", adaptHandler(profileHandler));
app.get("/api/rank", adaptHandler(rankHandler));
app.get("/api/quote", adaptHandler(quoteHandler));
app.get("/output/:id", adaptHandler(outputHandler));

const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server running on http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
*/

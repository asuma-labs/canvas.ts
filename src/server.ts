import Fastify from "fastify";
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

import { Buffer } from "buffer";
import Fastify from "fastify";

const fastify = Fastify({ logger: true });

const docs = {};

fastify.post(
  "/document/:documentId",
  {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            status: {
              type: "string",
            },
          },
        },
      },
    },
  },
  (request, reply) => {
    const { documentId } = request.params;
    console.log("body", request.body);
    docs[documentId] = request.body;
    reply.send({ status: "OK" });
  }
);

fastify.get("/document/:documentId", (request, reply) => {
  const { documentId } = request.params;
  const document = docs[documentId];
  const buffer = Buffer.from(document);
  reply.send(buffer);
});

fastify.addContentTypeParser("*", { parseAs: "buffer" }, (_, payload, done) => {
  console.log("payload", payload);
  const doc = new Uint8Array(payload);
  done(null, doc);
});

const start = async () => {
  try {
    await fastify.listen(3001);
  } catch {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url),
);
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT ?? 4173);

const currentUser = {
  id: "11111111-1111-1111-1111-111111111111",
  displayName: "Bạn",
  status: "online",
};

const friend = {
  id: "22222222-2222-2222-2222-222222222222",
  displayName: "Hồng Anh",
  status: "online",
};

const conversation = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  title: "Hồng Anh",
  lastSequence: 2,
  memberIds: [currentUser.id, friend.id],
};

const messages = [
  {
    id: crypto.randomUUID(),
    conversationId: conversation.id,
    senderId: friend.id,
    clientMessageId: "seed-1",
    sequence: 1,
    type: "text",
    content:
      "Chào mừng đến với Retro Messenger demo!",
    createdAt: new Date(
      Date.now() - 300_000,
    ).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    conversationId: conversation.id,
    senderId: currentUser.id,
    clientMessageId: "seed-2",
    sequence: 2,
    type: "text",
    content:
      "Demo này chạy bằng Node built-in, không cần npm install.",
    createdAt: new Date(
      Date.now() - 240_000,
    ).toISOString(),
  },
];

const eventClients = new Set();

function json(response, status, value) {
  response.writeHead(status, {
    "content-type":
      "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
  });
  response.end(JSON.stringify(value));
}

function emit(event, data) {
  const payload =
    `event: ${event}\n` +
    `data: ${JSON.stringify(data)}\n\n`;

  for (const client of eventClients) {
    client.write(payload);
  }
}

async function body(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  return JSON.parse(
    Buffer.concat(chunks).toString("utf8"),
  );
}

async function staticFile(
  response,
  fileName,
  contentType,
) {
  try {
    const content = await readFile(
      path.join(publicDir, fileName),
    );
    response.writeHead(200, {
      "content-type": contentType,
    });
    response.end(content);
  } catch {
    response.writeHead(404).end("Not found");
  }
}

const server = http.createServer(
  async (request, response) => {
    const url = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`,
    );

    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods":
          "GET,POST,OPTIONS",
        "access-control-allow-headers":
          "content-type",
      });
      return response.end();
    }

    if (url.pathname === "/health") {
      return json(response, 200, {
        status: "ok",
        service: "retro-demo",
        time: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/v1/session") {
      return json(response, 200, {
        user: currentUser,
        friend,
      });
    }

    if (
      url.pathname ===
      "/api/v1/conversations"
    ) {
      return json(
        response,
        200,
        [conversation],
      );
    }

    const messagesPath =
      `/api/v1/conversations/` +
      `${conversation.id}/messages`;

    if (
      url.pathname === messagesPath &&
      request.method === "GET"
    ) {
      return json(response, 200, messages);
    }

    if (
      url.pathname === messagesPath &&
      request.method === "POST"
    ) {
      try {
        const input = await body(request);

        const duplicate = messages.find(
          item =>
            item.senderId === currentUser.id &&
            item.clientMessageId ===
              input.clientMessageId,
        );

        if (duplicate) {
          return json(response, 200, {
            message: duplicate,
            isDuplicate: true,
          });
        }

        if (
          typeof input.content !== "string" ||
          !input.content.trim()
        ) {
          return json(response, 400, {
            title: "Content is required.",
          });
        }

        conversation.lastSequence++;

        const message = {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          senderId: currentUser.id,
          clientMessageId: String(
            input.clientMessageId ??
              crypto.randomUUID(),
          ),
          sequence: conversation.lastSequence,
          type: "text",
          content: input.content.trim(),
          createdAt: new Date().toISOString(),
        };

        messages.push(message);
        emit("message", message);

        return json(response, 200, {
          message,
          isDuplicate: false,
        });
      } catch (error) {
        return json(response, 400, {
          title:
            error instanceof Error
              ? error.message
              : "Invalid request",
        });
      }
    }

    if (url.pathname === "/events") {
      response.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
        "access-control-allow-origin": "*",
      });
      response.write(": connected\n\n");
      eventClients.add(response);
      request.on("close", () =>
        eventClients.delete(response),
      );
      return;
    }

    if (url.pathname === "/") {
      return staticFile(
        response,
        "index.html",
        "text/html; charset=utf-8",
      );
    }

    if (url.pathname === "/app.js") {
      return staticFile(
        response,
        "app.js",
        "text/javascript; charset=utf-8",
      );
    }

    if (url.pathname === "/style.css") {
      return staticFile(
        response,
        "style.css",
        "text/css; charset=utf-8",
      );
    }

    response.writeHead(404).end("Not found");
  },
);

server.listen(port, "0.0.0.0", () => {
  console.log(
    `Retro Messenger demo: http://localhost:${port}`,
  );
});

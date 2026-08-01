const currentUserId =
  "11111111-1111-1111-1111-111111111111";

const conversationId =
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const messageList =
  document.querySelector("#messages");

const form =
  document.querySelector("#composer");

const input =
  document.querySelector("#input");

function render(message) {
  if (
    document.querySelector(
      `[data-id="${message.id}"]`,
    )
  ) {
    return;
  }

  const row = document.createElement("div");

  row.dataset.id = message.id;
  row.className =
    `row ${
      message.senderId === currentUserId
        ? "mine"
        : ""
    }`;

  row.innerHTML =
    `<div class="bubble">` +
    `<p></p>` +
    `<small>#${message.sequence}</small>` +
    `</div>`;

  row.querySelector("p").textContent =
    message.content;

  messageList.append(row);
  messageList.scrollTop =
    messageList.scrollHeight;
}

const initial = await fetch(
  `/api/v1/conversations/` +
    `${conversationId}/messages`,
).then(response => response.json());

initial.forEach(render);

const events = new EventSource("/events");

events.addEventListener(
  "message",
  event => render(JSON.parse(event.data)),
);

form.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    const content = input.value.trim();

    if (!content) return;

    input.value = "";

    const result = await fetch(
      `/api/v1/conversations/` +
        `${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          clientMessageId:
            crypto.randomUUID(),
          content,
        }),
      },
    ).then(response => response.json());

    render(result.message);
  },
);

document
  .querySelector("#buzz")
  .addEventListener("click", () => {
    document
      .querySelector(".app")
      .animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(9px)" },
          { transform: "translateX(-9px)" },
          { transform: "translateX(0)" },
        ],
        {
          duration: 260,
          iterations: 2,
        },
      );
  });

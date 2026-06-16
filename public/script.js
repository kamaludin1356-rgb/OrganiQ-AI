async function askAI() {

  const input = document.getElementById("question");
  const question = input.value.trim();

  if (!question) return;

  const chat = document.getElementById("chat-box");

  const welcomeCard = document.querySelector(".welcome-card");

  if (welcomeCard) {
    welcomeCard.remove();
  }

  // User Message
  chat.innerHTML += `
    <div class="message user">
      ${question}
    </div>
  `;

  // Loading Message
  const loadingId = "loading-" + Date.now();

  chat.innerHTML += `
    <div class="message ai" id="${loadingId}">
      🤖 Menganalisis data...
    </div>
  `;

  chat.scrollTop = chat.scrollHeight;

  input.value = "";

  try {

    const response = await fetch(
      `/ask?q=${encodeURIComponent(question)}`
    );

    const data = await response.json();

    const loading =
      document.getElementById(loadingId);

    if (loading) {
      loading.remove();
    }

    const cleanAnswer = data.answer
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    chat.innerHTML += `
      <div class="message ai">
        ${marked.parse(cleanAnswer)}
      </div>
    `;

  } catch (error) {

    const loading =
      document.getElementById(loadingId);

    if (loading) {
      loading.remove();
    }

    chat.innerHTML += `
      <div class="message ai">
        ❌ Gagal menghubungi AI.
      </div>
    `;

    console.error(error);
  }

  chat.scrollTop = chat.scrollHeight;
}

function quickAsk(question) {

  document.getElementById("question").value =
    question;

  askAI();
}

function sidebarAsk(question, button) {

  document
    .querySelectorAll(".menu-item")
    .forEach(item =>
      item.classList.remove("active")
    );

  button.classList.add("active");

  const title =
    document.getElementById("page-title");

  if (!title) {
    quickAsk(question);
    return;
  }

  const menuText =
    button.textContent;

  if (menuText.includes("Executive")) {

    title.innerText =
      "EXECUTIVE INSIGHT";

  } else if (
    menuText.includes("AI Assistant")
  ) {

    title.innerText =
      "ORGANIQ AI ASSISTANT";

  } else if (
    menuText.includes("Country")
  ) {

    title.innerText =
      "COUNTRY ANALYSIS";

  } else if (
    menuText.includes("Industry")
  ) {

    title.innerText =
      "INDUSTRY ANALYSIS";

  } else if (
    menuText.includes("Trend")
  ) {

    title.innerText =
      "TREND ANALYSIS";
  }

  quickAsk(question);
}

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const input =
      document.getElementById("question");

    if (!input) return;

    input.addEventListener(
      "keydown",
      (e) => {

        if (e.key === "Enter") {

          e.preventDefault();

          askAI();
        }

      }
    );

  }
);
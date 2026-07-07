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
    🤖 OrganiQ AI sedang berpikir...
  </div>
`;

const loadingElement = document.getElementById(loadingId);

const dotsAnimation = setInterval(() => {
  const dots =
    ".".repeat((Date.now() / 500) % 4);

  loadingElement.innerHTML =
    `🤖 OrganiQ AI sedang berpikir${dots}`;
}, 500);

  chat.scrollTop = chat.scrollHeight;

  input.value = "";

  try {

const response = await fetch(
  `/ask?q=${encodeURIComponent(question)}`
);

const loading =
  document.getElementById(loadingId);

if (loading) loading.remove();

const aiId = "ai-" + Date.now();

chat.innerHTML += `
<div class="message ai">
  <div id="${aiId}"></div>
</div>
`;

const aiBox = document.getElementById(aiId);

const reader = response.body.getReader();
const decoder = new TextDecoder();

let fullText = "";

let buffer = "";

while (true) {

  const { done, value } = await reader.read();

  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  const lines = buffer.split("\n");

  buffer = lines.pop();

  for (const line of lines) {

    if (!line.startsWith("data:")) continue;

    const data = line.replace("data:", "").trim();

    if (data === "[DONE]") continue;

    try {

      const json = JSON.parse(data);

      const token =
  json.token || "";

      fullText += token;

let html = marked.parse(fullText);

// Bungkus semua tabel dengan div.table-wrapper
html = html.replace(
  /<table>/g,
  '<div class="table-wrapper"><table>'
);

html = html.replace(
  /<\/table>/g,
  '</table></div>'
);

aiBox.innerHTML = html;

      chat.scrollTop =
        chat.scrollHeight;

    } catch (err) {
      // Abaikan jika belum JSON lengkap
    }

  }

}

  } catch (error) {

    const loading =
      document.getElementById(loadingId);

    if (loading) {
      clearInterval(dotsAnimation);
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

  const sidebar =
  document.getElementById("sidebar");

if(window.innerWidth < 900){
  sidebar.classList.remove("open");
}

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

function toggleSidebar(){

  const sidebar =
    document.getElementById("sidebar");

  sidebar.classList.toggle("open");

}

document.addEventListener("click", function(e){

  const sidebar =
    document.getElementById("sidebar");

  const toggle =
    document.querySelector(".menu-toggle");

  if(
    window.innerWidth < 900 &&
    sidebar.classList.contains("open") &&
    !sidebar.contains(e.target) &&
    !toggle.contains(e.target)
  ){
    sidebar.classList.remove("open");
  }

});
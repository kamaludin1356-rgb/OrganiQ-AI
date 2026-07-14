// ==========================
// CONVERSATION
// ==========================

let conversations = [];

let currentConversationId = null;

// ==========================
// SAVE TO LOCAL STORAGE
// ==========================

function saveConversations(){

  localStorage.setItem(
    "organiq-history",
    JSON.stringify(conversations)
  );

}

// ==========================
// LOAD FROM LOCAL STORAGE
// ==========================

function loadConversations(){

  const saved =
    localStorage.getItem("organiq-history");

  if(!saved) return;

  conversations =
    JSON.parse(saved);

currentConversationId = null;

}

// ==========================
// CREATE CONVERSATION
// ==========================

function removeStopWords(title){

  SmartTitle.removeWords.forEach(word => {

    const regex = new RegExp("\\b" + word + "\\b", "gi");

    title = title.replace(regex, "");

  });

  title = title.replace(/\s+/g, " ").trim();

  return title;

}

function replacePhrases(title){

  Object.entries(SmartTitle.phrases).forEach(([key, value]) => {

    const regex = new RegExp(key, "gi");

    title = title.replace(
      regex,
      value.replace(/ /g, "_")
    );

  });

  return title;

}

function formatWord(word){

  const lower = word.toLowerCase();

  if (SmartTitle.specialWords[lower]) {
    return SmartTitle.specialWords[lower];
  }

  return word
    .split("_")
    .map(part =>
      part.charAt(0).toUpperCase() +
      part.slice(1).toLowerCase()
    )
    .join("_");

}

function canAddWord(word, totalLength, totalWords){

  return !(
    totalLength + word.length > SmartTitle.maxLength ||
    totalWords >= SmartTitle.maxWords
  );

}

function generateTitle(question){

  let title = question.trim();

  title = removeStopWords(title);

  title = replacePhrases(title);

const words = title.split(/\s+/);

const maxLength = SmartTitle.maxLength;

const result = [];

let totalLength = 0;

let totalWords = 0;

for (let word of words) {

  if (word.length === 0) continue;

word = formatWord(word);

if (!canAddWord(word, totalLength, totalWords)) {
    break;
}

result.push(word);

totalLength += word.length + 1;

totalWords++;

}

title = result.join(" ");

title = title.replace(/_/g, " ");

if (title.length > maxLength) {

  const shortTitle = title.substring(0, maxLength);

  const lastSpace = shortTitle.lastIndexOf(" ");

  if (lastSpace > 0) {

    title = shortTitle.substring(0, lastSpace) + "...";

  } else {

    title = shortTitle + "...";

  }

}

if (SmartTitle.titleAliases[title]) {

  title = SmartTitle.titleAliases[title];

}

return title;

}

function createConversation(firstQuestion){

const conversation = {

    id: Date.now(),

    title: generateTitle(firstQuestion),

    pinned: false,

    messages: []

};

  conversations.push(conversation);

  saveConversations();

  currentConversationId = conversation.id;

  return conversation;

}

// ==========================
// RENDER HISTORY
// ==========================

function renderHistory(){

const history =
  document.getElementById("history-items");

  const clearHistoryBtn =
    document.getElementById("clear-history-btn");

  const searchKeyword = document
  .getElementById("history-search")
  .value
  .trim()
  .toLowerCase();

  const emptySearch = document.getElementById(
  "empty-search"
);

  const empty =
    document.getElementById("empty-history");

  history.innerHTML = "";

if(conversations.length === 0){

    empty.style.display = "block";
    emptySearch.style.display = "none";

    clearHistoryBtn.style.display = "none";

    return;

}

  empty.style.display = "none";

  clearHistoryBtn.style.display = "block";

let visibleConversationCount = 0;

  [...conversations]
.sort((a, b) => {

  if(a.pinned && !b.pinned) return -1;

  if(!a.pinned && b.pinned) return 1;

  return b.id - a.id;

})

  .filter(conversation => {

    if(searchKeyword === "") return true;

    return conversation.title
      .toLowerCase()
      .includes(searchKeyword);

  })

  .forEach(conversation=>{

  visibleConversationCount++;

history.innerHTML += `
  <div
    class="history-item ${conversation.id===currentConversationId ? "active" : ""}"
    onclick="loadConversation(${conversation.id})">

<span class="history-text">

    ${
        conversation.pinned
        ? `<i class="history-pin" data-lucide="pin"></i>`
        : ""
    }

    <span>${conversation.title}</span>

</span>

<button
  class="history-menu-btn"
  onclick="openHistoryMenu(event, ${conversation.id})">

    <i data-lucide="ellipsis"></i>

</button>

<div
  id="menu-${conversation.id}"
  class="history-popup">

</div>

  </div>
`;

lucide.createIcons();

  });

if(visibleConversationCount === 0){

    empty.style.display = "none";
    emptySearch.style.display = "block";

}else{

    empty.style.display = "none";
    emptySearch.style.display = "none";

}

}

function loadConversation(id){

  currentConversationId = id;

  const sidebar = document.getElementById("sidebar");

if(window.innerWidth <= 768){
    sidebar.classList.remove("open");
}

  const conversation =
    conversations.find(c=>c.id===id);

  if(!conversation) return;

const chat = document.getElementById("chat-box");

const landingContainer = document.getElementById("landing-container");

const header = document.querySelector(".header");

landingContainer.style.display = "none";

chat.style.display = "flex";

header.classList.remove("hidden");

if(window.innerWidth <= 768){

    document
        .getElementById("floating-menu-toggle")
        .style.display = "none";

        document.getElementById("floating-menu-toggle").style.opacity = "0";
document.getElementById("floating-menu-toggle").style.pointerEvents = "none";

    document
        .querySelector(".menu-toggle")
        .style.display = "flex";

}

movePromptToChat();

  chat.classList.add("fade-out");

  setTimeout(() => {

  chat.innerHTML = "";

  conversation.messages.forEach(msg=>{

    if(msg.role==="user"){

      chat.innerHTML += `
        <div class="message user">
          ${msg.content}
        </div>
      `;

    }else{

      let html =
        marked.parse(msg.content);

      html = html.replace(
        /<table>/g,
        '<div class="table-wrapper"><table>'
      );

      html = html.replace(
        /<\/table>/g,
        '</table></div>'
      );

chat.innerHTML += `
<div class="message ai">

    <button class="copy-ai-btn">
        <i data-lucide="copy"></i>
    </button>

    ${html}

</div>
`;

    }

  });

addCopyButtons();

document.querySelectorAll(".message.ai pre code").forEach((block) => {
    if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
    }
});

lucide.createIcons();

renderHistory();

chat.classList.remove("fade-out");

const input = document.getElementById("question");

input.value = "";
input.style.height = "auto";
input.scrollTop = 0;

requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
});

}, 180);

}

async function askAI() {

  const input = document.getElementById("question");
  const question = input.value.trim();

  if (!question) return;

  // ==========================
// CREATE CONVERSATION
// ==========================

if(currentConversationId === null){

  createConversation(question);

}

console.log("Current Conversation:", currentConversationId);

renderHistory();

const chat = document.getElementById("chat-box");
const landingContainer = document.getElementById("landing-container");
const header = document.querySelector(".header");

landingContainer.style.display = "none";
chat.style.display = "flex";
header.classList.remove("hidden");

// pindahkan prompt ke bawah chat
movePromptToChat();

// MOBILE
if (window.innerWidth <= 768) {

    const floating = document.getElementById("floating-menu-toggle");
    const menu = document.querySelector(".menu-toggle");

    floating.style.display = "none";
    floating.style.opacity = "0";
    floating.style.pointerEvents = "none";
    floating.style.transform = "translateY(0)";

    menu.style.display = "flex";

}

  // User Message
  chat.innerHTML += `
    <div class="message user">
      ${question}
    </div>
  `;

  // ==========================
// SAVE USER MESSAGE
// ==========================

const conversation = conversations.find(
  c => c.id === currentConversationId
);

if(conversation){

  conversation.messages.push({

    role: "user",

    content: question

  });

  saveConversations();

}

// Loading Message
const loadingId = "loading-" + Date.now();

chat.innerHTML += `
<div class="thinking" id="${loadingId}">

    <i data-lucide="bot"></i>

    <span id="thinking-text">OrganiQ AI sedang berpikir</span>

</div>
`;

lucide.createIcons();

const thinkingText =
document.getElementById("thinking-text");

let dot = 0;

const dotsAnimation = setInterval(() => {

    dot = (dot + 1) % 4;

    thinkingText.textContent =
        "OrganiQ AI sedang berpikir" + ".".repeat(dot);

},500);

  chat.scrollTop = chat.scrollHeight;

input.value = "";
input.style.height = "auto";
input.scrollTop = 0;

  try {

const response = await fetch(
  `/ask?q=${encodeURIComponent(question)}&conversationId=${currentConversationId}`
);

const loading =
  document.getElementById(loadingId);

clearInterval(dotsAnimation);

if (loading) loading.remove();

const aiId = "ai-" + Date.now();

chat.innerHTML += `
<div class="message ai">

    <button class="copy-ai-btn">

        <i data-lucide="copy"></i>

    </button>

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

aiBox.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
});

addCopyButtons();

lucide.createIcons();

chat.scrollTop =
    chat.scrollHeight;

    } catch (err) {
      // Abaikan jika belum JSON lengkap
    }

  }

}

// ==========================
// SAVE AI MESSAGE
// ==========================

if(conversation){

    conversation.messages.push({

        role: "assistant",

        content: fullText

    });

    saveConversations();

    renderHistory();

    addCopyButtons();

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

input.addEventListener("input", function () {

    this.style.height = "auto";

    this.style.height = Math.min(this.scrollHeight, 180) + "px";

});

if (localStorage.getItem("theme") === "dark") {

    document.body.classList.add("dark");

    const settingsToggle = document.getElementById("settings-dark-toggle");

    if (settingsToggle) {
        settingsToggle.checked = true;
    }

}

loadConversations();
renderHistory();

updateThemeLogo();

newChat();

    const header = document.querySelector(".header");

header.classList.add("hidden");

//     if(currentConversationId === null){
//     showLandingMode();
// }

input.addEventListener("keydown", function (e) {

    if (e.key !== "Enter") return;

    // Shift + Enter = baris baru
    if (e.shiftKey) return;

    e.preventDefault();
    e.stopPropagation();

    if (this.value.trim() === "") return;

    askAI();

});

  }
);

function toggleSidebar(){

    const sidebar = document.getElementById("sidebar");
    const floating = document.getElementById("floating-menu-toggle");

    sidebar.classList.toggle("open");

    if(sidebar.classList.contains("open")){
        floating.style.opacity = "0";
        floating.style.pointerEvents = "none";
    }else{
        floating.style.opacity = "1";
        floating.style.pointerEvents = "auto";
    }

}

document.addEventListener("click", function(e){

    const sidebar = document.getElementById("sidebar");

    const headerToggle = document.querySelector(".menu-toggle");

    const floatingToggle = document.getElementById("floating-menu-toggle");

    const clickOnToggle =
        (headerToggle && headerToggle.contains(e.target)) ||
        (floatingToggle && floatingToggle.contains(e.target));

    if(
        window.innerWidth < 900 &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        !clickOnToggle
    ){

        sidebar.classList.remove("open");

        const landing = document.getElementById("landing-container");

        if(landing.style.display !== "none"){

            floatingToggle.style.display = "flex";
            floatingToggle.style.opacity = "1";
            floatingToggle.style.pointerEvents = "auto";

        }

    }

});

// ==========================
// HISTORY MENU
// ==========================

function toggleHistoryMenu(event, id){

  event.stopPropagation();

  const menu =
    document.getElementById(`menu-${id}`);

  if(menu.innerHTML !== ""){

    menu.innerHTML = "";

    return;

  }

  menu.innerHTML = `
    <div class="history-menu">

      Rename

      <br>

      Delete

    </div>
  `;

}

// ==========================
// HISTORY CONTEXT MENU
// ==========================

let selectedConversationId = null;

function openHistoryMenu(event, id){

  event.stopPropagation();

  document.getElementById("settings-context-menu").style.display = "none";

  selectedConversationId = id;

  const menu =
    document.getElementById("history-context-menu");

  menu.onclick = (e)=>e.stopPropagation();

  const conversation = conversations.find(
    c => c.id === id
  );

  if(!conversation) return;

menu.innerHTML = `
    <button onclick="togglePin(${id})">
        <i data-lucide="${conversation.pinned ? "pin-off" : "pin"}"></i>
        <span>${conversation.pinned ? "Unpin" : "Pin"}</span>
    </button>

    <button onclick="openRenameModal()">
        <i data-lucide="pencil"></i>
        <span>Rename</span>
    </button>

    <button onclick="deleteConversation()">
        <i data-lucide="trash-2"></i>
        <span>Delete</span>
    </button>
`;

lucide.createIcons();

  // Tampilkan dulu supaya offsetWidth bisa dibaca
  menu.style.display = "block";

  const rect = event.currentTarget.getBoundingClientRect();

  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;

  let left = rect.right + 8;
  let top = rect.bottom + 6;

  // kalau mepet kanan layar
  if(left + menuWidth > window.innerWidth){
      left = rect.left - menuWidth - 8;
  }

  // kalau mepet bawah layar
  if(top + menuHeight > window.innerHeight){
      top = rect.top - menuHeight - 8;
  }

  menu.style.left = left + "px";
  menu.style.top = top + "px";
}

function openRenameModal(){

  if(selectedConversationId === null) return;

  const conversation = conversations.find(
    conversation =>
      conversation.id === selectedConversationId
  );

  if(!conversation) return;

  document.getElementById(
    "rename-input"
  ).value = conversation.title;

  document.getElementById(
    "rename-modal"
  ).style.display = "flex";

  document.getElementById(
    "history-context-menu"
  ).style.display = "none";

  document.getElementById(
    "rename-input"
  ).focus();

  document.getElementById(
    "rename-input"
  ).select();

}

function deleteConversation(){

  if(selectedConversationId === null) return;

  document.getElementById(
  "delete-modal"
).style.display = "flex";

return;

}

function togglePin(id){

  const conversation = conversations.find(
    c => c.id === id
  );

  if(!conversation) return;


  conversation.pinned =
    !conversation.pinned;


  saveConversations();

renderHistory();

document.getElementById(
  "history-context-menu"
).style.display = "none";

}

function clearAllHistory(){

    conversations = [];

    currentConversationId = null;

    saveConversations();

    document.getElementById(
        "clear-history-modal"
    ).style.display = "none";

    renderHistory();

    newChat();

}

// ==========================
// NEW CHAT
// ==========================

function newChat() {

  const sidebar = document.getElementById("sidebar");

if(window.innerWidth <= 768){
    sidebar.classList.remove("open");
}

    currentConversationId = null;

    const chat = document.getElementById("chat-box");
    const landingContainer = document.getElementById("landing-container");
    const input = document.getElementById("question");

    const header = document.querySelector(".header");

    // Bersihkan chat
    chat.innerHTML = "";

    // Tampilkan landing
    landingContainer.style.display = "flex";

    // Sembunyikan chat
    chat.style.display = "none";

    header.classList.add("hidden");

if(window.innerWidth <= 768){

    document
        .getElementById("floating-menu-toggle")
        .style.display = "flex";

const floating = document.getElementById("floating-menu-toggle");

floating.style.display = "flex";
floating.style.opacity = "1";
floating.style.pointerEvents = "auto";

    document
        .querySelector(".menu-toggle")
        .style.display = "none";

}

    movePromptToLanding();

    // Reset input
    input.value = "";
    input.style.height = "auto";
    input.scrollTop = 0;
    input.focus();

    renderHistory();

}

document
  .getElementById("delete-chat-btn")
  .addEventListener(
    "click",
    deleteConversation
  );

  document
  .getElementById("rename-chat-btn")
  .addEventListener(
    "click",
    openRenameModal
  );

  document
  .getElementById("clear-history-btn")
  .addEventListener(
    "click",
    () => {

      document.getElementById(
        "clear-history-modal"
      ).style.display = "flex";

    }
  );

// ==========================
// DARK MODE
// ==========================

const darkToggle =
  document.getElementById("settings-dark-toggle");


if(darkToggle){

  darkToggle.addEventListener(
    "change",
    () => {

if(darkToggle.checked){

    document.body.classList.add("dark");

    updateThemeLogo();

    localStorage.setItem(
        "theme",
        "dark"
    );

}else{

    document.body.classList.remove("dark");

    updateThemeLogo();

    localStorage.setItem(
        "theme",
        "light"
    );

}

    }
  );

}

document.addEventListener("click", () => {

  document.getElementById(
    "history-context-menu"
  ).style.display = "none";

});

document
  .getElementById("cancel-delete-btn")
  .addEventListener("click", () => {

    document.getElementById(
      "delete-modal"
    ).style.display = "none";

});

document
  .getElementById("delete-modal")
  .addEventListener("click", function(e){

    if(e.target === this){

        this.style.display = "none";

    }

});

document
  .getElementById("confirm-delete-btn")
  .addEventListener("click", () => {

    conversations = conversations.filter(
      conversation =>
        conversation.id !== selectedConversationId
    );

    if(currentConversationId === selectedConversationId){

  currentConversationId = null;

  newChat();

}

    saveConversations();

    renderHistory();

    document.getElementById(
      "delete-modal"
    ).style.display = "none";

    document.getElementById(
      "history-context-menu"
    ).style.display = "none";

});

document
  .getElementById("cancel-rename-btn")
  .addEventListener("click", () => {

    document.getElementById(
      "rename-modal"
    ).style.display = "none";

});

document
  .getElementById("rename-modal")
  .addEventListener("click", function(e){

    if(e.target === this){

        this.style.display = "none";

    }

});

document
  .getElementById("save-rename-btn")
  .addEventListener("click", () => {

    const newTitle = document
      .getElementById("rename-input")
      .value
      .trim();

    if(!newTitle) return;

    const conversation = conversations.find(
      conversation =>
        conversation.id === selectedConversationId
    );

    if(!conversation) return;

    conversation.title = newTitle;

    saveConversations();

    renderHistory();

    document.getElementById(
      "rename-modal"
    ).style.display = "none";

});

const historySearch =
  document.getElementById("history-search");

const clearHistorySearch =
  document.getElementById("clear-history-search");

historySearch.addEventListener(
  "input",
  () => {

    clearHistorySearch.style.display =
      historySearch.value.trim() === ""
        ? "none"
        : "flex";

    renderHistory();

  }
);

clearHistorySearch.addEventListener(
  "click",
  () => {

    historySearch.value = "";

    clearHistorySearch.style.display = "none";

    renderHistory();

    historySearch.focus();

  }
);

document
  .getElementById("cancel-clear-history-btn")
  .addEventListener(
    "click",
    () => {

      document.getElementById(
        "clear-history-modal"
      ).style.display = "none";

    }
  );

  document
  .getElementById("clear-history-modal")
  .addEventListener("click", function(e){

    if(e.target === this){

        this.style.display = "none";

    }

});

  document
  .getElementById("confirm-clear-history-btn")
  .addEventListener(
    "click",
    clearAllHistory
  );

// ==========================
// SETTINGS CONTEXT MENU
// ==========================

const settingsBtn =
    document.getElementById("settings-btn");

const settingsMenu =
    document.getElementById("settings-context-menu");

settingsBtn.addEventListener("click", function(e){

    e.stopPropagation();

    document.getElementById("history-context-menu").style.display = "none";

    const rect = settingsBtn.getBoundingClientRect();

    if(settingsMenu.style.display === "block"){

    settingsMenu.style.display = "none";
    return;

}

settingsMenu.style.display = "block";

    const menuHeight = settingsMenu.offsetHeight;

    settingsMenu.style.left = rect.left + "px";
    settingsMenu.style.top = (rect.top - menuHeight - 10) + "px";

});

settingsMenu.addEventListener("click", function(e){

    e.stopPropagation();

});

document.addEventListener("click", function(){

    settingsMenu.style.display = "none";

});

document
    .getElementById("settings-dataset-btn")
    .addEventListener("click", () => {

        document.getElementById("settings-context-menu").style.display = "none";

        document.getElementById("dataset-modal").style.display = "flex";

});

document
    .getElementById("close-dataset-btn")
    .addEventListener("click", () => {

        document.getElementById("dataset-modal").style.display = "none";

        // MOBILE ONLY
        if(window.innerWidth <= 768){

            const landing = document.getElementById("landing-container");

            if(landing.style.display !== "none"){

                const floating = document.getElementById("floating-menu-toggle");

                floating.style.display = "flex";
                floating.style.opacity = "1";
                floating.style.pointerEvents = "auto";

            }

        }

});

document
    .getElementById("dataset-modal")
    .addEventListener("click", function(e){

        if(e.target === this){

            this.style.display = "none";

            // MOBILE ONLY
            if(window.innerWidth <= 768){

                const landing = document.getElementById("landing-container");

                if(landing.style.display !== "none"){

                    const floating = document.getElementById("floating-menu-toggle");

                    floating.style.display = "flex";
                    floating.style.opacity = "1";
                    floating.style.pointerEvents = "auto";

                }

            }

        }

});

document
    .getElementById("settings-about-btn")
    .addEventListener("click", () => {

        document.getElementById("settings-context-menu").style.display = "none";

        document.getElementById("about-modal").style.display = "flex";

});

document
    .getElementById("close-about-btn")
    .addEventListener("click", () => {

        document.getElementById("about-modal").style.display = "none";

        // MOBILE ONLY
        if(window.innerWidth <= 768){

            const landing = document.getElementById("landing-container");

            if(landing.style.display !== "none"){

                const floating = document.getElementById("floating-menu-toggle");

                floating.style.display = "flex";
                floating.style.opacity = "1";
                floating.style.pointerEvents = "auto";

            }

        }

});

document
    .getElementById("about-modal")
    .addEventListener("click", function(e){

        if(e.target === this){

            this.style.display = "none";

            // MOBILE ONLY
            if(window.innerWidth <= 768){

                const landing = document.getElementById("landing-container");

                if(landing.style.display !== "none"){

                    const floating = document.getElementById("floating-menu-toggle");

                    floating.style.display = "flex";
                    floating.style.opacity = "1";
                    floating.style.pointerEvents = "auto";

                }

            }

        }

});

function addCopyButtons() {

    document.querySelectorAll(".message.ai pre").forEach(pre => {

        if (pre.querySelector(".code-copy-btn")) return;

const button = document.createElement("button");

button.className = "code-copy-btn";

button.innerHTML = `
    <i data-lucide="copy"></i>
    <span>Copy</span>
`;

pre.appendChild(button);

lucide.createIcons();

        button.onclick = async () => {

            const code = pre.querySelector("code").innerText;

            await navigator.clipboard.writeText(code);

            button.innerHTML = `
    <i data-lucide="check"></i>
    <span>Copied!</span>
`;

button.classList.add("copied");

lucide.createIcons();

            setTimeout(() => {

button.innerHTML = `
    <i data-lucide="copy"></i>
    <span>Copy</span>
`;

button.classList.remove("copied");

lucide.createIcons();

            },2000);

        };

    });

    document.querySelectorAll(".copy-ai-btn").forEach(button => {

    if(button.dataset.ready) return;

    button.dataset.ready = "true";

    button.onclick = async () => {

const message = button.parentElement;

const clone = message.cloneNode(true);

clone.querySelectorAll(".copy-ai-btn,.code-copy-btn").forEach(e => e.remove());

const text = clone.innerText.trim();

        await navigator.clipboard.writeText(text);

        button.innerHTML = `
            <i data-lucide="check"></i>
        `;

        lucide.createIcons();

        setTimeout(() => {

            button.innerHTML = `
                <i data-lucide="copy"></i>
            `;

            lucide.createIcons();

        },1500);

    };

});

}

// ==========================
// MOVE PROMPT
// ==========================

function movePromptToChat(){

    const promptSection = document.querySelector(".prompt-section");
    const anchor = document.getElementById("chat-input-anchor");

    if(promptSection && anchor){

        anchor.appendChild(promptSection);

    }

}

function movePromptToLanding(){

    const promptSection = document.querySelector(".prompt-section");
    const landingContainer = document.getElementById("landing-container");

    if(promptSection && landingContainer){

        const quickActions = landingContainer.querySelector(".quick-actions");

        if(quickActions){

            landingContainer.insertBefore(promptSection, quickActions);

        }

    }

}


function updateThemeLogo(){

    const landingLogo =
        document.getElementById("landing-logo");

    const sidebarLogo =
        document.getElementById("sidebar-logo");

    if(document.body.classList.contains("dark")){

        if(landingLogo)
            landingLogo.src =
                "organiq-landing-logo.png";

        if(sidebarLogo)
            sidebarLogo.src =
                "organiq-logo.png";

    }else{

        if(landingLogo)
            landingLogo.src =
                "organiq-landing-logo-light.png";

        if(sidebarLogo)
            sidebarLogo.src =
                "organiq-logo.png";

    }

}

// ==========================
// FLOATING BUTTON FOLLOW SCROLL
// ==========================

const mainContent = document.querySelector(".main-content");
const floating = document.getElementById("floating-menu-toggle");

if(mainContent && floating){

mainContent.addEventListener("scroll", function(){

    if(window.innerWidth > 768) return;

    const landing = document.getElementById("landing-container");

    if(landing.style.display === "none") return;

    floating.style.transform =
        `translateY(${-mainContent.scrollTop}px)`;

});

}
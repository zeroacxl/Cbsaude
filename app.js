import { getData, setData } from "./firebase-init.js";

let usuarioLogado = null;
let deps = [];
let associados = [];

// ---------- ELEMENTOS ----------
const loginScreen = document.getElementById("loginScreen");
const mainApp = document.getElementById("mainApp");
const userInput = document.getElementById("userInput");
const passInput = document.getElementById("passInput");
const btnEntrar = document.getElementById("btnEntrar");
const formAssociado = document.getElementById("formAssociado");
const editIndex = document.getElementById("editIndex");
const depsList = document.getElementById("depsList");
const resumoContent = document.getElementById("resumoContent");
const modalPesquisa = document.getElementById("modalPesquisa");
const searchModalInput = document.getElementById("searchModalInput");
const modalResults = document.getElementById("modalResults");

// ---------- LOGIN ----------
btnEntrar.addEventListener("click", async () => {
  const u = userInput.value.trim();
  const p = passInput.value.trim();
  if (!u || !p) return alert("Preencha usuário e senha");

  const funcs = await getData("funcionarios");
  const user = funcs.find(f => f.user === u && f.pass === p);

  if (user) {
    usuarioLogado = user;
    loginScreen.classList.add("hidden");
    mainApp.classList.remove("hidden");
    carregaAssociados();
  } else {
    alert("Usuário ou senha inválidos");
    passInput.value = "";
    passInput.focus();
  }
});

// ---------- SALVAR ----------
formAssociado.addEventListener("submit", async (e) => {
  e.preventDefault();
  const idx = editIndex.value;
  const associado = {
    nome: document.getElementById("nome").value.trim(),
    cpf: document.getElementById("cpf").value.trim(),
    pasta: document.getElementById("pasta").value.trim(),
    matricula: document.getElementById("matricula").value.trim(),
    nasc: document.getElementById("nasc").value,
    dataAssociacao: document.getElementById("dataAssociacao").value,
    sexo: document.getElementById("sexo").value,
    civil: document.getElementById("civil").value,
    endereco: document.getElementById("endereco").value.trim(),
    numero: document.getElementById("numero").value.trim(),
    bairro: document.getElementById("bairro").value.trim(),
    municipio: document.getElementById("municipio").value.trim(),
    estado: document.getElementById("estado").value.trim(),
    cep: document.getElementById("cep").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    email: document.getElementById("email").value.trim(),
    plano: document.getElementById("plano").value,
    obs: document.getElementById("obs").value.trim(),
    dependentes: deps,
    conjuge: {
      nome: document.getElementById("conjNome").value.trim(),
      cpf: document.getElementById("conjCpf").value.trim(),
      nasc: document.getElementById("conjNasc").value,
      plano: document.getElementById("conjPlano").value
    }
  };

  if (!associado.nome || !associado.cpf) return alert("Nome e CPF obrigatórios");

  associados[idx ? parseInt(idx) : associados.length] = associado;
  await setData("associados", associados);
  alert("Salvo com sucesso!");
  formAssociado.reset();
  editIndex.value = "";
  deps = [];
  renderDeps();
});

// ---------- DEPENDENTES ----------
document.getElementById("btnAddDep").addEventListener("click", () => {
  deps.push({ nome: "", parent: "", nasc: "", cpf: "", plano: "" });
  renderDeps();
});

function renderDeps() {
  depsList.innerHTML = "";
  deps.forEach((d, i) => {
    depsList.insertAdjacentHTML("beforeend", `
      <div class="row">
        <div class="col"><label>Nome</label><input value="${d.nome}" oninput="deps[${i}].nome=this.value"></div>
        <div class="col"><label>Parentesco</label><input value="${d.parent}" oninput="deps[${i}].parent=this.value"></div>
        <div class="col"><label>Nasc.</label><input type="date" value="${d.nasc}" oninput="deps[${i}].nasc=this.value"></div>
        <div class="col"><label>CPF</label><input value="${d.cpf}" oninput="deps[${i}].cpf=this.value"></div>
        <div class="col"><label>Plano</label>
          <select onchange="deps[${i}].plano=this.value">
            <option value="">Nenhum</option>
            <option value="224" ${d.plano === '224' ? 'selected' : ''}>Alfa (224)</option>
            <option value="226" ${d.plano === '226' ? 'selected' : ''}>Bravo (226)</option>
            <option value="228" ${d.plano === '228' ? 'selected' : ''}>Delta (228)</option>
          </select>
        </div>
        <div class="col"><button type="button" class="btn-danger" onclick="deps.splice(${i},1); renderDeps()">Remover</button></div>
      </div>
    `);
  });
}

// ---------- ABAS ----------
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tabContent").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
    if (tab.dataset.tab === "resumo") buildResumo();
  });
});

// ---------- RESUMO + PDF ----------
function buildResumo() {
  const idx = editIndex.value;
  if (!idx) return resumoContent.innerHTML = "<p>Selecione ou crie um cooperado.</p>";

  const a = associados[parseInt(idx)];
  if (!a) return;

  let total = 0;
  const valorTit = a.plano === '224' ? 20 : a.plano === '226' ? 115 : a.plano === '228' ? 155 : 0;
  total += valorTit;

  let html = `
    <div class="resumo-block">
      <h3>Titular</h3>
      <div class="resumo-line"><span>Nome:</span><span>${a.nome}</span></div>
      <div class="resumo-line"><span>CPF:</span><span>${a.cpf}</span></div>
      <div class="resumo-line"><span>Plano:</span><span>${a.plano} - R$ ${valorTit.toFixed(2)}</span></div>
    </div>
  `;

  if (a.dependentes?.length) {
    html += '<h3>Dependentes</h3>';
    a.dependentes.forEach(d => {
      const v = d.plano === '224' ? 20 : d.plano === '226' ? 115 : d.plano === '228' ? 155 : 0;
      total += v;
      html += `<div class="resumo-line"><span>${d.nome} (${d.parent})</span><span>R$ ${v.toFixed(2)}</span></div>`;
    });
  }

  if (a.conjuge?.nome) {
    const v = a.conjuge.plano === '224' ? 20 : a.conjuge.plano === '226' ? 115 : a.conjuge.plano === '228' ? 155 : 0;
    total += v;
    html += `<div class="resumo-line"><span>Cônjuge: ${a.conjuge.nome}</span><span>R$ ${v.toFixed(2)}</span></div>`;
  }

  html += `<div class="total">Total Mensal: R$ ${total.toFixed(2)}</div>`;
  resumoContent.innerHTML = html;
}

document.getElementById("btnPDF").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("CBSaúde Cooperados - Resumo", 14, 22);
  doc.text(resumoContent.innerText, 14, 40);
  doc.save("resumo-cbsaude.pdf");
});

// ---------- PESQUISA ----------
document.getElementById("btnPesquisar").addEventListener("click", async () => {
  modalPesquisa.classList.add("active");
  await carregaAssociados();
  filtrarModal();
});

function fecharPesquisa() {
  modalPesquisa.classList.remove("active");
}

function filtrarModal() {
  const term = searchModalInput.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtrados = associados.filter(a => {
    const nome = a.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cpf = a.cpf.replace(/\D/g, '');
    return nome.includes(term) || cpf.includes(term.replace(/\D/g, ''));
  });

  modalResults.innerHTML = filtrados.length
    ? filtrados.map((a, idx) => `
        <div class="list-item" onclick="editAssociado(${associados.indexOf(a)})">
          <span>${a.nome}</span>
          <small>CPF: ${a.cpf} | Pasta: ${a.pasta}</small>
        </div>
      `).join('')
    : '<p>Nenhum resultado.</p>';
}

function editAssociado(idx) {
  const a = associados[idx];
  if (!a) return;
  editIndex.value = idx;
  Object.keys(a).forEach(k => {
    const el = document.getElementById(k);
    if (el) el.value = a[k] || "";
  });
  deps = a.dependentes || [];
  renderDeps();
  if (a.conjuge) {
    document.getElementById("conjNome").value = a.conjuge.nome || "";
    document.getElementById("conjCpf").value = a.conjuge.cpf || "";
    document.getElementById("conjNasc").value = a.conjuge.nasc || "";
    document.getElementById("conjPlano").value = a.conjuge.plano || "";
  }
  fecharPesquisa();
  document.querySelector('[data-tab="dados"]').click();
}

// ---------- LOGOUT ----------
document.getElementById("btnSair").addEventListener("click", () => {
  if (confirm("Deseja sair?")) location.reload();
});

// ---------- INICIALIZA ----------
async function carregaAssociados() {
  associados = await getData("associados");
}
window.addEventListener("DOMContentLoaded", async () => {
  const funcs = await getData("funcionarios");
  if (!funcs.length) await setData("funcionarios", [{ nome: "Administrador", user: "admin", pass: "1234", admin: true }]);
});
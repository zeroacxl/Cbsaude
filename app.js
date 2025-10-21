import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBexxAzdyVtthakeOVfTf-PxnlQ5rNynRQ",
    authDomain: "cbsaudecooperados.firebaseapp.com",
    projectId: "cbsaudecooperados",
    storageBucket: "cbsaudecooperados.firebasestorage.app",
    messagingSenderId: "558244165893",
    appId: "1:558244165893:web:2e10e9560c896f43e6df6c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- VARIÁVEIS GLOBAIS ----------
let usuarioLogado = null;
let deps = [];
const cache = {
    funcionarios: null,
    associados: null,
    ultimaAtualizacao: 0
};

// ---------- FUNÇÕES UTILITÁRIAS ----------
async function getData(name) {
    try {
        const docRef = doc(db, "data", name);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data().list || [] : [];
    } catch (error) {
        console.error(`Erro ao buscar ${name}:`, error);
        return [];
    }
}

async function setData(name, list) {
    try {
        const docRef = doc(db, "data", name);
        await setDoc(docRef, { list });
    } catch (error) {
        console.error(`Erro ao salvar ${name}:`, error);
    }
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarTelefone(tel) {
    tel = tel.replace(/\D/g, '');
    if (tel.length === 11) {
        return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

function formatarCEP(cep) {
    cep = cep.replace(/\D/g, '');
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10));
}

function removerAcentos(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    const div = document.createElement('div');
    div.className = `notificacao ${tipo} animate-slide-in`;
    div.textContent = mensagem;
    document.body.appendChild(div);
    setTimeout(() => {
        div.classList.add('fade-out');
        setTimeout(() => div.remove(), 400);
    }, 3000);
}

async function getFuncionarios(forceRefresh = false) {
    if (forceRefresh || !cache.funcionarios || Date.now() - cache.ultimaAtualizacao > 300000) {
        cache.funcionarios = await getData('funcionarios');
        cache.ultimaAtualizacao = Date.now();
    }
    return cache.funcionarios;
}

async function setFuncionarios(data) {
    cache.funcionarios = data;
    cache.ultimaAtualizacao = Date.now();
    await setData('funcionarios', data);
}

async function getAssociados(forceRefresh = false) {
    if (forceRefresh || !cache.associados || Date.now() - cache.ultimaAtualizacao > 300000) {
        cache.associados = await getData('associados');
        cache.ultimaAtualizacao = Date.now();
    }
    return cache.associados;
}

async function setAssociados(data) {
    cache.associados = data;
    cache.ultimaAtualizacao = Date.now();
    await setData('associados', data);
}

function valorPlano(cod) {
    switch (cod) {
        case '224': return 20;
        case '226': return 115;
        case '228': return 155;
        default: return 0;
    }
}

// ---------- FUNÇÕES DE INTERFACE ----------
function doLogin() {
    const btnLogin = document.querySelector('button[onclick="doLogin()"]');
    const u = document.getElementById('userInput').value.trim();
    const p = document.getElementById('passInput').value.trim();

    if (!u || !p) {
        mostrarNotificacao('Preencha todos os campos', 'erro');
        return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = 'Entrando...';

    getFuncionarios(true).then(funcs => {
        const user = funcs.find(f => f.user === u && f.pass === p);
        if (user) {
            usuarioLogado = user;
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            if (user.admin) document.getElementById('btnGerencia').classList.remove('hidden');
            mostrarNotificacao(`Bem-vindo, ${user.nome}!`, 'sucesso');
        } else {
            mostrarNotificacao('Usuário ou senha inválidos', 'erro');
            document.getElementById('passInput').value = '';
            document.getElementById('passInput').focus();
        }
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    }).catch(error => {
        console.error('Erro no login:', error);
        mostrarNotificacao('Erro ao conectar. Verifique sua internet ou configurações.', 'erro');
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    });
}

function doLogout() {
    if (confirm('Deseja realmente sair?')) {
        usuarioLogado = null;
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('userInput').value = '';
        document.getElementById('passInput').value = '';
        document.getElementById('btnGerencia').classList.add('hidden');
    }
}

function abrirPesquisa() {
    document.getElementById('modalPesquisa').classList.add('active');
    document.getElementById('searchModalInput').value = '';
    filtrarModal();
    document.getElementById('searchModalInput').focus();
}

function fecharPesquisa() {
    document.getElementById('modalPesquisa').classList.remove('active');
}

function novo() {
    resetAll();
    switchTab('dados');
}

function gravar() {
    document.getElementById('associadoForm').requestSubmit();
}

function alterar() {
    abrirPesquisa();
}

function imprimirPDF() {
    buildResumo();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const conteudo = document.getElementById('resumoContent').innerText;
    doc.setFontSize(16);
    doc.text('CBSaúde Cooperados - Resumo Mensal', 14, 22);
    doc.setFontSize(12);
    const linhas = conteudo.split('\n');
    linhas.forEach((linha, i) => doc.text(linha, 14, 40 + i * 6));
    doc.save('resumo-cbsaude.pdf');
}

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tabContent').forEach(c => c.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(tab).classList.add('active');
    if (tab === 'resumo') buildResumo();
}

function abrirGerenciaFuncionarios() {
    if (!usuarioLogado?.admin) {
        mostrarNotificacao('Acesso negado. Apenas administradores podem gerenciar funcionários.', 'erro');
        return;
    }
    document.getElementById('modalFuncionarios').classList.add('active');
    renderizarFuncionarios();
}

function fecharGerenciaFuncionarios() {
    document.getElementById('modalFuncionarios').classList.remove('active');
}

async function adicionarFuncionario() {
    if (!usuarioLogado?.admin) {
        mostrarNotificacao('Acesso negado.', 'erro');
        return;
    }
    const nome = document.getElementById('funcNome').value.trim();
    const user = document.getElementById('funcUser').value.trim();
    const pass = document.getElementById('funcPass').value.trim();
    if (!nome || !user || !pass) {
        mostrarNotificacao('Preencha todos os campos.', 'erro');
        return;
    }
    const funcs = await getFuncionarios();
    if (funcs.find(f => f.user === user)) {
        mostrarNotificacao('Usuário já existe.', 'erro');
        return;
    }
    funcs.push({ nome, user, pass, admin: false });
    await setFuncionarios(funcs);
    document.getElementById('funcNome').value = '';
    document.getElementById('funcUser').value = '';
    document.getElementById('funcPass').value = '';
    renderizarFuncionarios();
    mostrarNotificacao('Funcionário adicionado com sucesso!', 'sucesso');
}

async function renderizarFuncionarios() {
    const funcs = await getFuncionarios();
    const div = document.getElementById('listaFuncionarios');
    div.innerHTML = '';
    funcs.forEach((f, i) => {
        div.insertAdjacentHTML('beforeend', `
            <div class="list-item" style="display:flex;justify-content:space-between;align-items:center;">
                <span>${escapeHTML(f.nome)} (${escapeHTML(f.user)}) ${f.admin ? '- Admin' : ''}</span>
                ${!f.admin ? `<button class="btn-top btn-danger btn-small" onclick="removerFuncionario(${i})">Remover</button>` : ''}
            </div>
        `);
    });
    if (!funcs.length) div.innerHTML = '<p>Nenhum funcionário cadastrado.</p>';
}

async function removerFuncionario(idx) {
    if (!usuarioLogado?.admin) {
        mostrarNotificacao('Acesso negado.', 'erro');
        return;
    }
    if (!confirm('Remover funcionário?')) return;
    let funcs = await getFuncionarios();
    funcs.splice(idx, 1);
    await setFuncionarios(funcs);
    renderizarFuncionarios();
}

async function filtrarModal() {
    const term = removerAcentos(document.getElementById('searchModalInput').value.toLowerCase());
    const lista = await getAssociados();
    const div = document.getElementById('modalResults');
    div.innerHTML = '';
    lista
        .filter(a => {
            const nome = removerAcentos(a.nome.toLowerCase());
            const cpf = a.cpf.replace(/\D/g, '');
            return nome.includes(term) || cpf.includes(term.replace(/\D/g, ''));
        })
        .forEach((a, i) => {
            const idx = lista.indexOf(a);
            div.insertAdjacentHTML('beforeend', `
                <div class="list-item" style="display:flex;justify-content:space-between;align-items:center;">
                    <div onclick="editAssociado(${idx})">
                        <span>${escapeHTML(a.nome)}</span>
                        <small>CPF: ${escapeHTML(a.cpf)} | Nº da Pasta: ${escapeHTML(a.pasta)}</small>
                    </div>
                    ${usuarioLogado?.admin ? `<button class="btn-top btn-danger btn-small" onclick="removerCooperado(${idx}, event)">Remover</button>` : ''}
                </div>
            `);
        });
    if (!div.innerHTML) div.innerHTML = '<p>Nenhum resultado.</p>';
}

async function removerCooperado(idx, event) {
    event.stopPropagation();
    if (!confirm('Confirma remoção deste cooperado?')) return;
    const lista = await getAssociados();
    const item = document.querySelectorAll('.list-item')[idx];
    item.classList.add('fade-out');
    setTimeout(async () => {
        lista.splice(idx, 1);
        await setAssociados(lista);
        filtrarModal();
    }, 400);
}

function addDependente() {
    deps.push({ nome: '', parent: '', nasc: '', cpf: '', plano: '' });
    renderDeps();
}

function renderDeps() {
    const div = document.getElementById('depsList');
    div.innerHTML = '';
    deps.forEach((d, i) => {
        div.insertAdjacentHTML('beforeend', `
            <div class="row" style="align-items:end;">
                <div class="col"><label>Nome</label><input value="${escapeHTML(d.nome)}" onchange="deps[${i}].nome=this.value"></div>
                <div class="col"><label>Parentesco</label><input value="${escapeHTML(d.parent)}" onchange="deps[${i}].parent=this.value"></div>
                <div class="col"><label>Nasc.</label><input type="date" value="${d.nasc}" onchange="deps[${i}].nasc=this.value"></div>
                <div class="col"><label>CPF</label><input value="${escapeHTML(d.cpf)}" onchange="deps[${i}].cpf=this.value"></div>
                <div class="col"><label>Plano</label>
                    <select onchange="deps[${i}].plano=this.value">
                        <option value="">Nenhum</option>
                        <option value="224" ${d.plano==='224'?'selected':''}>Alfa (224)</option>
                        <option value="226" ${d.plano==='226'?'selected':''}>Bravo (226)</option>
                        <option value="228" ${d.plano==='228'?'selected':''}>Delta (228)</option>
                    </select>
                </div>
                <div class="col"><button type="button" class="btn-top btn-danger" onclick="deps.splice(${i},1); renderDeps()">Remover</button></div>
            </div>
        `);
    });
}

function buildResumo() {
    const r = document.getElementById('resumoContent');
    r.innerHTML = '<h2>Resumo Mensal - CBSaúde Cooperados</h2>';

    const nome = document.getElementById('nome').value || '—';
    const cpf = document.getElementById('cpf').value || '—';
    const planoTit = document.getElementById('plano').value;
    const valorTit = valorPlano(planoTit);
    r.insertAdjacentHTML('beforeend', `
        <div class="resumo-block">
            <h3>Titular</h3>
            <div class="resumo-line"><span>Nome:</span><span>${escapeHTML(nome)}</span></div>
            <div class="resumo-line"><span>CPF:</span><span>${escapeHTML(cpf)}</span></div>
            <div class="resumo-line"><span>Plano:</span><span>${planoTit} - R$ ${valorTit.toFixed(2)}</span></div>
        </div>
    `);

    if (deps.length) {
        r.insertAdjacentHTML('beforeend', '<h3>Dependentes</h3>');
        deps.forEach(d => {
            const v = valorPlano(d.plano);
            r.insertAdjacentHTML('beforeend', `
                <div class="resumo-line">
                    <span>${escapeHTML(d.nome)} (${escapeHTML(d.parent)}) - CPF: ${escapeHTML(d.cpf || '—')} - Plano: ${d.plano || '—'}</span>
                    <span>R$ ${v.toFixed(2)}</span>
                </div>
            `);
        });
    }

    const conjNome = document.getElementById('conjNome').value;
    const conjCpf = document.getElementById('conjCpf').value;
    const conjNasc = document.getElementById('conjNasc').value;
    const conjPlano = document.getElementById('conjPlano').value;
    const conjValor = valorPlano(conjPlano);
    if (conjNome) {
        r.insertAdjacentHTML('beforeend', '<h3>Cônjuge</h3>');
        r.insertAdjacentHTML('beforeend', `
            <div class="resumo-line">
                <span>${escapeHTML(conjNome)} - CPF: ${escapeHTML(conjCpf || '—')} - Nasc: ${conjNasc} - Plano: ${conjPlano || '—'}</span>
                <span>R$ ${conjValor.toFixed(2)}</span>
            </div>
        `);
    }

    let total = valorTit;
    deps.forEach(d => total += valorPlano(d.plano));
    if (conjNome) total += conjValor;

    r.insertAdjacentHTML('beforeend', `
        <div class="total">Total Mensal: R$ ${total.toFixed(2)}</div>
    `);
}

function resetAll() {
    document.getElementById('associadoForm').reset();
    document.getElementById('editIndex').value = '';
    deps = [];
    renderDeps();
}

async function editAssociado(index) {
    const lista = await getAssociados();
    const a = lista[index];
    document.getElementById('editIndex').value = index;

    Object.keys(a).forEach(k => {
        const el = document.getElementById(k);
        if (el) el.value = a[k] || '';
    });

    deps = a.dependentes || [];
    renderDeps();
    if (a.conjuge) {
        document.getElementById('conjNome').value = a.conjuge.nome || '';
        document.getElementById('conjCpf').value = a.conjuge.cpf || '';
        document.getElementById('conjNasc').value = a.conjuge.nasc || '';
        document.getElementById('conjPlano').value = a.conjuge.plano || '';
    }

    switchTab('dados');
    fecharPesquisa();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- INICIALIZAÇÃO ----------
window.deps = [];

(async () => {
    let funcs = await getData('funcionarios');
    if (!funcs.find(f => f.user === 'admin')) {
        funcs.push({ nome: 'Administrador', user: 'admin', pass: '1234', admin: true });
        await setData('funcionarios', funcs);
    }
    document.getElementById('userInput').focus();
})();

document.getElementById('associadoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const index = document.getElementById('editIndex').value;
    let lista = await getAssociados();

    const associado = {
        nome: form.nome.value.trim(),
        cpf: form.cpf.value,
        pasta: form.pasta.value,
        matricula: form.matricula.value,
        nasc: form.nasc.value,
        dataAssociacao: form.dataAssociacao.value,
        sexo: form.sexo.value,
        civil: form.civil.value,
        endereco: form.endereco.value,
        numero: form.numero.value,
        bairro: form.bairro.value,
        municipio: form.municipio.value,
        estado: form.estado.value,
        cep: form.cep.value,
        telefone: form.telefone.value,
        email: form.email.value,
        plano: form.plano.value,
        obs: form.obs.value,
        dependentes: deps,
        conjuge: {
            nome: form.conjNome.value,
            cpf: form.conjCpf.value,
            nasc: form.conjNasc.value,
            plano: form.conjPlano.value
        }
    };

    if (!associado.nome || !associado.cpf) {
        mostrarNotificacao('Nome e CPF são obrigatórios para o titular.', 'erro');
        return;
    }

    if (associado.cpf && !validarCPF(associado.cpf)) {
        mostrarNotificacao('CPF do titular é inválido.', 'erro');
        return;
    }

    if (associado.conjuge.cpf && !validarCPF(associado.conjuge.cpf)) {
        mostrarNotificacao('CPF do cônjuge é inválido.', 'erro');
        return;
    }

    if (index !== '') {
        lista[index] = associado;
    } else {
        lista.push(associado);
    }

    try {
        await setAssociados(lista);
        resetAll();
        mostrarNotificacao('Dados salvos com sucesso!', 'sucesso');
    } catch (error) {
        console.error('Erro ao salvar:', error);
        mostrarNotificacao('Erro ao salvar os dados. Tente novamente.', 'erro');
    }
});

window.onload = () => {
    document.getElementById('userInput').focus();

    // Formatação automática
    document.getElementById('cpf').addEventListener('blur', function() {
        this.value = formatarCPF(this.value);
        if (this.value && !validarCPF(this.value)) {
            mostrarNotificacao('CPF inválido!', 'erro');
            this.focus();
        }
    });
    document.getElementById('telefone').addEventListener('blur', function() {
        this.value = formatarTelefone(this.value);
    });
    document.getElementById('cep').addEventListener('blur', function() {
        this.value = formatarCEP(this.value);
    });
    document.getElementById('conjCpf').addEventListener('blur', function() {
        this.value = formatarCPF(this.value);
        if (this.value && !validarCPF(this.value)) {
            mostrarNotificacao('CPF do cônjuge inválido!', 'erro');
            this.focus();
        }
    });
};
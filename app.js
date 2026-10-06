// PERSISTÊNCIA DE DADOS
let livros = JSON.parse(localStorage.getItem('athena_livros')) || [];
let usuarios = JSON.parse(localStorage.getItem('athena_usuarios')) || [];
let emprestimos = JSON.parse(localStorage.getItem('athena_emprestimos')) || [];

// NAVEGAÇÃO DE ABAS
function mostrarAba(nomeAba) {
    document.querySelectorAll('.aba').forEach(aba => aba.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`aba-${nomeAba}`).classList.add('active');

    const btnAtivo = Array.from(document.querySelectorAll('.nav-btn')).find(
        btn => btn.getAttribute('onclick').includes(nomeAba)
    );
    if (btnAtivo) btnAtivo.classList.add('active');

    if (nomeAba === 'emprestimos') {
        atualizarSelectsEmprestimo();
    }
}

function salvarDados() {
    localStorage.setItem('athena_livros', JSON.stringify(livros));
    localStorage.setItem('athena_usuarios', JSON.stringify(usuarios));
    localStorage.setItem('athena_emprestimos', JSON.stringify(emprestimos));
}

// --- GESTÃO DE LIVROS ---
document.getElementById('form-livro').addEventListener('submit', (e) => {
    e.preventDefault();
    const titulo = document.getElementById('titulo-livro').value.trim();
    const autor = document.getElementById('autor-livro').value.trim();

    if (titulo && autor) {
        livros.push({ id: Date.now(), titulo, autor });
        salvarDados();
        renderizarLivros();
        e.target.reset();
    }
});

function excluirLivro(id) {
    // Validação: impede a exclusão se o livro possui um empréstimo em aberto
    const estaEmprestado = emprestimos.some(emp => emp.livroId === id && emp.status === 'Em aberto');
    
    if (estaEmprestado) {
        alert('Não é possível excluir esta obra pois ela consta com empréstimo pendente em aberto.');
        return;
    }

    if (confirm('Deseja realmente remover este livro do acervo?')) {
        livros = livros.filter(l => l.id !== id);
        salvarDados();
        renderizarLivros();
    }
}

function renderizarLivros() {
    const tbody = document.getElementById('tabela-livros');
    tbody.innerHTML = '';

    if (livros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma obra registrada no acervo.</td></tr>';
        return;
    }

    livros.forEach(livro => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${livro.titulo}</strong></td>
            <td>${livro.autor}</td>
            <td><code>#${livro.id}</code></td>
            <td class="text-right">
                <button class="btn-danger-outline" onclick="excluirLivro(${livro.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- GESTÃO DE USUÁRIOS ---
document.getElementById('form-usuario').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome-usuario').value.trim();

    if (nome) {
        usuarios.push({ id: Date.now(), nome });
        salvarDados();
        renderizarUsuarios();
        e.target.reset();
    }
});

function excluirUsuario(id) {
    const possuiEmprestimo = emprestimos.some(emp => emp.usuarioId === id && emp.status === 'Em aberto');

    if (possuiEmprestimo) {
        alert('Este leitor possui pendências de devolução ativas e não pode ser excluído.');
        return;
    }

    if (confirm('Deseja remover o cadastro deste leitor?')) {
        usuarios = usuarios.filter(u => u.id !== id);
        salvarDados();
        renderizarUsuarios();
    }
}

function renderizarUsuarios() {
    const tbody = document.getElementById('tabela-usuarios');
    tbody.innerHTML = '';

    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum leitor cadastrado na base.</td></tr>';
        return;
    }

    usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${usuario.nome}</strong></td>
            <td><code>#${usuario.id}</code></td>
            <td class="text-right">
                <button class="btn-danger-outline" onclick="excluirUsuario(${usuario.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- GESTÃO DE EMPRÉSTIMOS ---
function atualizarSelectsEmprestimo() {
    const selectLivro = document.getElementById('select-livro');
    const selectUsuario = document.getElementById('select-usuario');

    selectLivro.innerHTML = '<option value="">Selecione uma obra...</option>';
    selectUsuario.innerHTML = '<option value="">Selecione um leitor...</option>';

    livros.forEach(livro => {
        const opt = document.createElement('option');
        opt.value = livro.id;
        opt.textContent = `${livro.titulo} — ${livro.autor}`;
        selectLivro.appendChild(opt);
    });

    usuarios.forEach(usuario => {
        const opt = document.createElement('option');
        opt.value = usuario.id;
        opt.textContent = usuario.nome;
        selectUsuario.appendChild(opt);
    });
}

document.getElementById('form-emprestimo').addEventListener('submit', (e) => {
    e.preventDefault();
    const livroId = Number(document.getElementById('select-livro').value);
    const usuarioId = Number(document.getElementById('select-usuario').value);

    if (!livroId || !usuarioId) return;

    const livro = livros.find(l => l.id === livroId);
    const usuario = usuarios.find(u => u.id === usuarioId);

    const novoEmprestimo = {
        id: Date.now(),
        livroId: livro.id,
        usuarioId: usuario.id,
        tituloLivro: livro.titulo,
        autorLivro: livro.autor,
        nomeUsuario: usuario.nome,
        dataEmprestimo: new Date().toLocaleDateString('pt-BR'),
        dataDevolucao: '-',
        status: 'Em aberto'
    };

    emprestimos.unshift(novoEmprestimo);
    salvarDados();
    renderizarEmprestimos();
    e.target.reset();
});

function devolverLivro(id) {
    const emprestimo = emprestimos.find(e => e.id === id);
    if (emprestimo && emprestimo.status === 'Em aberto') {
        emprestimo.status = 'Devolvido';
        emprestimo.dataDevolucao = new Date().toLocaleDateString('pt-BR');
        salvarDados();
        renderizarEmprestimos();
    }
}

function excluirEmprestimo(id) {
    if (confirm('Deseja remover este registro do histórico de empréstimos?')) {
        emprestimos = emprestimos.filter(e => e.id !== id);
        salvarDados();
        renderizarEmprestimos();
    }
}

function renderizarEmprestimos() {
    const tbody = document.getElementById('tabela-emprestimos');
    tbody.innerHTML = '';

    if (emprestimos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum registro no histórico de empréstimos.</td></tr>';
        return;
    }

    emprestimos.forEach(emp => {
        const tr = document.createElement('tr');
        const isAberto = emp.status === 'Em aberto';
        const statusClasse = isAberto ? 'status-aberto' : 'status-devolvido';

        tr.innerHTML = `
            <td><strong>${emp.tituloLivro}</strong></td>
            <td>${emp.autorLivro}</td>
            <td>${emp.nomeUsuario}</td>
            <td>${emp.dataEmprestimo}</td>
            <td>${emp.dataDevolucao}</td>
            <td><span class="status-badge ${statusClasse}">${emp.status}</span></td>
            <td class="text-right">
                ${isAberto 
                    ? `<button class="btn-action-resolve" onclick="devolverLivro(${emp.id})">Registrar Devolução</button>` 
                    : `<button class="btn-danger-outline" onclick="excluirEmprestimo(${emp.id})">Limpar Registro</button>`}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// INICIALIZAÇÃO DA APLICAÇÃO
renderizarLivros();
renderizarUsuarios();
renderizarEmprestimos();
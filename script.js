// =====================================================
// V5 - SISTEMA DE ESTOQUE
// UX E MODAIS CUSTOMIZADOS
// =====================================================


// =====================================================
// FASE 1: CLASSE PRODUTO
// =====================================================

class Produto {

    #preco;
    #quantidade;

    constructor(nome, preco, quantidade) {

        nome = String(nome).trim();

        if (!nome) {
            throw new Error(
                "O nome do produto não pode ficar em branco."
            );
        }

        this.nome = nome;
        this.preco = preco;
        this.quantidade = quantidade;
    }

    get preco() {
        return this.#preco;
    }

    set preco(valor) {

        valor = Number(valor);

        if (!Number.isFinite(valor) || valor <= 0) {
            throw new Error(
                "O preço deve ser um número válido maior que zero."
            );
        }

        this.#preco = valor;
    }

    get quantidade() {
        return this.#quantidade;
    }

    set quantidade(valor) {

        valor = Number(valor);

        if (!Number.isInteger(valor) || valor <= 0) {
            throw new Error(
                "A quantidade deve ser um número inteiro maior que zero."
            );
        }

        this.#quantidade = valor;
    }

    calcularSubtotal() {

        return this.preco * this.quantidade;

    }

}


// =====================================================
// FASE 2: GERENCIAMENTO DOS PRODUTOS
// =====================================================

const CHAVE_STORAGE = "sistema_estoque_produtos";

const listaDeProdutos = [];

let indiceEdicao = null;

let acaoPendente = null;

let temporizadorMensagem = null;


// =====================================================
// FASE 3: ELEMENTOS DO HTML
// =====================================================

const formProduto = document.getElementById("produto-form");

const nomeInput = document.getElementById("nome");

const precoInput = document.getElementById("preco");

const quantidadeInput = document.getElementById("quantidade");

const campoBusca = document.getElementById("campo-busca");

const sugestoesProdutos = document.getElementById("sugestoes-produtos");

const mensagemPagina = document.getElementById("mensagem-pagina");

const totalEstoqueEl = document.getElementById("total-estoque");

const btnLimparTudo = document.getElementById("limpar-tabela");

const btnCancelarEdicao = document.getElementById("cancelar-edicao");

const btnEnviar = formProduto.querySelector(
    'button[type="submit"]'
);

const textoBotaoOriginal = "Adicionar produto";


// =====================================================
// FASE 4: MENSAGENS INLINE V5
// SUBSTITUIÇÃO DO ALERT()
// =====================================================

function mostrarMensagem(texto, tipo = "info", permanente = false) {

    clearTimeout(temporizadorMensagem);

    mensagemPagina.textContent = texto;

    mensagemPagina.className =
        `mensagem-pagina ${tipo}`;

    mensagemPagina.hidden = false;

    if (!permanente) {

        temporizadorMensagem = setTimeout(() => {

            mensagemPagina.hidden = true;

        }, 5000);

    }

}


function limparMensagem() {

    clearTimeout(temporizadorMensagem);

    mensagemPagina.hidden = true;

    mensagemPagina.textContent = "";

    mensagemPagina.className = "mensagem-pagina";

}


function destacarCampo(campo) {

    campo.focus();

    campo.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// =====================================================
// FASE 5: LOCALSTORAGE
// =====================================================

function salvarNoLocalStorage() {

    const dados = listaDeProdutos.map(produto => ({

        nome: produto.nome,

        preco: produto.preco,

        quantidade: produto.quantidade

    }));

    localStorage.setItem(
        CHAVE_STORAGE,
        JSON.stringify(dados)
    );

}


function carregarDoLocalStorage() {

    const dados = localStorage.getItem(CHAVE_STORAGE);

    if (!dados) return;

    try {

        const produtos = JSON.parse(dados);

        if (!Array.isArray(produtos)) {

            throw new Error(
                "Formato inválido dos dados salvos."
            );

        }

        produtos.forEach(item => {

            try {

                listaDeProdutos.push(
                    new Produto(
                        item.nome,
                        item.preco,
                        item.quantidade
                    )
                );

            } catch (erro) {

                console.warn(
                    "Produto salvo ignorado:",
                    erro.message
                );

            }

        });

    } catch (erro) {

        console.error(
            "Não foi possível carregar os produtos:",
            erro
        );

        mostrarMensagem(
            "Não foi possível ler os produtos salvos neste navegador.",
            "erro"
        );

    }

}


// =====================================================
// FASE 6: SUGESTÕES AUTOMÁTICAS
// =====================================================

function esconderSugestoes() {

    sugestoesProdutos.innerHTML = "";

    sugestoesProdutos.classList.remove("ativa");

}


function mostrarSugestoes() {

    esconderSugestoes();

    const termo = nomeInput.value.trim().toLowerCase();

    if (termo.length < 2) return;

    const encontrados = listaDeProdutos

        .map((produto, index) => ({

            produto,
            index

        }))

        .filter(item =>

            item.produto.nome.toLowerCase().includes(termo) &&

            item.index !== indiceEdicao

        );


    if (!encontrados.length) return;


    encontrados.forEach(item => {

        const opcao = document.createElement("div");

        opcao.className = "sugestao-item";


        const nome = document.createElement("strong");

        nome.textContent = item.produto.nome;


        const detalhe = document.createElement("span");

        detalhe.className = "sugestao-detalhes";

        detalhe.textContent =
            `Preço: ${formatarMoeda(item.produto.preco)} | ` +
            `Quantidade: ${item.produto.quantidade}`;


        opcao.append(nome, detalhe);


        opcao.addEventListener("mousedown", event => {

            event.preventDefault();

        });


        opcao.addEventListener("click", () => {

            prepararEdicao(item.index);

            esconderSugestoes();

        });


        sugestoesProdutos.appendChild(opcao);

    });


    sugestoesProdutos.classList.add("ativa");

}


nomeInput.addEventListener("input", () => {

    limparMensagem();

    mostrarSugestoes();

});


nomeInput.addEventListener("blur", () => {

    setTimeout(esconderSugestoes, 180);

});


// =====================================================
// FASE 7: CADASTRAR E EDITAR PRODUTOS
// =====================================================

formProduto.addEventListener("submit", event => {

    event.preventDefault();

    limparMensagem();


    const nome = nomeInput.value.trim();

    const precoTexto = precoInput.value.trim();

    const quantidadeTexto = quantidadeInput.value.trim();


    const preco = Number(precoTexto);

    const quantidade = Number(quantidadeTexto);


    // VALIDAR NOME

    if (!nome) {

        mostrarMensagem(
            "Digite o nome do produto para continuar.",
            "erro"
        );

        destacarCampo(nomeInput);

        return;

    }


    // VALIDAR PREÇO

    if (
        !precoTexto ||
        !Number.isFinite(preco) ||
        preco <= 0
    ) {

        mostrarMensagem(
            "Digite um preço válido maior que zero.",
            "erro"
        );

        destacarCampo(precoInput);

        return;

    }


    // VALIDAR QUANTIDADE

    if (
        !quantidadeTexto ||
        !Number.isInteger(quantidade) ||
        quantidade <= 0
    ) {

        mostrarMensagem(
            "Digite uma quantidade inteira maior que zero.",
            "erro"
        );

        destacarCampo(quantidadeInput);

        return;

    }


    // VERIFICAR PRODUTOS DUPLICADOS

    const duplicado = listaDeProdutos.findIndex(
        (produto, index) =>

            produto.nome.toLowerCase() === nome.toLowerCase() &&

            index !== indiceEdicao

    );


    if (duplicado !== -1) {

        mostrarMensagem(
            "Esse produto já está cadastrado. Use a sugestão para editar o item existente.",
            "erro"
        );

        mostrarSugestoes();

        destacarCampo(nomeInput);

        return;

    }


    try {

        const produto = new Produto(
            nome,
            preco,
            quantidade
        );


        const estavaEditando = indiceEdicao !== null;


        if (estavaEditando) {

            // ATUALIZAR PRODUTO

            listaDeProdutos[indiceEdicao] = produto;

        } else {

            // CADASTRAR PRODUTO

            listaDeProdutos.push(produto);

        }


        salvarNoLocalStorage();

        finalizarEdicao();

        atualizarInterface();


        mostrarMensagem(

            estavaEditando

                ? "Produto atualizado com sucesso!"

                : "Produto cadastrado com sucesso!",

            "sucesso"

        );


    } catch (erro) {

        mostrarMensagem(
            erro.message,
            "erro"
        );

    }

});


// =====================================================
// FASE 8: PREPARAR EDIÇÃO
// =====================================================

function prepararEdicao(index) {

    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= listaDeProdutos.length
    ) {

        mostrarMensagem(
            "Não foi possível encontrar esse produto.",
            "erro"
        );

        return;

    }


    const produto = listaDeProdutos[index];


    nomeInput.value = produto.nome;

    precoInput.value = produto.preco;

    quantidadeInput.value = produto.quantidade;


    indiceEdicao = index;


    btnEnviar.textContent = "Salvar alterações";

    btnCancelarEdicao.hidden = false;


    esconderSugestoes();

    limparMensagem();

    destacarCampo(nomeInput);

}


function finalizarEdicao() {

    indiceEdicao = null;

    formProduto.reset();

    btnEnviar.textContent = textoBotaoOriginal;

    btnCancelarEdicao.hidden = true;

    esconderSugestoes();

}


btnCancelarEdicao.addEventListener("click", () => {

    finalizarEdicao();

    mostrarMensagem(
        "Edição cancelada.",
        "info"
    );

});


// =====================================================
// FASE 9: MODAL DE CONFIRMAÇÃO V5
// SUBSTITUIÇÃO DO CONFIRM()
// =====================================================

const modalConfirmacao = document.getElementById(
    "modal-confirmacao"
);

const tituloModalConfirmacao = document.getElementById(
    "titulo-modal-confirmacao"
);

const textoModalConfirmacao = document.getElementById(
    "texto-modal-confirmacao"
);

const btnConfirmarAcao = document.getElementById(
    "confirmar-acao"
);

const btnCancelarConfirmacao = document.getElementById(
    "cancelar-confirmacao"
);


// ABRIR MODAL

function abrirModalConfirmacao(titulo, texto, acao) {

    tituloModalConfirmacao.textContent = titulo;

    textoModalConfirmacao.textContent = texto;

    acaoPendente = acao;


    modalConfirmacao.classList.add("ativa");

    modalConfirmacao.setAttribute(
        "aria-hidden",
        "false"
    );


    btnCancelarConfirmacao.focus();

}


// FECHAR MODAL

function fecharModalConfirmacao() {

    modalConfirmacao.classList.remove("ativa");

    modalConfirmacao.setAttribute(
        "aria-hidden",
        "true"
    );

    acaoPendente = null;

}


// CANCELAR

btnCancelarConfirmacao.addEventListener("click", () => {

    fecharModalConfirmacao();

});


// CONFIRMAR

btnConfirmarAcao.addEventListener("click", () => {

    const executar = acaoPendente;

    fecharModalConfirmacao();

    if (typeof executar === "function") {

        executar();

    }

});


// FECHAR CLICANDO FORA

modalConfirmacao.addEventListener("click", event => {

    if (event.target === modalConfirmacao) {

        fecharModalConfirmacao();

    }

});


// =====================================================
// FASE 10: REMOVER PRODUTO
// =====================================================

function solicitarRemocao(index) {

    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= listaDeProdutos.length
    ) return;


    const nomeProduto = listaDeProdutos[index].nome;


    abrirModalConfirmacao(

        "Excluir produto?",

        `Deseja realmente remover "${nomeProduto}" do estoque? Essa ação não poderá ser desfeita.`,

        () => removerProduto(index)

    );

}


function removerProduto(index) {

    if (
        index < 0 ||
        index >= listaDeProdutos.length
    ) return;


    listaDeProdutos.splice(index, 1);


    if (indiceEdicao === index) {

        finalizarEdicao();

    } else if (
        indiceEdicao !== null &&
        index < indiceEdicao
    ) {

        indiceEdicao--;

    }


    salvarNoLocalStorage();

    atualizarInterface();


    mostrarMensagem(
        "Produto removido com sucesso.",
        "sucesso"
    );

}


// =====================================================
// FASE 11: LIMPAR TODOS OS PRODUTOS
// =====================================================

btnLimparTudo.addEventListener("click", () => {

    if (listaDeProdutos.length === 0) {

        mostrarMensagem(
            "Não há produtos cadastrados para limpar.",
            "info"
        );

        return;

    }


    abrirModalConfirmacao(

        "Limpar todo o estoque?",

        `Você está prestes a excluir os ${listaDeProdutos.length} produto(s) cadastrados. Deseja continuar?`,

        () => {

            listaDeProdutos.length = 0;

            localStorage.removeItem(CHAVE_STORAGE);

            finalizarEdicao();

            atualizarInterface();


            mostrarMensagem(
                "Todos os produtos foram removidos.",
                "sucesso"
            );

        }

    );

});


// =====================================================
// FASE 12: PESQUISA DINÂMICA
// =====================================================

function obterProdutosFiltrados() {

    const termo = campoBusca.value.toLowerCase().trim();


    return listaDeProdutos

        .map((produto, index) => ({

            produto,

            index

        }))

        .filter(item =>

            item.produto.nome.toLowerCase().includes(termo)

        );

}


// =====================================================
// FASE 13: FORMATAR MOEDA
// =====================================================

function formatarMoeda(valor) {

    return Number(valor).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


// =====================================================
// FASE 14: CALCULAR TOTAL DO ESTOQUE
// =====================================================

function atualizarTotalEstoque() {

    const total = listaDeProdutos.reduce(

        (soma, produto) =>

            soma + produto.calcularSubtotal(),

        0

    );


    totalEstoqueEl.textContent =
        formatarMoeda(total);

}


// =====================================================
// FASE 15: RENDERIZAR TABELA
// =====================================================

function renderizarTabela(produtosVisiveis) {

    const corpo = document.querySelector(
        "#tabela-produtos tbody"
    );


    corpo.innerHTML = "";


    // NENHUM PRODUTO ENCONTRADO

    if (produtosVisiveis.length === 0) {

        const linha = document.createElement("tr");

        const celula = document.createElement("td");


        celula.colSpan = 5;

        celula.className = "mensagem-vazia";


        celula.textContent =

            listaDeProdutos.length === 0

                ? "Nenhum produto cadastrado."

                : "Nenhum produto encontrado para essa pesquisa.";


        linha.appendChild(celula);

        corpo.appendChild(linha);

        return;

    }


    // PERCORRER PRODUTOS

    produtosVisiveis.forEach(({ produto, index }) => {

        const linha = document.createElement("tr");


        const valores = [

            produto.nome,

            formatarMoeda(produto.preco),

            String(produto.quantidade),

            formatarMoeda(
                produto.calcularSubtotal()
            )

        ];


        valores.forEach(valor => {

            const celula = document.createElement("td");

            celula.textContent = valor;

            linha.appendChild(celula);

        });


        // COLUNA DE AÇÕES

        const acoes = document.createElement("td");


        // BOTÃO EDITAR

        const editar = document.createElement("button");

        editar.type = "button";

        editar.className = "btn-editar";

        editar.textContent = "Editar";


        editar.addEventListener("click", () => {

            prepararEdicao(index);

        });


        // BOTÃO REMOVER

        const remover = document.createElement("button");

        remover.type = "button";

        remover.className = "btn-remover";

        remover.textContent = "Remover";


        remover.addEventListener("click", () => {

            solicitarRemocao(index);

        });


        acoes.append(editar, remover);

        linha.appendChild(acoes);

        corpo.appendChild(linha);

    });

}


// =====================================================
// FASE 16: ATUALIZAR INTERFACE
// =====================================================

function atualizarInterface() {

    const produtosVisiveis = obterProdutosFiltrados();

    renderizarTabela(produtosVisiveis);

    atualizarTotalEstoque();

}


campoBusca.addEventListener("input", atualizarInterface);


// =====================================================
// FASE 17: MODAL CONCEITO BOOTSTRAP
// =====================================================

const modalBootstrap = document.getElementById(
    "modal-bootstrap"
);

const abrirBootstrap = document.getElementById(
    "abrir-bootstrap"
);

const fecharBootstrap = document.getElementById(
    "fechar-bootstrap"
);

const entendiBootstrap = document.getElementById(
    "entendi-bootstrap"
);


// ABRIR

function abrirModalBootstrap() {

    modalBootstrap.classList.add("ativa");

    modalBootstrap.setAttribute(
        "aria-hidden",
        "false"
    );

    entendiBootstrap.focus();

}


// FECHAR

function fecharModalBootstrap() {

    modalBootstrap.classList.remove("ativa");

    modalBootstrap.setAttribute(
        "aria-hidden",
        "true"
    );

}


// EVENTOS

abrirBootstrap.addEventListener(
    "click",
    abrirModalBootstrap
);


fecharBootstrap.addEventListener(
    "click",
    fecharModalBootstrap
);


entendiBootstrap.addEventListener(
    "click",
    fecharModalBootstrap
);


modalBootstrap.addEventListener("click", event => {

    if (event.target === modalBootstrap) {

        fecharModalBootstrap();

    }

});


// =====================================================
// FASE 18: FECHAR MODAIS COM ESC
// =====================================================

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        fecharModalConfirmacao();

        fecharModalBootstrap();

    }

});


// =====================================================
// FASE 19: INICIAR O SISTEMA
// =====================================================

carregarDoLocalStorage();

atualizarInterface();
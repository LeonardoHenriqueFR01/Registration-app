const produtos = {}; // agora armazena objetos { nome, marca, quantidade }
let ultimaImagem = ""; // 🆕 Guardar a URL da imagem do produto

document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");
  const produtoInfo = document.getElementById("produto");
  const campoManual = document.getElementById("codigoManual");
  const readerDiv = document.getElementById("reader");
  const reader = new Html5Qrcode("reader");
  const formValidade = document.getElementById("formValidade");
  const validadeInput = document.getElementById("validade");
  const imagemProduto = document.getElementById("imagemProduto");

  function mostrarMensagem(texto, tipo = "info") {
    status.textContent = texto;
    status.style.color = tipo === "erro" ? "red" : "green";
  }

  document.getElementById("abrirManual").addEventListener("click", () => {
    document.getElementById("manualInput").style.display = "block";
    mostrarMensagem("Digite o código e clique em buscar.");
  });

  function montarNomeCompleto(nome, marca = "", quantidade = "") {
    if (!nome) return "";
    if (nome.length < 20) {
      const partes = [nome];
      if (marca && !nome.includes(marca)) partes.push(marca);
      if (quantidade && !nome.includes(quantidade)) partes.push(quantidade);
      return partes.join(" - ");
    }
    return nome;
  }

  fetch('/api/produtos.json')
    .then(res => res.json())
    .then(data => {
      data.forEach(prod => {
        produtos[prod.codigo] = {
          nome: prod.nome || "",
          marca: prod.marca || "",
          quantidade: prod.quantidade || ""
        };
      });
      mostrarMensagem("📷 Aponte para o código de barras...");
      iniciarScanner();
    })
    .catch(() => {
      mostrarMensagem("Erro ao carregar produtos.", "erro");
    });

  function iniciarScanner() {
    reader.start(
      { facingMode: { exact: "environment" } },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (decodedText) => {
        reader.stop().then(() => {
          campoManual.value = decodedText;
          buscarProduto(decodedText);
          mostrarMensagem("");
          readerDiv.style.display = "none";
          formValidade.style.display = "block";
        });
      },
      () => {}
    ).catch((err) => {
      mostrarMensagem("Erro ao iniciar a câmera.", "erro");
      console.error(err);
    });
  }

  function buscarProduto(codigo) {
    const prodLocal = produtos[codigo];

    if (prodLocal) {
      const nomeCompleto = montarNomeCompleto(prodLocal.nome, prodLocal.marca, prodLocal.quantidade);
      produtoInfo.textContent = "Produto: " + nomeCompleto;

      const imagemUrl = `/static/uploads/${codigo}.png`;
      imagemProduto.onload = () => imagemProduto.style.display = "block";
      imagemProduto.onerror = () => imagemProduto.style.display = "none";
      imagemProduto.src = imagemUrl;
      ultimaImagem = imagemUrl;
    } else {
      fetch(`https://world.openfoodfacts.org/api/v0/product/${codigo}.json`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 1) {
            const produto = data.product;
            const nome = produto.product_name || "Nome não disponível";
            const marca = produto.brands || "";
            const quantidade = produto.quantity || "";
            const nomeCompleto = montarNomeCompleto(nome, marca, quantidade);

            produtoInfo.textContent = "Produto: " + nomeCompleto;

            const imagemUrl = produto.image_front_url || "";
            imagemProduto.src = imagemUrl;
            imagemProduto.style.display = imagemUrl ? "block" : "none";

            produtos[codigo] = { nome, marca, quantidade };
            ultimaImagem = imagemUrl;
          } else {
            produtoInfo.textContent = "Produto não encontrado na base.";
            imagemProduto.style.display = "none";
            ultimaImagem = "";
          }
        })
        .catch(err => {
          console.error("Erro na API:", err);
          produtoInfo.textContent = "Erro ao buscar produto.";
          imagemProduto.style.display = "none";
          ultimaImagem = "";
        });
    }
  }

  window.buscarProdutoManual = function () {
    const codigo = campoManual.value.trim();
    buscarProduto(codigo);
    formValidade.style.display = "block";
  };

  function salvarProduto(codigo, nomeProduto, validade) {
    mostrarMensagem("Salvando produto...");

    fetch('/api/salvar_produto_usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: codigo,
        nome: nomeProduto,
        validade: validade,
        imagem_url: ultimaImagem
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Erro no servidor");
        return res.json();
      })
      .then(() => {
        mostrarMensagem("✅ Produto salvo com sucesso!");
        formValidade.reset();
        formValidade.style.display = "none";
        produtoInfo.textContent = "";
        imagemProduto.style.display = "none";
        ultimaImagem = "";
        readerDiv.style.display = "block";
        iniciarScanner();
      })
      .catch(err => {
        console.error("Erro ao salvar produto:", err);
        mostrarMensagem("❌ Erro ao salvar produto.", "erro");
      });
  }

  formValidade.addEventListener("submit", function (e) {
    e.preventDefault();

    const codigo = campoManual.value.trim();
    const validade = validadeInput.value;

    if (!codigo || !validade) {
      mostrarMensagem("❌ Código ou validade ausente!", "erro");
      return;
    }

    const prodLocal = produtos[codigo];
    const nomeProduto = prodLocal
      ? montarNomeCompleto(prodLocal.nome, prodLocal.marca, prodLocal.quantidade)
      : "Desconhecido";

    salvarProduto(codigo, nomeProduto, validade);
  });
});

function mostrarFormularioValidade() {
  document.getElementById('formValidade').style.display = 'block';
  document.getElementById('validade').focus();
}

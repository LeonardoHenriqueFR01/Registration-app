const produtos = {};

document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");
  const produtoInfo = document.getElementById("produto");
  const campoManual = document.getElementById("codigoManual");
  const readerDiv = document.getElementById("reader");
  const reader = new Html5Qrcode("reader");
  const formValidade = document.getElementById("formValidade");
  const validadeInput = document.getElementById("validade");

  // Ocultar campo manual até clicar
  document.getElementById("abrirManual").addEventListener("click", () => {
    document.getElementById("manualInput").style.display = "block";
    status.textContent = "Digite o código e clique em buscar.";
  });

  // Carrega produtos
  fetch('/api/produtos.json')
    .then(res => res.json())
    .then(data => {
      data.forEach(prod => {
        produtos[prod.codigo] = prod.nome;
      });
      status.textContent = "📷 Aponte para o código de barras...";
      iniciarScanner();
    })
    .catch(() => {
      status.textContent = "Erro ao carregar produtos.";
    });

  // Inicia câmera
  function iniciarScanner() {
    reader.start(
      { facingMode: { exact: "environment" } },
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      },
      (decodedText) => {
        reader.stop().then(() => {
          campoManual.value = decodedText;
          buscarProduto(decodedText);
          status.textContent = "✅ Código lido com sucesso!";
          readerDiv.style.display = "none";
          formValidade.style.display = "block";
        });
      },
      (error) => { /* ignora */ }
    ).catch((err) => {
      status.textContent = "Erro ao iniciar a câmera.";
      console.error(err);
    });
  }

  // Busca produto
  function buscarProduto(codigo) {
    const nome = produtos[codigo];
    const imagemProduto = document.getElementById("imagemProduto");
  
    if (nome) {
      produtoInfo.textContent = "Produto: " + nome;
  
      // Define a imagem e verifica se ela existe
      const imagemUrl = `/static/uploads/${codigo}.png`;
  
      // Tenta carregar a imagem
      imagemProduto.onload = () => {
        imagemProduto.style.display = "block";
      };
      imagemProduto.onerror = () => {
        imagemProduto.style.display = "none"; // oculta se não existir
      };
      imagemProduto.src = imagemUrl;
  
    } else {
      produtoInfo.textContent = "Produto não encontrado.";
      imagemProduto.style.display = "none";
    }
  }
  
  // Busca manual
  window.buscarProdutoManual = function () {
    const codigo = campoManual.value.trim();
    buscarProduto(codigo);
    formValidade.style.display = "block";
  };

  // Submissão da validade
  formValidade.addEventListener("submit", function (e) {
    e.preventDefault();
    const codigo = campoManual.value.trim();
    const validade = validadeInput.value;

    if (!codigo || !validade) {
      alert("Código ou validade ausente!");
      return;
    }

    const nomeProduto = produtos[codigo] || "Desconhecido";

    // Envia para o backend
    fetch('/api/salvar_produto_usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: codigo,
        nome: nomeProduto,
        validade: validade
      })
    })
      .then(res => res.json())
      .then(data => {
        alert("✅ Produto salvo com sucesso!");
        formValidade.reset();
        formValidade.style.display = "none";
        produtoInfo.textContent = "";
        status.textContent = "📷 Pronto para o próximo produto!";
        readerDiv.style.display = "block";
        iniciarScanner();
      })
      .catch(err => {
        console.error("Erro ao salvar produto:", err);
        alert("❌ Erro ao salvar produto.");
      });
  });
});

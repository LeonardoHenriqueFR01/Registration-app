const produtos = {};
let ultimaImagem = "";
let scannerAtivo = true;

document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");
  const produtoInfo = document.getElementById("produto");
  const campoManual = document.getElementById("codigoManual");
  const readerDiv = document.getElementById("reader");
  const formValidade = document.getElementById("formValidade");
  const validadeInput = document.getElementById("validade");
  const imagemProduto = document.getElementById("imagemProduto");

  const reader = new Html5Qrcode("reader");

  function mostrarMensagem(texto, tipo = "info") {
    status.textContent = texto;
    status.style.color = tipo === "erro" ? "red" : "green";
  }

  document.getElementById("abrirManual").addEventListener("click", () => {
    document.getElementById("manualInput").style.display = "block";
    readerDiv.style.display = "none";

    if (scannerAtivo) {
      reader.stop().catch(() => {});
      scannerAtivo = false;
    }

    document.body.style.backgroundColor = "black";
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
      iniciarScannerHtml5Qrcode();
    })
    .catch(() => {
      mostrarMensagem("Erro ao carregar produtos.", "erro");
    });

  function iniciarScannerHtml5Qrcode() {
    reader.start(
      { facingMode: { exact: "environment" } },
      {
        fps: 10,
        qrbox: { width: 250, height: 350 }
      },
      (decodedText) => {
        if (!scannerAtivo) return;
        scannerAtivo = false;

        campoManual.value = decodedText;
        buscarProduto(decodedText);
        mostrarMensagem("");
        readerDiv.style.display = "none";
        formValidade.style.display = "block";

        reader.stop().catch(() => {});
      },
      (error) => {
        // Silencia erros contínuos
      }
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
    if (!codigo) {
      mostrarMensagem("Por favor, digite um código.", "erro");
      return;
    }
    buscarProduto(codigo);
    formValidade.style.display = "block";
  };

  campoManual.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarProdutoManual();
    }
  });

  function salvarProduto(codigo, nomeProduto, validade /*, diasRestantes */) {
    mostrarMensagem("Salvando produto...");

    fetch('/api/salvar_produto_usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: codigo,
        nome: nomeProduto,
        validade: validade,
        imagem_url: ultimaImagem
        // , dias_restantes: diasRestantes // <- habilite aqui se quiser salvar
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
        scannerAtivo = true;
        iniciarScannerHtml5Qrcode(); // reinicia o scanner
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

    // 🧮 Cálculo de dias restantes
    const hoje = new Date();
    const dataValidade = new Date(validade + "T00:00:00"); // evita problemas com fuso horário
    const diffEmMs = dataValidade - hoje;
    const diasRestantes = Math.ceil(diffEmMs / (1000 * 60 * 60 * 24));

    console.log(`Faltam ${diasRestantes} dias para vencer`);

    const prodLocal = produtos[codigo];
    const nomeProduto = prodLocal
      ? montarNomeCompleto(prodLocal.nome, prodLocal.marca, prodLocal.quantidade)
      : "Desconhecido";

    salvarProduto(codigo, nomeProduto, validade /*, diasRestantes */);
  });
});

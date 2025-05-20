document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formProduto");
  const mensagem = document.getElementById("mensagem");
  const reader = new Html5Qrcode("reader");

  form.style.display = "none"; // Esconde o formulário até ler o código

  // Scanner com câmera traseira
  reader.start(
    { facingMode: { exact: "environment" } },
    {
      fps: 10,
      qrbox: { width: 250, height: 150 },
    },
    (decodedText) => {
      reader.stop().then(() => {
        document.getElementById("codigo").value = decodedText;
        mensagem.textContent = "✅ Código lido com sucesso! Agora digite o nome e clique em cadastrar.";
        form.style.display = "block";
        document.getElementById("reader").style.display = "none";
      });
    },
    (error) => {
      // Erros contínuos ignorados
    }
  ).catch((err) => {
    mensagem.textContent = "Erro ao iniciar a câmera.";
    console.error(err);
  });

  // Modo manual
  document.getElementById("abrirManual").addEventListener("click", () => {
    reader.stop().catch(() => {});
    form.style.display = "block";
    mensagem.textContent = "Digite o código manualmente e cadastre o produto.";
    document.getElementById("reader").style.display = "none";
    document.getElementById("codigo").type = "text";
  });
});

// Função para mudar cor do fundo
function body_color() {
  let body = document.body;
  let msg = document.getElementById('mensagem');
  body.style.backgroundColor = "black";
  msg.style.color = 'white';
}

// Captura de imagem com câmera traseira
let stream;

function abrirCamera() {
  const cameraContainer = document.getElementById("cameraContainer");
  const video = document.getElementById("video");

  navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { exact: "environment" }  // Força a câmera traseira
    }
  })
  .then((mediaStream) => {
    stream = mediaStream;
    video.srcObject = mediaStream;
    cameraContainer.style.display = "block";
  })
  .catch((err) => {
    alert("Erro ao acessar a câmera: " + err.message);
  });
}

function tirarFoto() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataURL = canvas.toDataURL("image/png");
  document.getElementById("image_data").value = dataURL;

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  alert("✅ Foto capturada! Agora clique em Cadastrar.");
}

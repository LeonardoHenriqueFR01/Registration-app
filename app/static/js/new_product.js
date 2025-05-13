const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const imageDataInput = document.getElementById('image_data');

// Solicita acesso à câmera (traseira em celulares)
navigator.mediaDevices.getUserMedia({
    video: {
        facingMode: { exact: "environment" }  // Tenta a câmera traseira
    }
}).then(stream => {
    video.srcObject = stream;
}).catch(err => {
    console.warn("Câmera traseira não disponível. Tentando câmera padrão...");
    // Tenta qualquer câmera disponível
    return navigator.mediaDevices.getUserMedia({ video: true });
}).then(stream => {
    if (stream) video.srcObject = stream;
}).catch(err => {
    console.error("Erro ao acessar a câmera:", err);
    alert("Erro ao acessar a câmera. Verifique as permissões.");
});

function tirarFoto() {
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    imageDataInput.value = dataUrl;

    alert('Foto Capturada!')
}

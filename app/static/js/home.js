function customConfirm(message, options, callback) {
    // Verifica e remove qualquer modal anterior
    const existing = document.querySelector(".custom-confirm-overlay");
    if (existing) existing.remove();
  
    const {
      yesText = "Sim",
      noText = "Não",
      yesColor = "#4CAF50",
      noColor = "#F44336",
      backgroundColor = "#fff",
      textColor = "#000"
    } = options;
  
    // Criação do overlay
    const overlay = document.createElement("div");
    overlay.classList.add("custom-confirm-overlay");
    Object.assign(overlay.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "9999"
    });
  
    // Criação do modal
    const box = document.createElement("div");
    Object.assign(box.style, {
      backgroundColor: backgroundColor,
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      color: textColor,
      textAlign: "center",
      minWidth: "300px"
    });
  
    const msg = document.createElement("p");
    msg.textContent = message;
    msg.style.marginBottom = "20px";
  
    // Botão "Sim"
    const btnYes = document.createElement("button");
        btnYes.textContent = yesText;
        Object.assign(btnYes.style, {
        backgroundColor: "transparent",
        color: "red",
        border: "none",
        padding: "10px 20px",
        borderRadius: "5px",
        marginRight: "10px",
        cursor: "pointer",
        fontSize: "1em"  // ⬅ Aumenta o tamanho da fonte
    });

    // Botão "Não"
    const btnNo = document.createElement("button");
        btnNo.textContent = noText;
        Object.assign(btnNo.style, {
        backgroundColor: "transparent",
        color: "#000",
        border: "none",
        padding: "10px 20px",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "1em"  // ⬅ Aumenta o tamanho da fonte
        });
  
    // Ações dos botões
    btnYes.onclick = () => {
      document.body.removeChild(overlay);
      callback(true);
    };
  
    btnNo.onclick = () => {
      document.body.removeChild(overlay);
      callback(false);
    };
  
    // Montagem
    box.appendChild(msg);
    box.appendChild(btnYes);
    box.appendChild(btnNo);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}
  
  function confirmarLogout(event, link) {
    event.preventDefault();
  
    customConfirm("Deseja mesmo sair da sessão?", {
      yesText: "Sair",
      noText: "Cancelar",
      yesColor: "#007bff",
      noColor: "#6c757d",
      backgroundColor: "#fff",
      textColor: "#000"
    }, function(confirmado) {
      if (confirmado) {
        window.location.href = link;
      }
    });
}
  
  function confirmarExclusao(event, form) {
    event.preventDefault();
  
    customConfirm("Tem certeza que deseja excluir este produto?", {
      yesText: "Excluir",
      noText: "Cancelar",
      yesColor: "#dc3545",
      noColor: "#6c757d",
      backgroundColor: "#fff",
      textColor: "#000"
    }, function(confirmado) {
      if (confirmado) {
        form.submit();
      }
    });
}
  
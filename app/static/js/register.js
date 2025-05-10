// Função para troca de fomulários
function toggleForms() {
    document.getElementById('content').classList.toggle('active');
};

// Função para chamar o botão de carregamento no formulário de login
function get_spin_login() {
    let email = document.getElementById('email_login').value.trim();
    let password = document.getElementById('password_login').value.trim();

    let btn = document.getElementById('btn_login');
    let load = document.getElementById('load_login');

    if (email.length < 12) {
        return;
    }

    if (password.length < 8) {
        return;
    }

    // Caso nenhuma das opções acima aconteça 
    btn.style.display = 'none';
    load.style.display = 'block';
};

// Função para chamar o botão de carregamento no formulário de register
function get_spin_register() {
    let name = document.getElementById('name_register').value.trim();
    let email = document.getElementById('email_register').value.trim();
    let password = document.getElementById('password_register').value.trim();

    let btn = document.getElementById('btn_register');
    let load = document.getElementById('load_register');

    if (name.length < 3) {
        return;
    }

    if (email.length < 12) {
        return;
    }

    if (password.length < 8) {
        return;
    }

    // Caso nenhuma das opções acima aconteça 
    btn.style.display = 'none';
    load.style.display = 'block';
};

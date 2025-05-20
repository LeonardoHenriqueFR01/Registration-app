from flask import render_template, request, redirect, url_for, Blueprint, session, current_app, jsonify
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, login_required, current_user
from datetime import datetime
from .models import User, Products
from . import db
from time import sleep
import os
import json
import base64

main = Blueprint('main', __name__)

# Página inicial (registro)
@main.route('/')
def index():
    return render_template('register.html')

# Rota para página principal
@main.route('/home')
@login_required
def home():
    products = Products.query.filter_by(user_id=current_user.id).all()

    caminho_json = os.path.join(current_app.root_path, 'data', 'produtos_usuario.json')

    produtos = []
    total_produtos = 0
    vencem_em_20_dias = 0
    vencem_em_10_dias = 0

    if os.path.exists(caminho_json):
        with open(caminho_json, 'r', encoding='utf-8') as f:
            produtos = json.load(f)

        hoje = datetime.today().date()
        for produto in produtos:
            validade = datetime.strptime(produto["validade"], "%Y-%m-%d").date()
            dias_restantes = (validade - hoje).days
            produto["dias_restantes"] = dias_restantes

            total_produtos += 1
            if dias_restantes <= 20:
                vencem_em_20_dias += 1
            if dias_restantes <= 10:
                vencem_em_10_dias += 1

    return render_template(
        'home.html',
        products=products,
        produtos=produtos,
        user=current_user,
        total_produtos=total_produtos,
        vencem_em_20_dias=vencem_em_20_dias,
        vencem_em_10_dias=vencem_em_10_dias
    )

# Página de bipar produto (câmera)
@main.route('/new_product')
@login_required
def new_product():
    return render_template('new_product.html')

# Página de busca de produto
@main.route('/search_product')
@login_required
def search_product():
    return render_template('search_product.html')

# Página de adicionar produto manualmente
@main.route('/add_product')
@login_required
def add_product():
    return render_template('add_product.html')

# Rota de registro de usuário
@main.route('/get_user_register', methods=['POST', 'GET'])
def get_user_register():
    if request.method == 'POST':
        name = request.form.get('name_register')
        email = request.form.get('email_register')
        password = request.form.get('password_register')

        if User.query.filter((User.name == name) | (User.email == email)).first():
            return render_template('register.html', error_register='Nome ou Email já cadastrado!')

        hash_password = generate_password_hash(password)
        user = User(name=name, email=email, password=hash_password)
        db.session.add(user)
        db.session.commit()

        login_user(user)
        sleep(1)
        return redirect(url_for('main.home'))

    return render_template('register.html')

# Rota de login de usuário
@main.route('/get_user_login', methods=['POST', 'GET'])
def get_user_login():
    if request.method == 'POST':
        email = request.form.get('email_login')
        password = request.form.get('password_login')

        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            sleep(1)
            return redirect(url_for('main.home'))

        return render_template('register.html', error_login='Dados inválidos!')

    return render_template('register.html')

# Receber novo produto via câmera
@main.route('/get_new_product', methods=['POST'])
@login_required
def get_new_product():
    image_data = request.form.get('image_data')
    codigo = request.form.get('codigo')
    nome = request.form.get('nome')

    if image_data and codigo:
        image_str = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_str)

        filename = secure_filename(f"{codigo}.png")
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

        with open(filepath, 'wb') as f:
            f.write(image_bytes)

        produto = {
            "codigo": codigo,
            "nome": nome,
            "imagem": f"uploads/{filename}"
        }

        data_dir = os.path.join(current_app.root_path, 'data')
        os.makedirs(data_dir, exist_ok=True)
        caminho_json = os.path.join(data_dir, 'produtos.json')

        try:
            with open(caminho_json, 'r', encoding='utf-8') as f:
                dados = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            dados = []

        dados.append(produto)

        with open(caminho_json, 'w', encoding='utf-8') as f:
            json.dump(dados, f, indent=4, ensure_ascii=False)

        return redirect(url_for('main.home'))

    return "Erro ao salvar produto", 400

# Adicionar produto manualmente
@main.route('/get_add_product', methods=['POST'])
@login_required
def get_add_product():
    codigo = request.form.get('codigo')
    nome = request.form.get('nome')

    if not codigo or not nome:
        return "Código e nome são obrigatórios", 400

    caminho_json = os.path.join(current_app.root_path, 'data', 'produtos.json')
    
    try:
        with open(caminho_json, 'r') as f:
            produtos = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        produtos = []

    if any(prod["codigo"] == codigo for prod in produtos):
        return render_template("add_product.html", erro="❌ Esse código de barras já está cadastrado.", codigo=codigo)

    produtos.append({"codigo": codigo, "nome": nome})

    with open(caminho_json, 'w') as f:
        json.dump(produtos, f, indent=2)

    return redirect(url_for('main.home'))

# API de produtos
@main.route('/api/produtos.json')
@login_required
def api_produtos():
    caminho_json = os.path.join(current_app.root_path, 'data', 'produtos.json')
    try:
        with open(caminho_json, 'r', encoding='utf-8') as f:
            produtos = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        produtos = []

    return jsonify(produtos)

# Salvar produto com validade do usuário
@main.route('/api/salvar_produto_usuario', methods=['POST'])
@login_required
def salvar_produto_usuario():
    CAMINHO_USUARIO = os.path.join(current_app.root_path, 'data', 'produtos_usuario.json')
    os.makedirs(os.path.dirname(CAMINHO_USUARIO), exist_ok=True)

    dados = request.get_json()
    codigo = dados.get('codigo')
    nome = dados.get('nome')
    validade = dados.get('validade')

    if not (codigo and nome and validade):
        return jsonify({'erro': 'Dados incompletos'}), 400

    try:
        with open(CAMINHO_USUARIO, 'r', encoding='utf-8') as f:
            produtos_usuario = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        produtos_usuario = []

    for p in produtos_usuario:
        if p['codigo'] == codigo:
            p['validade'] = validade
            p['imagem'] = f"static/uploads/{codigo}.png"
            break

    else:
        caminho_imagem = f"static/uploads/{codigo}.png"  

        produtos_usuario.append({
            'codigo': codigo,
            'nome': nome,
            'validade': validade,
            'imagem': caminho_imagem
        })

    with open(CAMINHO_USUARIO, 'w', encoding='utf-8') as f:
        json.dump(produtos_usuario, f, ensure_ascii=False, indent=2)

    return jsonify({'mensagem': 'Produto salvo com sucesso'})

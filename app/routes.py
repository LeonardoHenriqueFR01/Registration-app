from flask import render_template, request, redirect, url_for, Blueprint, session, current_app
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, login_required, current_user
from .models import User, Products
from . import db
from time import sleep
import os
import base64


main = Blueprint('main', __name__)

# Rota para página de registro/login
@main.route('/')
def index():
    return render_template('register.html')

# Rota para página apos fazer registro/login
@main.route('/home')
@login_required
def home():
    products = Products.query.filter_by(user_id=current_user.id).all()
    return render_template('home.html', products=products)
    
# Rota para página de cadastro de produtos
@main.route('/new_product')
@login_required
def new_product():
    return render_template('new_product.html')

# Rota para fazer registro
@main.route('/get_user_register', methods=['POST', 'GET'])
def get_user_register():
    error_message = None

    if request.method == 'POST':

        name = request.form.get('name_register')
        email = request.form.get('email_register')
        password = request.form.get('password_register')

        user_exists = User.query.filter((User.name == name) | (User.email == email)).first()

        if user_exists:
            error_message = 'Nome ou Email já cadastrado!'
            return render_template('register.html', error_register=error_message)
        else:
            hash_password = generate_password_hash(password)

            user = User(name=name, email=email, password=hash_password)

            db.session.add(user)
            db.session.commit()

            login_user(user)

            sleep(3)

            return redirect(url_for('main.home'))
    
    return render_template('register.html')

# Rota para fazer login
@main.route('/get_user_login', methods=['POST', 'GET'])
def get_user_login():
    error_message = None

    if request.method == 'POST':
        email = request.form.get('email_login')
        password = request.form.get('password_login')

        user_exists = User.query.filter_by(email=email).first()

        if user_exists and check_password_hash(user_exists.password, password):
            login_user(user_exists)

            sleep(3)

            return redirect(url_for('main.home'))
        else:
            error_message = 'Dados inválidos!'

            return render_template('register.html', error_login=error_message)
        
    return render_template('register.html')

# Rota para fazer cadastro de um novo produto
@main.route('/get_new_product', methods=['POST', 'GET'])
@login_required
def get_new_product():
    if request.method == 'POST':
        name = request.form['name']
        image_data = request.form['image_data']

        if image_data:
            # Extrair base64 da image
            image_str = image_data.split(',')[1]
            image_bytes = base64.b64decode(image_str)

            filename = secure_filename(f"{name}.png")
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

            with open(filepath, 'wb') as f:
                f.write(image_bytes)
            
            # Salvar no banco de dados
            products = Products(name=name, image_filename=filename, user_id=current_user.id)
            db.session.add(products)
            db.session.commit()
            
            return redirect(url_for('main.home'))
        
    return render_template('new_product.html')

from flask_login import UserMixin
from . import db, login_manager


login_manager.login_view = 'main.get_user_login'

class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(350), nullable=False)

    def __repr__(self):
        return f'<user {self.name}, {self.email}>'
    
    def adict(self):
        return {
            'id':self.id,
            'name':self.name,
            'email':self.email
        }

    infos = db.relationship('Products', backref='user', lazy=True)


class Products(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(150), nullable=False)
    image_filename = db.Column(db.String(150), nullable=False)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self):
        return f'<info {self.name}, {self.image_data}>'

    def asdict(self):
        return {
            'id':self.id,
            'name':self.name,
            'image_data':self.image_filename,
            'user_id':self.user_id
        }


@login_manager.user_loader
def laod_user(user_id):
    return User.query.get(int(user_id))

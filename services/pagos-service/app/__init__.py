import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)

    # DB_PATH es el directorio de datos; el fichero SQLite se construye a partir
    # de él para no confundir directorio con fichero.
    db_dir = os.environ.get('DB_PATH', '/data')
    os.makedirs(db_dir, exist_ok=True)

    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_dir}/pagos.db"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    with app.app_context():
        from app import models  # noqa: F401  (registra el modelo)
        db.create_all()

    return app

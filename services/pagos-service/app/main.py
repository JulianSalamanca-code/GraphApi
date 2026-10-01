import os
from app import create_app, db
from app.routes import api
from app.consul_client import register_service

app = create_app()
app.register_blueprint(api)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3004))
    
    # Registro en Consul
    try:
        register_service()
    except Exception as e:
        print(f'Error registrando en Consul: {e}')
    
    app.run(host='0.0.0.0', port=port, debug=False)

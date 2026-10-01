from datetime import datetime

from flask import Blueprint, jsonify, request

from app.graphql_schema import schema

api = Blueprint('api', __name__)


@api.route('/graphql', methods=['POST'])
def graphql():
    data = request.get_json(force=True) or {}
    result = schema.execute(
        data.get('query'),
        variables=data.get('variables'),
        operation_name=data.get('operationName'),
    )
    return jsonify({
        'data': result.data,
        'errors': [{'message': str(e)} for e in result.errors] if result.errors else None,
    })


@api.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'pagos-service',
        'timestamp': datetime.utcnow().isoformat(),
    })

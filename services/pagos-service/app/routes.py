from datetime import datetime
from flask import Blueprint, request, jsonify
from app.graphql_schema import schema

api = Blueprint('api', __name__)


@api.route('/graphql', methods=['POST'])
def graphql():
    data = request.get_json()
    result = schema.execute_sync(
        data.get('query'),
        variable_values=data.get('variables'),
        operation_name=data.get('operationName'),
    )
    response = {'data': result.data}
    if result.errors:
        response['errors'] = [{'message': str(e)} for e in result.errors]
    return jsonify(response)


@api.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'pagos-service',
        'timestamp': datetime.utcnow().isoformat()
    })

from flask import Blueprint, jsonify
from flask_cors import CORS
health_bp = Blueprint("health", __name__)
CORS(health_bp)


@health_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


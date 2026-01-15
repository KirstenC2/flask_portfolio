# routers/minio.py
from flask import Blueprint, request, jsonify
from utils.minio_utils import minio_client, MINIO_BUCKET_NAME
import uuid
import os
from flask_cors import CORS

minio_bp = Blueprint('minio', __name__)
CORS(minio_bp)

@minio_bp.route('/api/upload', methods=['POST'])
def upload_file():
    print(request.files)
    # 1. 檢查是否有檔案物件
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    
    # 2. 檢查使用者是否真的選了檔案
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # 生成唯一檔名
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        
        # 取得長度
        file_data = file.read()
        file_length = len(file_data)
        file.seek(0)

        # 3. 上傳至 MinIO
        minio_client.put_object(
            MINIO_BUCKET_NAME,
            unique_filename,
            file,
            length=file_length,
            content_type=file.content_type
        )

        return jsonify({
            "success": True,
            "filename": unique_filename,
            "original_name": file.filename
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
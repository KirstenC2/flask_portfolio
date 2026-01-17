# routers/minio.py
from flask import Blueprint, request, jsonify
from utils.minio_utils import minio_client, MINIO_BUCKET_NAME
from io import BytesIO
import uuid
import os
from flask_cors import CORS
from models import Resume
from urllib.parse import urlparse, urlunparse
from datetime import timedelta
from minio.error import S3Error
from models import db
import mimetypes

minio_bp = Blueprint('minio', __name__)
CORS(minio_bp)
@minio_bp.route('/api/upload/resumes', methods=['GET'])
def list_resumes():
    try:
        resumes = Resume.query.all()
        return jsonify([{
            'id': r.id,
            'title': r.title,
            'file_name': r.file_name,
            'is_active': r.is_active,
            'created_at': r.created_at.isoformat() if r.created_at else None
        } for r in resumes])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
# Update this route in minio.py
@minio_bp.route('/api/upload/resume', methods=['POST'])  # Changed from '/api/upload/<string:file_type>'
def upload_resume():  # Changed function name for clarity
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Generate unique filename
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        
        # Get file data
        file_data = file.read()
        file_length = len(file_data)
        file.seek(0)

        # Upload to MinIO
        minio_client.put_object(
            'resume',  # Fixed bucket name
            unique_filename,
            file,
            length=file_length,
            content_type=file.content_type
        )

        # Save to Resume table
        new_resume = Resume(
            title=file.filename,
            file_name=unique_filename,
            is_active=False
        )
        db.session.add(new_resume)
        db.session.commit()

        return jsonify({
            "success": True,
            "filename": unique_filename,
            "original_name": file.filename
        }), 200

    except Exception as e:
        if 'db' in locals():
            db.session.rollback()
        return jsonify({"error": str(e)}), 500

@minio_bp.route('/api/attachments/upload/<bucket>/<filename>', methods=['POST'])
def upload_attachments(bucket, filename):
    try:
        file = request.files['file']
        
        # 執行上傳到 MinIO
        minio_client.put_object(
            bucket_name=bucket,
            object_name=filename,
            data=file,
            length=-1, 
            part_size=10*1024*1024,
            content_type=file.content_type
        )
        
        # 這裡決定了回傳什麼給前端
        # 建議回傳一個完整的物件，包含 path
        return jsonify({
            "message": "Upload successful",
            "path": f"{bucket}/{filename}", # 這是路徑
            "filename": filename
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@minio_bp.route('/api/attachments/view/<bucket>/<filename>', methods=['GET'])
def get_preview_url(bucket, filename):
    try:
        # 1. 自動判斷檔案類型 (例如：.jpg -> image/jpeg, .pdf -> application/pdf)
        content_type, _ = mimetypes.guess_type(filename)
        
        # 如果猜不到類型，預設為二進位流
        if not content_type:
            content_type = 'application/octet-stream'

        # 2. 生成臨時連結
        url = minio_client.get_presigned_url(
            "GET",
            bucket,
            filename,
            expires=timedelta(minutes=10),
            response_headers={
                'response-content-disposition': 'inline', # 讓瀏覽器直接在線顯示
                'response-content-type': content_type     # 這裡改成動態變數
            }
        )
        
        return jsonify({"url": url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@minio_bp.route('/api/attachments/remove/<bucket>/<filename>', methods=['DELETE', 'OPTIONS'])
def remove_attachment(bucket, filename):
    # 處理 CORS 預檢
    if request.method == 'OPTIONS':
        return '', 204

    try:
        # 1. 先從 MinIO 刪除
        # 注意：如果你的檔案在資料夾裡，filename 必須包含路徑，例如 "uploads/abc.png"
        print(f"Attempting to remove {filename} from bucket {bucket}")
        minio_client.remove_object(bucket, filename)
        
    except S3Error as err:
        print(f"MinIO S3Error: {err}")
        return jsonify({"error": f"MinIO 刪除失敗: {err}"}), 502
    except Exception as err:
        print(f"General Error: {err}")
        return jsonify({"error": str(err)}), 500

    try:
        # 2. 再從資料庫刪除
        resume = Resume.query.filter_by(file_name=filename).first()
        if resume:
            db.session.delete(resume)
            db.session.commit()
            return jsonify({"success": True, "removed_from_db": True}), 200
        else:
            # 即使資料庫沒資料，檔案刪除了也算部分成功
            return jsonify({"success": True, "removed_from_db": False, "message": "File removed from MinIO but not found in DB"}), 200
            
    except Exception as err:
        db.session.rollback()
        return jsonify({"error": f"MinIO 檔案已刪除，但資料庫清理失敗: {err}"}), 500
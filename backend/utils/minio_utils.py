# utils/minio_utils.py
import os
from minio import Minio
from datetime import timedelta

# 配置資訊 (建議從環境變數讀取)
# MinIO configuration
MINIO_ENDPOINT = 'localhost:9000'  # Use the service name as defined in docker-compose
MINIO_ACCESS_KEY = 'minioadmin'
MINIO_SECRET_KEY = 'minioadmin'
MINIO_SECURE = False
MINIO_BUCKET_NAME = 'attachments'  # Add this line

# 初始化 Client
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

# 初始化時檢查 Bucket 是否存在
def init_minio():
    if not minio_client.bucket_exists(MINIO_BUCKET_NAME):
        minio_client.make_bucket(MINIO_BUCKET_NAME)
        # 預設可以設定為 private 以保護隱私
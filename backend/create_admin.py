#!/usr/bin/env python3
"""
Script to create the first admin account in the SQLite database.
Run this script once after setting up the application.
"""
import os
import sys
from app import app, db
from models import Admin

def create_admin_account(username, email, password):
    """Create a new admin account if none exists yet."""
    with app.app_context():
        # Check if any admin account exists
        admin_count = Admin.query.count()
        if admin_count > 0:
            print("An admin account already exists. This script is only for initial setup.")
            print(f"Total admin accounts: {admin_count}")
            return False
        
        # Create new admin account
        new_admin = Admin(username=username, email=email)
        new_admin.set_password(password)
        
        db.session.add(new_admin)
        db.session.commit()
        
        print(f"Admin account created successfully: {username} ({email})")
        return True

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python create_admin.py <username> <email> <password>")
        sys.exit(1)
    
    username = sys.argv[1]
    email = sys.argv[2]
    password = sys.argv[3]
    
    success = create_admin_account(username, email, password)
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""Check if demo user has a company assigned"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment
env_path = os.path.join(os.path.dirname(__file__), 'server', 'api', '.env')
load_dotenv(env_path)

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in environment")
    sys.exit(1)

print(f"✅ Connecting to database...")

engine = create_engine(DATABASE_URL)

# Check demo user
query = text("""
    SELECT 
        u.email, 
        u."companyId", 
        c.name as company_name,
        c.id as company_id_full
    FROM "User" u 
    LEFT JOIN "Company" c ON u."companyId" = c.id 
    WHERE u.email = 'demo@growthmonitor.ai'
""")

with engine.connect() as conn:
    result = conn.execute(query)
    row = result.fetchone()
    
    if row:
        print(f"\n📊 Demo User Info:")
        print(f"   Email: {row[0]}")
        print(f"   Company ID: {row[1]}")
        print(f"   Company Name: {row[2]}")
        
        if row[1] is None:
            print(f"\n⚠️  PROBLEM: Demo user has NO company assigned!")
            print(f"\n🔧 Fix: Assign a company to the demo user")
            
            # Check if any companies exist
            companies_query = text('SELECT id, name FROM "Company" LIMIT 5')
            companies = conn.execute(companies_query).fetchall()
            
            if companies:
                print(f"\n📋 Available companies:")
                for comp in companies:
                    print(f"   - {comp[1]} (ID: {comp[0]})")
                
                print(f"\n💡 To fix, run:")
                print(f"   python fix_demo_user_company.py")
            else:
                print(f"\n❌ No companies found in database!")
                print(f"   Need to create a company first")
        else:
            print(f"\n✅ Demo user has company assigned!")
    else:
        print(f"\n❌ Demo user not found!")

print()

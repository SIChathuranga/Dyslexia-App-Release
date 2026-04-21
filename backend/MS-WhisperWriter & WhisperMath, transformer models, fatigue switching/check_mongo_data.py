"""Check what's actually in MongoDB collections."""
import os, sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

from pymongo import MongoClient

uri = os.getenv('MONGODB_URI')
db_name = os.getenv('MONGODB_DB_NAME', 'dyslearn')

client = MongoClient(uri, serverSelectionTimeoutMS=10000)
db = client[db_name]

print("=== Collections ===")
for coll_name in db.list_collection_names():
    count = db[coll_name].count_documents({})
    print(f"  {coll_name}: {count} documents")
    
    # Show sample document
    if count > 0:
        sample = db[coll_name].find_one({}, {'_id': 0})
        print(f"    Sample: {sample}")
        
        # Show distinct patientIds
        patient_ids = db[coll_name].distinct('patientId')
        print(f"    Patient IDs: {patient_ids}")

print("\n=== Done ===")

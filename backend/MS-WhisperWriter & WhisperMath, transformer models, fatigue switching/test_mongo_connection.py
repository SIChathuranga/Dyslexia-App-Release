"""Quick diagnostic script to test MongoDB connection and data insertion."""
import os
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

uri = os.getenv('MONGODB_URI')
db_name = os.getenv('MONGODB_DB_NAME', 'dyslearn')
print(f'URI found: {bool(uri)}')
print(f'URI starts with: {uri[:40] if uri else "NONE"}...')
print(f'DB name: {db_name}')

try:
    from pymongo import MongoClient
    import pymongo
    print(f'pymongo version: {pymongo.version}')

    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    client.admin.command('ping')
    print('Ping OK - Connection successful')

    db = client[db_name]
    collections = db.list_collection_names()
    print(f'Collections: {collections}')

    # Try inserting a test document
    test_doc = {'test': True, 'source': 'debug_check', 'patientId': 'test_patient'}
    result = db.attempts.insert_one(test_doc)
    print(f'Test insert OK - ID: {result.inserted_id}')

    # Verify it was inserted
    found = db.attempts.find_one({'_id': result.inserted_id})
    print(f'Verification read OK: {found is not None}')

    # Clean up
    db.attempts.delete_one({'_id': result.inserted_id})
    print('Test document cleaned up')
    print('\n=== MongoDB connection and write operations are WORKING ===')

except Exception as e:
    print(f'ERROR: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()

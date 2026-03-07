import sys
sys.stdout = open('out2.txt', 'w', encoding='utf-8')
sys.stderr = sys.stdout

import traceback
try:
    from app.routers.ai_advisory import router
    print("Success")
except Exception as e:
    traceback.print_exc()

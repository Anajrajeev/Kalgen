import re

def _clean_text(text):
    # Remove extra quotes and special characters
    cleaned = re.sub(r'["\']', '', text)
    cleaned = re.sub(r'[^\w\s\.\,\-\(\)]', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    cleaned = re.sub(r'\.+', '.', cleaned)
    cleaned = re.sub(r'\,+', ',', cleaned)
    return cleaned

test_text = '"Fasal Bima Yojana (PMFBY) is a government insurance scheme that provides financial support to farmers if their crops fail due to natural disasters, pests, or diseases. It aims to help farmers stabilize their income and continue farming."'
cleaned = _clean_text(test_text)
print('Original:', test_text)
print('Cleaned: ', cleaned)

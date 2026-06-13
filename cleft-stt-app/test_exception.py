from google.api_core import exceptions

try:
    raise exceptions.ResourceExhausted("Quota exceeded.")
except Exception as e:
    print(f"Type: {type(e)}")
    print(f"Has code: {hasattr(e, 'code')}")
    print(f"Code value: {getattr(e, 'code', 'N/A')}")
    if hasattr(e, 'code'):
        print(f"Code type: {type(e.code)}")
    print(f"Has status_code: {hasattr(e, 'status_code')}")
    print(f"status_code value: {getattr(e, 'status_code', 'N/A')}")
    print(f"String representation: {str(e)}")

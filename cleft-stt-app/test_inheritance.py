from google.api_core import exceptions
from google.api_core.exceptions import GoogleAPIError

r = exceptions.ResourceExhausted("Quota exceeded.")
print(f"Is GoogleAPIError? {isinstance(r, GoogleAPIError)}")

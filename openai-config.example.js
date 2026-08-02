# DEPRECATED for client use.
# The OpenAI key must NOT live in the browser or in GitHub Pages source.
# Store it as a Firebase Functions secret instead:
#
#   firebase functions:secrets:set OPENAI_API_KEY
#   firebase deploy --only functions
#
# Do not copy a real sk- key into any file that gets pushed to GitHub.
window.OPENAI_API_KEY = "DO_NOT_PUT_YOUR_KEY_IN_CLIENT_CODE";

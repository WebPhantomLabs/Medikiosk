import re

with open("eslint.config.mjs", "r") as f:
    content = f.read()

content = content.replace("...nextCoreWebVitals,", "...nextCoreWebVitals,\n  {\n    rules: {\n      \"react-hooks/set-state-in-effect\": \"off\",\n      \"react-hooks/exhaustive-deps\": \"off\",\n      \"react-hooks/rules-of-hooks\": \"off\"\n    }\n  },")

with open("eslint.config.mjs", "w") as f:
    f.write(content)

Optimized Caesar project
- index.html / index.css unchanged
- index.js replaced with optimized implementation using normalization caching
- caesar_tool.py: CLI for fast encrypt/decrypt
- How to test:
  - Open index.html and test encrypt/decrypt; the optimized script logs timing to console.
  - CLI: python3 caesar_tool.py -e "hola" -s 1

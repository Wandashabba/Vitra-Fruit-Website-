import os
import glob

html_files = glob.glob('/Users/wandileshabangu/Vitra Fruit Website/Vitra-Fruit-Website-/vitra-fruit-react/public/*.html')
fixed_files = []

for f in html_files:
    with open(f, 'r') as file:
        content = file.read()
    
    original = content
    # Fix the oversized 3rem heading in product pages
    if '.product-info h1 { font-size: 3rem; }' in content:
        content = content.replace('.product-info h1 { font-size: 3rem; }', '.product-info h1 { font-size: 2.1rem; line-height: 1.1; margin-bottom: 15px; }')
        
    if content != original:
        with open(f, 'w') as file:
            file.write(content)
        fixed_files.append(os.path.basename(f))

print("Fixed mobile headings in:", fixed_files)

#!/usr/bin/env python3
"""Change the website address everywhere (canonical, share tags, sitemap, robots, schema).
Usage:  python3 set_url.py https://your-site-address.com
"""
import re, sys
from pathlib import Path

if len(sys.argv) != 2 or not sys.argv[1].startswith("http"):
    sys.exit("Usage: python3 set_url.py https://your-site-address.com")
new = sys.argv[1].rstrip("/")
here = Path(__file__).parent
html = (here / "index.html").read_text(encoding="utf-8")
m = re.search(r'<link rel="canonical" href="([^"]+?)/?">', html)
if not m:
    sys.exit("Could not find the current address in index.html")
old = m.group(1).rstrip("/")
for name in ("index.html", "robots.txt", "sitemap.xml"):
    f = here / name
    t = f.read_text(encoding="utf-8")
    f.write_text(t.replace(old, new), encoding="utf-8")
    print("updated", name)
print(old, "->", new)

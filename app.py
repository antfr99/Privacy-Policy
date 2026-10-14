"""Streamlit copy of the privacy policies, for a host other than GitHub Pages.

It shows the same pages GitHub Pages serves (built by scripts/build.mjs from each app's About text). Pick a page with
?page=my-investments, my-entertainment, our-timeline or delete-account. The Delete-an-account form needs JavaScript in
the page itself, so here it links to the GitHub Pages copy and explains the email route.
"""
from pathlib import Path
import re

import streamlit as st

ROOT = Path(__file__).parent
PAGES = {
    "index": "All apps",
    "my-investments": "My Investments",
    "my-entertainment": "My Entertainment",
    "our-timeline": "Our Timeline",
    "delete-account": "Delete your account",
}
PAGES_URL = "https://mythoughtsaime.github.io/Privacy-Policy/"

st.set_page_config(page_title="Privacy policies", page_icon="🔒", layout="centered")

key = st.query_params.get("page", "index")
key = key if key in PAGES else "index"
choice = st.radio("Page", list(PAGES), index=list(PAGES).index(key), format_func=PAGES.get, horizontal=True,
                  label_visibility="collapsed")
if choice != key:
    st.query_params["page"] = choice

html = (ROOT / f"{choice}.html").read_text(encoding="utf-8")
body = re.search(r"<main>(.*)</main>", html, re.S).group(1)
body = re.sub(r"<script.*?</script>", "", body, flags=re.S)
body = re.sub(r'href="([\w-]+)\.html"', r'href="?page=\1" target="_self"', body)
if choice == "delete-account":
    body = re.sub(r"<form.*?</form>", "", body, flags=re.S)
    body = body.replace('<p id="status" class="status" role="status" aria-live="polite"></p>',
                        f'<p><a href="{PAGES_URL}delete-account.html">Open the deletion form</a> (it needs a full web page).</p>')
st.html(f"<style>{(ROOT / 'assets/style.css').read_text(encoding='utf-8')}</style><main>{body}</main>")

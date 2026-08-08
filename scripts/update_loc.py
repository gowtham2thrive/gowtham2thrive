import os
import re
import time
import requests

USERNAME = os.environ.get("GITHUB_ACTOR", "gowtham2thrive")
TOKEN = os.environ.get("GITHUB_TOKEN")

if not TOKEN:
    print("Warning: No GITHUB_TOKEN provided. API limits will be restricted.")

headers = {
    "Accept": "application/vnd.github.v3+json"
}
if TOKEN:
    headers["Authorization"] = f"Bearer {TOKEN}"

def get_public_repos(username):
    repos = []
    page = 1
    while True:
        url = f"https://api.github.com/users/{username}/repos?per_page=100&page={page}"
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Error fetching repos: {response.status_code} - {response.text}")
            exit(1)
        
        data = response.json()
        if not data:
            break
            
        for repo in data:
            # We skip forks to only count original work
            if not repo.get('fork', False):
                repos.append(repo['name'])
        page += 1
    return repos

def get_loc_for_repo(username, repo_name):
    url = f"https://api.github.com/repos/{username}/{repo_name}/stats/contributors"
    
    # Retry logic for 202 Accepted
    for attempt in range(10):
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            added = 0
            deleted = 0
            
            if isinstance(data, list):
                for contributor in data:
                    author = contributor.get('author')
                    if author and author.get('login', '').lower() == username.lower():
                        for week in contributor.get('weeks', []):
                            added += week.get('a', 0)
                            deleted += week.get('d', 0)
            return added, deleted
            
        elif response.status_code == 202:
            print(f"202 Accepted for {repo_name}. Waiting...")
            time.sleep(3)
        elif response.status_code == 204:
            # 204 No Content means empty repository
            return 0, 0
        else:
            print(f"Error for {repo_name}: {response.status_code} - {response.text}")
            exit(1)
            
    print(f"Timeout waiting for stats for {repo_name}")
    exit(1)

def format_number(num):
    if num >= 1000000:
        return f"{num/1000000:.1f}M"
    if num >= 1000:
        return f"{num/1000:.1f}k"
    return str(num)

def main():
    print(f"Fetching public repositories for {USERNAME}...")
    repos = get_public_repos(USERNAME)
    print(f"Found {len(repos)} original public repositories.")
    
    total_added = 0
    total_deleted = 0
    
    for repo in repos:
        print(f"Fetching stats for {repo}...")
        added, deleted = get_loc_for_repo(USERNAME, repo)
        total_added += added
        total_deleted += deleted
        
    print(f"Total Added: {total_added}")
    print(f"Total Deleted: {total_deleted}")
    
    added_str = format_number(total_added)
    deleted_str = format_number(total_deleted)
    
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="20" viewBox="0 0 320 20">
    <g font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="14" font-weight="bold">
        <text x="0" y="15" fill="#2ea043">++ {added_str} Added</text>
        <text x="150" y="15" fill="#58A6FF">|</text>
        <text x="165" y="15" fill="#f85149">-- {deleted_str} Deleted</text>
    </g>
</svg>'''

    with open("loc_badge.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)
    
    # Read the README
    with open("README.md", "r", encoding="utf-8") as f:
        readme = f.read()
        
    # Replace the badge
    pattern = r'<!-- loc-badge-start -->.*?<!-- loc-badge-end -->'
    replacement = f'<!-- loc-badge-start -->\n  <a href="#"><img src="loc_badge.svg" alt="Lines of Code" /></a>\n  <!-- loc-badge-end -->'
    
    new_readme = re.sub(pattern, replacement, readme, flags=re.DOTALL)
    
    with open("README.md", "w", encoding="utf-8") as f:
        f.write(new_readme)
        
    print("README.md has been updated.")

if __name__ == "__main__":
    main()

"""
Eduverse - Git Commit + Remote Deploy Script
Server: 72.62.27.196
"""
import subprocess
import sys
import paramiko
import os

# ─── Config ──────────────────────────────────────────────
SERVER_HOST = "72.62.27.196"
SERVER_PORT = 22
SERVER_USER = "root"
# Password will be read from env or prompted
SERVER_PASS = os.environ.get("DEPLOY_PASSWORD", "")

APP_DIR = "/root/eduverse"
DEPLOY_CMD = f"cd {APP_DIR} && bash deploy.sh 2>&1"

# ─── Step 1: Git commit & push locally ───────────────────
def git_commit_push():
    project_root = os.path.dirname(os.path.abspath(__file__))

    print("=" * 55)
    print("  STEP 1: Git Commit & Push")
    print("=" * 55)

    # Stage all changes
    result = subprocess.run(
        ["git", "add", "-A"],
        cwd=project_root,
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"[ERROR] git add failed:\n{result.stderr}")
        sys.exit(1)
    print("[OK] git add -A")

    # Check if there's anything to commit
    status = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=project_root,
        capture_output=True, text=True
    )

    if not status.stdout.strip():
        print("[INFO] Nothing to commit, working tree is clean.")
    else:
        result = subprocess.run(
            ["git", "commit", "-m",
             "fix: raise product limit to 500 (show Tea), add Indomy varieties, add indomy-addons category UI"],
            cwd=project_root,
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"[ERROR] git commit failed:\n{result.stderr}")
            sys.exit(1)
        print(f"[OK] git commit done")
        print(result.stdout.strip())

    # Push
    result = subprocess.run(
        ["git", "push"],
        cwd=project_root,
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"[ERROR] git push failed:\n{result.stderr}")
        sys.exit(1)
    print("[OK] git push done")
    print(result.stdout.strip() or result.stderr.strip())

# ─── Step 2: SSH deploy on server ────────────────────────
def ssh_deploy(password: str):
    print("\n" + "=" * 55)
    print("  STEP 2: SSH Deploy on Server")
    print("=" * 55)
    print(f"  Connecting to {SERVER_USER}@{SERVER_HOST}...")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(
            SERVER_HOST,
            port=SERVER_PORT,
            username=SERVER_USER,
            password=password,
            timeout=30,
        )
        print(f"[OK] SSH connected to {SERVER_HOST}")

        print(f"\n[RUN] {DEPLOY_CMD}\n")
        stdin, stdout, stderr = client.exec_command(DEPLOY_CMD, get_pty=True, timeout=600)

        # Stream output
        for line in iter(stdout.readline, ""):
            print(line, end="", flush=True)

        exit_code = stdout.channel.recv_exit_status()
        print(f"\n[EXIT CODE] {exit_code}")

        if exit_code != 0:
            err = stderr.read().decode()
            if err:
                print(f"[STDERR]\n{err}")
            print("\n[FAIL] Deploy script returned non-zero exit code.")
            sys.exit(1)

        print("\n[OK] Deploy completed successfully!")

    except Exception as e:
        print(f"[ERROR] SSH failed: {e}")
        sys.exit(1)
    finally:
        client.close()


# ─── Main ────────────────────────────────────────────────
if __name__ == "__main__":
    git_commit_push()

    password = SERVER_PASS
    if not password:
        import getpass
        password = getpass.getpass(f"\nEnter SSH password for {SERVER_USER}@{SERVER_HOST}: ")

    ssh_deploy(password)
    print("\n✅ All done! Site is live at https://edu-vers.com")

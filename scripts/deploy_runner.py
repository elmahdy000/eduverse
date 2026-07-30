"""Safely commit selected Eduverse files, push them, and deploy over SSH."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import shlex
import subprocess
import sys

import paramiko


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PATHS = [
    "backend",
    "frontend",
    "owner-portal",
    "deploy.sh",
    "docker-compose.yml",
    ".gitattributes",
    "compose.env.example",
    "ecosystem.config.js",
    "requirements-deploy.txt",
    "scripts",
    "README.md",
    "PROJECT_REPORT.md",
]


def run_git(
    *args: str, capture: bool = False, check: bool = True
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=PROJECT_ROOT,
        check=check,
        text=True,
        capture_output=capture,
    )


def commit_and_push(message: str, paths: list[str], branch: str | None) -> str:
    invalid = [path for path in paths if path.startswith(".claude")]
    if invalid:
        raise ValueError("Refusing to stage .claude worktrees")

    run_git("add", "--", *paths)
    staged = run_git("diff", "--cached", "--quiet", capture=True, check=False)
    if staged.returncode != 0:
        run_git("commit", "-m", message)

    current_branch = run_git("branch", "--show-current", capture=True).stdout.strip()
    target_branch = branch or current_branch
    if target_branch != current_branch:
        raise ValueError(
            f"Current branch is {current_branch!r}, not requested branch {target_branch!r}"
        )
    run_git("push", "--set-upstream", "origin", target_branch)
    return target_branch


def deploy(branch: str) -> None:
    host = os.environ.get("DEPLOY_HOST")
    user = os.environ.get("DEPLOY_USER", "deploy")
    port = int(os.environ.get("DEPLOY_PORT", "22"))
    app_dir = os.environ.get("DEPLOY_APP_DIR", "/srv/eduverse")
    key_path = Path(
        os.environ.get("DEPLOY_SSH_KEY", str(Path.home() / ".ssh" / "id_ed25519"))
    ).expanduser()

    if not host:
        raise RuntimeError("DEPLOY_HOST is required")
    if not key_path.is_file():
        raise RuntimeError(f"SSH private key not found: {key_path}")

    client = paramiko.SSHClient()
    client.load_system_host_keys()
    client.set_missing_host_key_policy(paramiko.RejectPolicy())
    client.connect(
        hostname=host,
        port=port,
        username=user,
        key_filename=str(key_path),
        look_for_keys=False,
        allow_agent=True,
        timeout=30,
    )
    try:
        command = (
            f"cd {shlex.quote(app_dir)} && "
            f"APP_DIR={shlex.quote(app_dir)} "
            f"DEPLOY_BRANCH={shlex.quote(branch)} bash deploy.sh"
        )
        _, stdout, stderr = client.exec_command(command, get_pty=True, timeout=1800)
        for line in iter(stdout.readline, ""):
            print(line, end="", flush=True)
        exit_code = stdout.channel.recv_exit_status()
        error_output = stderr.read().decode("utf-8", errors="replace")
        if exit_code != 0:
            raise RuntimeError(error_output or f"Deploy failed with exit code {exit_code}")
    finally:
        client.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--message", required=True, help="Commit message")
    parser.add_argument("--path", action="append", dest="paths")
    parser.add_argument("--branch")
    parser.add_argument("--push-only", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        branch = commit_and_push(args.message, args.paths or DEFAULT_PATHS, args.branch)
        if not args.push_only:
            deploy(branch)
        return 0
    except (subprocess.CalledProcessError, RuntimeError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

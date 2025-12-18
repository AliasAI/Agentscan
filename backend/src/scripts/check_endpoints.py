#!/usr/bin/env python3
"""
Endpoint Health Check Script

Scans all registered agents for working endpoints and generates a report.
Can output to console, JSON file, or markdown format.

Usage:
    python -m src.scripts.check_endpoints [options]

Options:
    --network NETWORK    Filter by network (e.g., sepolia, base-sepolia)
    --output FORMAT      Output format: console, json, markdown (default: console)
    --file PATH          Output file path (for json/markdown)
    --limit N            Limit number of agents to check
    --only-working       Only show agents with working endpoints

Examples:
    # Check all agents, console output
    uv run python -m src.scripts.check_endpoints

    # Check sepolia agents, save as JSON
    uv run python -m src.scripts.check_endpoints --network sepolia --output json --file report.json

    # Generate markdown report
    uv run python -m src.scripts.check_endpoints --output markdown --file report.md
"""

import asyncio
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dotenv import load_dotenv

load_dotenv()

from src.services.endpoint_health_service import EndpointHealthService
from src.db.database import SessionLocal


def print_console_report(result: dict, only_working: bool = False) -> None:
    """Print formatted report to console"""
    summary = result["summary"]

    print("\n" + "=" * 60)
    print("🔍 ENDPOINT HEALTH CHECK REPORT")
    print("=" * 60)
    print(f"Generated at: {result['generated_at']}")
    print()

    # Summary statistics
    print("📊 SUMMARY")
    print("-" * 40)
    print(f"  Total Agents:              {summary['total_agents']:>6}")
    print(f"  Agents with Endpoints:     {summary['agents_with_endpoints']:>6}")
    print(f"  Agents with Working EP:    {summary['agents_with_working_endpoints']:>6}")
    print(f"  Agents with Feedbacks:     {summary['agents_with_feedbacks']:>6}")
    print(f"  Total Endpoints:           {summary['total_endpoints']:>6}")
    print(f"  Healthy Endpoints:         {summary['healthy_endpoints']:>6}")
    print(f"  Health Rate:               {summary['endpoint_health_rate']:>5.1f}%")
    print()

    # Working agents
    working = result["working_agents"]
    if working:
        print(f"✅ AGENTS WITH WORKING ENDPOINTS ({len(working)})")
        print("-" * 60)

        for i, agent in enumerate(working, 1):
            status_icon = "🟢" if agent["has_working_endpoints"] else "🔴"
            print(f"\n{i}. {status_icon} {agent['agent_name']}")
            print(f"   ID: {agent['agent_id']}")
            print(f"   Network: {agent['network_key']} | Token: #{agent['token_id']}")
            print(
                f"   Endpoints: {agent['healthy_endpoints']}/{agent['total_endpoints']} working"
            )
            print(
                f"   Reputation: {agent['reputation_score']:.1f} ({agent['reputation_count']} feedbacks)"
            )

            # Show endpoints
            if agent["endpoints"]:
                for ep in agent["endpoints"]:
                    ep_status = "✓" if ep["is_healthy"] else "✗"
                    response_time = (
                        f"{ep['response_time_ms']:.0f}ms"
                        if ep["response_time_ms"]
                        else "-"
                    )
                    status_code = ep["status_code"] or "-"
                    print(f"      [{ep_status}] {ep['url'][:60]}")
                    print(f"          Status: {status_code} | Time: {response_time}")
                    if ep["error"]:
                        print(f"          Error: {ep['error']}")

            # Show recent feedbacks
            if agent["recent_feedbacks"]:
                print(f"   Recent Feedbacks:")
                for fb in agent["recent_feedbacks"][:3]:
                    client = fb.get("client_address", "")[:10] + "..."
                    score = fb.get("score", "-")
                    print(f"      - Score: {score} from {client}")

    # Show all reports if not only_working
    if not only_working:
        all_reports = result["all_reports"]
        no_endpoints = [r for r in all_reports if r["total_endpoints"] == 0]
        broken = [
            r
            for r in all_reports
            if r["total_endpoints"] > 0 and not r["has_working_endpoints"]
        ]

        if broken:
            print(f"\n❌ AGENTS WITH BROKEN ENDPOINTS ({len(broken)})")
            print("-" * 60)
            for agent in broken[:10]:
                print(f"  - {agent['agent_name']} ({agent['network_key']})")
                for ep in agent["endpoints"]:
                    print(f"      {ep['url'][:50]}: {ep['error'] or 'No response'}")

        print(f"\n📭 Agents without endpoints: {len(no_endpoints)}")

    print("\n" + "=" * 60)


def generate_json_report(result: dict, file_path: str) -> None:
    """Save report as JSON file"""
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False, default=str)
    print(f"✅ JSON report saved to: {file_path}")


def generate_markdown_report(result: dict, file_path: str) -> None:
    """Generate markdown report"""
    summary = result["summary"]
    working = result["working_agents"]

    lines = [
        "# Endpoint Health Check Report",
        "",
        f"**Generated:** {result['generated_at']}",
        "",
        "## Summary",
        "",
        "| Metric | Value |",
        "|--------|-------|",
        f"| Total Agents | {summary['total_agents']} |",
        f"| Agents with Endpoints | {summary['agents_with_endpoints']} |",
        f"| Agents with Working Endpoints | {summary['agents_with_working_endpoints']} |",
        f"| Agents with Feedbacks | {summary['agents_with_feedbacks']} |",
        f"| Total Endpoints | {summary['total_endpoints']} |",
        f"| Healthy Endpoints | {summary['healthy_endpoints']} |",
        f"| Health Rate | {summary['endpoint_health_rate']:.1f}% |",
        "",
        "## Agents with Working Endpoints",
        "",
    ]

    if working:
        for agent in working:
            lines.append(f"### {agent['agent_name']}")
            lines.append("")
            lines.append(
                f"- **Network:** {agent['network_key']} | **Token:** #{agent['token_id']}"
            )
            lines.append(
                f"- **Endpoints:** {agent['healthy_endpoints']}/{agent['total_endpoints']} working"
            )
            lines.append(
                f"- **Reputation:** {agent['reputation_score']:.1f} ({agent['reputation_count']} feedbacks)"
            )
            lines.append("")

            if agent["endpoints"]:
                lines.append("**Endpoints:**")
                lines.append("")
                lines.append("| URL | Status | Response Time |")
                lines.append("|-----|--------|---------------|")
                for ep in agent["endpoints"]:
                    status = "✅" if ep["is_healthy"] else "❌"
                    code = ep["status_code"] or "-"
                    time = (
                        f"{ep['response_time_ms']:.0f}ms"
                        if ep["response_time_ms"]
                        else "-"
                    )
                    url = ep["url"][:50] + "..." if len(ep["url"]) > 50 else ep["url"]
                    lines.append(f"| {url} | {status} {code} | {time} |")
                lines.append("")

            if agent["recent_feedbacks"]:
                lines.append("**Recent Feedbacks:**")
                lines.append("")
                for fb in agent["recent_feedbacks"][:3]:
                    client = fb.get("client_address", "unknown")[:10]
                    score = fb.get("score", "-")
                    lines.append(f"- Score **{score}** from `{client}...`")
                lines.append("")

    else:
        lines.append("*No agents with working endpoints found.*")
        lines.append("")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"✅ Markdown report saved to: {file_path}")


async def main():
    parser = argparse.ArgumentParser(
        description="Check endpoint health for registered agents"
    )
    parser.add_argument("--network", help="Filter by network key")
    parser.add_argument(
        "--output",
        choices=["console", "json", "markdown"],
        default="console",
        help="Output format",
    )
    parser.add_argument("--file", help="Output file path")
    parser.add_argument("--limit", type=int, help="Limit number of agents")
    parser.add_argument(
        "--only-working",
        action="store_true",
        help="Only show agents with working endpoints",
    )

    args = parser.parse_args()

    # Validate arguments
    if args.output in ["json", "markdown"] and not args.file:
        print(f"Error: --file is required for {args.output} output")
        sys.exit(1)

    print("🔍 Starting endpoint health check...")
    print(f"   Network filter: {args.network or 'all'}")
    print(f"   Limit: {args.limit or 'none'}")
    print()

    # Run health check
    service = EndpointHealthService()

    if args.limit:
        # Use check_all_agents with limit for limited scan
        reports = await service.check_all_agents(
            network_key=args.network,
            only_with_endpoints=args.only_working,
            include_feedbacks=True,
            limit=args.limit,
        )

        # Build result manually
        working = [r for r in reports if r.has_working_endpoints]
        result = {
            "summary": {
                "total_agents": len(reports),
                "agents_with_endpoints": sum(1 for r in reports if r.total_endpoints > 0),
                "agents_with_working_endpoints": len(working),
                "agents_with_feedbacks": sum(
                    1 for r in reports if r.reputation_count > 0
                ),
                "total_endpoints": sum(r.total_endpoints for r in reports),
                "healthy_endpoints": sum(r.healthy_endpoints for r in reports),
                "endpoint_health_rate": (
                    round(
                        sum(r.healthy_endpoints for r in reports)
                        / sum(r.total_endpoints for r in reports)
                        * 100,
                        1,
                    )
                    if sum(r.total_endpoints for r in reports) > 0
                    else 0
                ),
            },
            "working_agents": [r.to_dict() for r in working[:20]],
            "all_reports": [r.to_dict() for r in reports],
            "generated_at": datetime.utcnow().isoformat(),
        }
    else:
        result = await service.generate_summary_report(network_key=args.network)

    # Output
    if args.output == "console":
        print_console_report(result, args.only_working)
    elif args.output == "json":
        generate_json_report(result, args.file)
    elif args.output == "markdown":
        generate_markdown_report(result, args.file)


if __name__ == "__main__":
    asyncio.run(main())

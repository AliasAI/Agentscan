# Security Incident Response Guide

## Incident Summary

**Date**: 2025-12-06
**Type**: Remote Code Execution (RCE) via Next.js vulnerability
**Severity**: Critical
**CVE/Advisory**: GHSA-9qr9-h5gf-34mp

## Root Cause

Next.js version 16.0.1 contained a critical RCE vulnerability in the React Flight Protocol. Attackers exploited this to execute arbitrary commands on the server.

## Observed Attack Patterns

```
ping -c 1 45.157.233.80     # C2 server connectivity check
/tmp/s.sh                    # Malicious script execution
busybox                      # Lightweight toolkit for payload
x86                          # Binary payload (likely cryptominer)
```

## Resolution Steps

### Step 1: Update Dependencies (Already Done)

```bash
cd frontend
npm audit fix --force
```

**Result**: next upgraded from 16.0.1 → 16.0.7

### Step 2: Deploy to Server

```bash
# Push changes
git add -A
git commit -m "fix: upgrade next.js to fix critical RCE vulnerability"
git push origin master

# SSH to server
ssh your-server

# Navigate to project
cd /path/to/agentscan

# Pull and rebuild
git pull origin master
./scripts/security-rebuild.sh
```

### Step 3: Server Cleanup (Important!)

Even after rebuilding containers, the host system may be compromised. Run these checks:

```bash
# 1. Check for suspicious cron jobs
crontab -l
cat /etc/crontab
ls -la /etc/cron.d/

# 2. Check for suspicious processes
ps aux | grep -E "mine|crypto|x86|busybox"
top -b -n 1 | head -20

# 3. Check for suspicious network connections
netstat -tulpn | grep ESTABLISHED
ss -tulpn

# 4. Check /tmp for malicious files
ls -la /tmp/
rm -f /tmp/s.sh /tmp/x86 2>/dev/null

# 5. Check for unauthorized SSH keys
cat ~/.ssh/authorized_keys

# 6. Check system logs for suspicious activity
grep -i "45.157.233" /var/log/syslog 2>/dev/null
journalctl --since "24 hours ago" | grep -i "ssh\|login"
```

### Step 4: Additional Security Measures

1. **Change all passwords and keys**
   - SSH keys
   - Database passwords
   - API keys

2. **Update firewall rules**
   ```bash
   # Block known malicious IP
   iptables -A INPUT -s 45.157.233.80 -j DROP
   iptables -A OUTPUT -d 45.157.233.80 -j DROP
   ```

3. **Enable automatic security updates**
   ```bash
   # Ubuntu/Debian
   apt install unattended-upgrades
   dpkg-reconfigure unattended-upgrades
   ```

4. **Set up monitoring**
   - Consider using fail2ban
   - Set up log monitoring alerts
   - Regular npm audit checks

## Prevention

1. **Regular dependency audits**
   ```bash
   # Add to CI/CD pipeline
   npm audit --audit-level=high
   ```

2. **Pin dependency versions** in production

3. **Use security scanning tools**
   - Snyk
   - Dependabot
   - npm audit

4. **Container security**
   - Run as non-root user
   - Read-only filesystem where possible
   - Network policies

## Timeline

| Time | Event |
|------|-------|
| 2025-12-06 | Suspicious logs detected |
| 2025-12-06 | Root cause identified (Next.js RCE) |
| 2025-12-06 | Vulnerability patched (16.0.1 → 16.0.7) |
| TBD | Server cleanup completed |
| TBD | Post-incident review |

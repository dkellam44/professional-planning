# DNS & Tunnel Setup for `bestviable.com`  
_Last updated: 2025-10-19  
Maintainer: `dkellam44@gmail.com`  
Repository/Folder: `infra/docs/dns-setup.md`

---

## 1. Overview  
**Domain:** `bestviable.com`  
**Registrar:** Namecheap  
**DNS Provider:** Cloudflare  
**Primary Purpose:**  
- Subdomain `tools.bestviable.com` → Agent/control-plane (MCP Gateway + tooling) via Cloudflare Tunnel  
- Subdomain `app.bestviable.com` → Future app-stack via same or new Tunnel  
- Root domain `bestviable.com` → Website hosting on DigitalOcean droplet  
- MX record for email routing via `mx1.bestviable.com`

---

## 2. Nameserver Delegation  
| Field | Value |
|-------|-------|
| Original Registrar Nameservers | `<ns1.namecheap.com>, <ns2.namecheap.com>` (pre-migration) |
| Cloudflare Assigned Nameservers | `jacob.ns.cloudflare.com., luciana.ns.cloudflare.com., <ns3.cloudflare.com>` |
| Effective Date of Change | 2025-10-19 |
| Propagation Verified | ☑ / ☐ |

---

## 3. DNS Zone Records  
Below is the list of DNS records configured in Cloudflare for the domain.

| Name                  | Type   | Value / Target                                | TTL    | Proxy Status     | Notes                                  |
|-----------------------|--------|-----------------------------------------------|--------|------------------|----------------------------------------|
| `@` (root)            | A      | `159.65.97.146`                                | Auto   | Proxied / DNS only | Website hosting on DO droplet         |
| `www`                 | CNAME  | `bestviable.com`                               | Auto   | Proxied / DNS only | `www` alias of root                    |
| `tools`               | CNAME  | `a7c76f09-dbff-4459-b8bc-cfa4c80dd3da.cfargotunnel.com`               | Auto   | DNS only (tunnel) | Agent/control plane via Cloudflare Tunnel |
| `app`                 | CNAME  | `<Tunnel-UUID>.cfargotunnel.com`               | Auto   | DNS only (tunnel) | Future application endpoint            |
| `bestviable.com`      | MX     | `mx1.bestviable.com` (priority 0)              | Auto   | —                | Email routing                          |
| [Optional] SPF/DKIM/DMARC | TXT | `<value>`                                     | Auto   | —                | Email authentication records            |

---

## 4. Cloudflare Tunnel Configuration  
| Field                     | Value                                              |
|---------------------------|----------------------------------------------------|
| Tunnel Name               | `tools`                                  |
| Tunnel UUID               | `0b740788-5e7e-4cef-a2eb-4e00062dac46`                          |
| Credentials File Path     | `/root/.cloudflared/0b740788-5e7e-4cef-a2eb-4e00062dac46.json`                   |
| Ingress Configuration     | ```yaml                                            |  
|                           | tunnel: 0b740788-5e7e-4cef-a2eb-4e00062dac46                                     |
|                           | credentials-file: /root/.cloudflared/0b740788-5e7e-4cef-a2eb-4e00062dac46.json   |
|                           | ingress:                                           |
|                           |   - hostname: tools.bestviable.com                 |
|                           |     service: http://localhost:8080                 |
|                           |   - hostname: app.bestviable.com                   |
|                           |     service: http://localhost:8090                 |
|                           |   - hostname: bestviable.com                        |
|                           |     service: http://localhost:80                   |
|                           |   - service: http_status:404                        |
|                           | ```                                                 |
| Service Host Machine      | DigitalOcean Droplet ID: `<ID>`                    |
| OS / Version              | Ubuntu `Ubuntu 25.04 x64`                                  |
| Region                    | `<region>`                                          |

---

## 5. DigitalOcean Droplet Info  
| Field            | Value                                      |
|------------------|--------------------------------------------|
| Droplet Name     | `first-project`                                   |
| Public IPv4      | `159.65.97.146`                             |
| Region           | `<region>`                                 |
| OS               | Ubuntu `Ubuntu 25.04 x64`                         |
| Purpose          | Website hosting + tooling stack            |
| Reserved IP?     | Yes / [No] (if yes, list reserved IP)        |
| Notes            | 512 MB Memory / 10 GB Disk / SFO2 - Ubuntu 25.04 x64 |

---

## 6. Security & Access Control  
- SSH key setup: yes / [no] — Key used: `<key name>`  
- Firewall rules:  
  - SSH (port 22) allowed from `<IP or range>`  
  - HTTP/HTTPS (ports 80/443) allowed from anywhere if public website  
  - Internal tooling ports (8080, 8090) only accessible via tunnel  
- Cloudflare Access / Zero Trust: Enabled for `tools.bestviable.com`? Yes / No — Allowed Users: `<your email>`  
- SSL/TLS Mode (Cloudflare): Full / Strict / Flexible — `<mode>`  
- Backup & Snapshot schedule: `<frequency>` — Last snapshot date: YYYY-MM-DD

---

## 7. Maintenance & Change Log  
| Date       | Changed By       | Change Description                                  |
|------------|------------------|-----------------------------------------------------|
| 2025-10-18 | `dk`.            | Created DNS zone & tunnel configuration             |
| YYYY-MM-DD | `<Your Name>`    | Added `app.bestviable.com` CNAME & ingress rule     |
| YYYY-MM-DD | `<Your Name>`    | Upgraded droplet memory from 2GB → 4GB             |

---

## 8. Future Tasks  
- [ ] Set up website hosting and SSL on `bestviable.com`  
- [ ] Configure email authentication records (SPF, DKIM, DMARC) for `bestviable.com`  
- [ ] Monitor tunnel connectivity & droplet resource usage  
- [ ] Consider reserving a static IP for droplet if scaling or migrating  
- [ ] Document application stack for `app.bestviable.com` when ready  

---

## 9. References  
- Cloudflare Tunnel docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/ :contentReference[oaicite:0]{index=0}  
- DNS vs CNAME best-practice: https://www.cloudflare.com/learning/dns/dns-records/dns-cname-record/ :contentReference[oaicite:1]{index=1}  
- Infrastructure documentation advice: https://www.reddit.com/r/sysadmin/comments/8ipn9g/how_to_properly_document_your_infrastructure/ :contentReference[oaicite:2]{index=2}  

---


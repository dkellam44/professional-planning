# Apps Directory

Docker Compose configurations for application services:
- Open WebUI (openweb-compose.yml)
- OpenMemory (openmemory-compose.yml)
- Uptime Kuma (kuma-compose.yml)
- Dozzle (dozzle-compose.yml)

Deploy via:
```bash
cd /root/portfolio/infra/apps
docker-compose -f docker-compose.yml up -d
```

All apps connect to n8n_proxy and/or n8n_syncbricks networks.

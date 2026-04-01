# Tidal — AI RFQ-to-Quote Automation Website

The AI quoting engine built for B2B distributors. Email to quote — automated end to end.

---

## Live Site

**https://tidal.supply**

---

## Server Info (DO NOT use these paths/ports for other projects)

| What          | Value                                     |
|---------------|-------------------------------------------|
| VPS IP        | `139.59.64.19`                            |
| Code location | `/root/TidalSite/`                        |
| Node.js port  | `3001`                                    |
| PM2 process   | `TidalSite`                               |
| Nginx config  | `/etc/nginx/sites-available/tidal.supply` |
| SSL cert      | Let's Encrypt (auto-renews every 90 days) |
| Domain        | `tidal.supply` + `www.tidal.supply`       |

> For new projects on this VPS: use a different folder, a different port (3002, 4000, etc.), and a new Nginx config.

---

## Deployment Workflow

Changes are made via Claude (connected to this repo). To push updates to the live site:

1. Make changes → commit → push to `main`
2. Go to **GitHub → Actions → Deploy to VPS**
3. Click **Run workflow** → **Run workflow**
4. Done — site updates in ~30 seconds

---

## GitHub Actions Secrets Required

Set these in: **GitHub → repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name   | Value                                          |
|---------------|------------------------------------------------|
| `VPS_HOST`    | `139.59.64.19`                                 |
| `VPS_USER`    | `root`                                         |
| `VPS_SSH_KEY` | Contents of `~/.ssh/id_ed25519` (SSH private key) |

---

## Project Structure

```
TidalSite/
├── index.html              # Main single-page site
├── css/style.css           # All styles
├── js/main.js              # Nav, FAQ, forms
├── images/                 # Site images
├── server.js               # Express backend
├── package.json
├── .env.example            # Environment variable template
├── deploy.sh               # Local deploy script (legacy)
├── sitemap.xml
├── robots.txt
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Actions — manual deploy trigger
```

---

## Local Dev

```bash
npm install
cp .env.example .env   # fill in your SMTP values
npm run dev
```

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JS
- **Backend**: Node.js + Express
- **Server**: Ubuntu 24.04 on DigitalOcean (BLR1)
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **Process Manager**: PM2
- **Domain**: Namecheap → `tidal.supply`

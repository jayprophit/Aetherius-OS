# Aetherius OS VM/appliance packaging

This directory contains a reproducible VM/appliance delivery path. It serves
the same built web shell as the Cloudflare Pages deployment. It is **not** the
native Aetherius kernel, and it does not claim host filesystem or native shell
access.

## Build and run with Docker

From the repository root:

```powershell
docker build -f packaging/vm/Dockerfile -t aetherius-os:0.1.0 .
docker run --rm -p 8080:8080 aetherius-os:0.1.0
# open http://127.0.0.1:8080/
```

Or with Compose:

```powershell
docker compose -f packaging/vm/docker-compose.yml up --build
```

## VM installation (Ubuntu/Debian cloud image)

1. Create a VM with at least 2 vCPU, 2 GB RAM and 10 GB disk.
2. Pass `packaging/vm/cloud-init.yaml` as user-data.
3. The VM installs Docker, clones this repository to `/opt/aetherius`, builds
   the image and starts `aetherius.service`.
4. Open `http://<vm-address>:8080/`.

For an existing VM:

```bash
sudo git clone --depth 1 https://github.com/jayprophit/Aetherius-OS.git /opt/aetherius
sudo cp /opt/aetherius/packaging/vm/aetherius.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now aetherius.service
```

## Status

- **Container definition:** IMPLEMENTED (source of truth is this directory).
- **Image build:** VERIFIED locally only when the commands above have been run
  and the digest recorded in the release evidence. Until then it is
  `UNVERIFIED`.
- **VM boot:** `UNVERIFIED` until a disposable VM has booted, served the shell
  and passed the health check.

Do not publish an image digest or VM claim without recording the command,
date, host and health-check output.

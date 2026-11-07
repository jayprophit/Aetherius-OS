# Release Artifacts

Put only final, signed release artifacts here. This directory is outside
`dist/` so `vite build` cannot delete it.

Every artifact must have a detached signature next to it:

- `artifact.zip.sig`
- `artifact.deb.asc`
- `artifact.msix.p7s`
- `artifact.apk.minisig`

The release gate refuses to pass if any artifact lacks a signature. A checksum
is not a signature.

Do not commit large binaries. Attach them to the release record and keep only
the signed checksums/manifests in Git if that is your policy.

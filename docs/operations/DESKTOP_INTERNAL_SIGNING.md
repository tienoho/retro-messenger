# Desktop internal signing test

Workflow `Desktop Windows internal signing test` is an internal release gate for a self-signed Code Signing certificate. It does not replace the CA-issued certificate required by the stable and beta workflow.

## Secrets

- `WINDOWS_TEST_PFX_BASE64`: base64-encoded test PFX.
- `WINDOWS_TEST_PFX_PASSWORD`: randomly generated password for that PFX.

Never reuse these values for `WINDOWS_PFX_BASE64` or `WINDOWS_PFX_PASSWORD`. Never commit the PFX, its password or its private key.

Run `scripts/create_desktop_test_certificate.ps1` from PowerShell to create a project-specific one-year RSA test certificate, upload both test secrets through GitHub CLI and immediately remove the local PFX and private key. The script never prints either secret.

## Gates

The Windows hosted runner imports the private key only into its ephemeral user certificate store. It deliberately does not trust the self-signed root. The workflow then runs Desktop typecheck, unit tests, production build, Electron smoke, signed NSIS packaging, signer-thumbprint and expected-untrusted-status verification, silent install, launch smoke and silent uninstall. The certificate is removed in an `always()` cleanup step.

Successful runs upload an artifact and create a GitHub prerelease with an `-internal` tag. Windows machines outside the workflow do not trust the self-signed certificate unless its public certificate is explicitly installed. Never promote an internal prerelease to stable.

## Rollback

Delete the internal prerelease and its tag if a gate was bypassed or an artifact was published incorrectly. Revoke access by deleting both `WINDOWS_TEST_*` repository secrets and removing the test certificate from any machine where it was trusted.

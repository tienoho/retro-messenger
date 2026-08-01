param(
    [string]$Repository = "tienoho/retro-messenger",
    [switch]$SkipGitHubSecrets
)

$ErrorActionPreference = "Stop"
$subject = "CN=Retro Messenger Internal Test Signing, O=Retro Messenger"
$passwordBytes = [byte[]]::new(32)
$random = [Security.Cryptography.RandomNumberGenerator]::Create()
$random.GetBytes($passwordBytes)
$random.Dispose()
$password = [Convert]::ToBase64String($passwordBytes)
$securePassword = ConvertTo-SecureString $password -AsPlainText -Force
$pfxPath = Join-Path $env:TEMP "retro-messenger-internal-$([guid]::NewGuid().ToString('N')).pfx"
$cerPath = [IO.Path]::ChangeExtension($pfxPath, ".cer")
$certificate = $null

try {
    $certificate = New-SelfSignedCertificate `
        -Type CodeSigningCert `
        -Subject $subject `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -KeyAlgorithm RSA `
        -KeyLength 3072 `
        -HashAlgorithm SHA256 `
        -KeyExportPolicy Exportable `
        -NotAfter (Get-Date).AddYears(1)

    Export-PfxCertificate `
        -Cert $certificate `
        -FilePath $pfxPath `
        -Password $securePassword `
        -ChainOption EndEntityCertOnly | Out-Null

    $exported = Get-PfxData -FilePath $pfxPath -Password $securePassword
    if ($exported.EndEntityCertificates.Count -ne 1) {
        throw "The exported PFX does not contain exactly one end-entity certificate."
    }
    if ($exported.EndEntityCertificates[0].Thumbprint -ne $certificate.Thumbprint) {
        throw "The exported PFX certificate does not match the generated certificate."
    }
    if ($certificate.Subject -ne $certificate.Issuer) {
        throw "The generated test certificate is not self-signed."
    }
    if ($certificate.EnhancedKeyUsageList.ObjectId -notcontains "1.3.6.1.5.5.7.3.3") {
        throw "The generated certificate does not contain the Code Signing EKU."
    }

    if (-not $SkipGitHubSecrets) {
        [Convert]::ToBase64String([IO.File]::ReadAllBytes($pfxPath)) |
            gh secret set WINDOWS_TEST_PFX_BASE64 --repo $Repository
        if ($LASTEXITCODE -ne 0) { throw "Could not set WINDOWS_TEST_PFX_BASE64." }

        $password | gh secret set WINDOWS_TEST_PFX_PASSWORD --repo $Repository
        if ($LASTEXITCODE -ne 0) { throw "Could not set WINDOWS_TEST_PFX_PASSWORD." }
    }

    [pscustomobject]@{
        Subject = $certificate.Subject
        Thumbprint = $certificate.Thumbprint
        NotAfter = $certificate.NotAfter
        GitHubSecretsUploaded = -not $SkipGitHubSecrets
    }
}
finally {
    if ($null -ne $certificate) {
        Remove-Item -LiteralPath "Cert:\CurrentUser\My\$($certificate.Thumbprint)" -Force -ErrorAction SilentlyContinue
    }
    Remove-Item -LiteralPath $pfxPath -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $cerPath -Force -ErrorAction SilentlyContinue
    [Array]::Clear($passwordBytes, 0, $passwordBytes.Length)
    $password = $null
    $securePassword = $null
}

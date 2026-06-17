# ZapComanda - Captura de leads: Zona Oeste do Rio de Janeiro
# Execute com: .\scripts\capturar-leads-rj.ps1

$bairros = @(
    "Campo Grande Rio de Janeiro"
    "Inhoaiba Rio de Janeiro"
    "Cesarao Rio de Janeiro"
    "Antares Rio de Janeiro"
    "Santa Cruz Rio de Janeiro"
    "Sepetiba Rio de Janeiro"
)

$categorias = @(
    "marmita"
    "quentinha"
    "lanchonete"
    "pizzaria"
    "hamburgueria"
    "doceria"
)

$total = $bairros.Count * $categorias.Count
$atual = 0

Write-Host ""
Write-Host "ZapComanda - Captura de Leads RJ" -ForegroundColor Green
Write-Host "Zona Oeste | $($bairros.Count) bairros | $($categorias.Count) categorias | Total: $total buscas" -ForegroundColor Green
Write-Host ""

foreach ($bairro in $bairros) {
    Write-Host ">> Bairro: $bairro" -ForegroundColor Cyan
    Write-Host "--------------------------------------------"

    foreach ($categoria in $categorias) {
        $atual++
        Write-Host "[$atual/$total] $categoria em $bairro..." -ForegroundColor Yellow
        node scripts/capturar-leads.js "$categoria" "$bairro"
        Start-Sleep -Seconds 1
    }

    Write-Host ""
}

Write-Host "--------------------------------------------"
Write-Host "Captura finalizada! Leads salvos em docs/leads.md" -ForegroundColor Green
Write-Host ""

node scripts/capturar-leads.js --relatorio

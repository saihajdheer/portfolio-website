$filePath = "c:\Users\Saihaj Dheer\Desktop\sem 6\portfolio\website\saihaj_portfolio_v8.html"
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Replace Helpsters cover
$content = $content.Replace('src="assets/ui_ux_project_1_1775638938786.png" alt="Helpsters App"', 'src="assets/helpsters cover img.png" alt="Helpsters App"')

# Replace Tiint cover
$content = $content.Replace('src="assets/tiint_cover.png" alt="tiint Smartwatch"', 'src="assets/tiint_combined.png" alt="tiint Smartwatch"')
$content = $content.Replace('src="assets/ui_ux_project_2_1775638965973.png" alt="tiint Smartwatch"', 'src="assets/tiint_combined.png" alt="tiint Smartwatch"')

[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
Write-Host "Updated Project Image Source Paths!"

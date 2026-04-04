$home=[Environment]::GetFolderPath("MyDocuments")
$root=Join-Path $home "AI-SaaS-V5"
$githubRepoURL="https://github.com/1wb1965197116-jpg/YOUR_REPO_NAME"

# Create folder structure if not exists
$folders=@("$root/backend","$root/frontend/pages","$root/extension")
foreach($f in $folders){if(-not(Test-Path $f)){New-Item -ItemType Directory -Path $f -Force|Out-Null}}

# Initialize Git
Set-Location $root
git init
git add .
git commit -m "Initial commit: V5 SaaS structure"
git branch -M main
git remote add origin $githubRepoURL

$pushChoice=Read-Host "Push to GitHub now? (y/n)"
if($pushChoice -eq "y"){git push -u origin main}

Start-Process $githubRepoURL
Write-Host "✅ GitHub repository opened in browser"

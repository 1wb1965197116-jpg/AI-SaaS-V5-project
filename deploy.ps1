Write-Host "Deploying AI SaaS V5..."
cd backend
npm install
git init
git add .
git commit -m "Initial backend commit"
cd ../frontend
npm install
vercel --prod
Write-Host "Frontend deployed. Extension ready manually."
Write-Host "Deployment complete!"

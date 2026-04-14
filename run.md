Step 1 — Install pnpm                                                                                        
                                                                                                               
  npm install -g pnpm                                                                                          
                                                                                                               
  ---                                                                                                          
  Step 2 — Install all dependencies

  cd /Users/mohsen/Desktop/projects/unravel
  pnpm install                                                                                                 
   
  ---                                                                                                          
  Step 3 — Start PostgreSQL via Docker                                                                       

  docker run --name unravel-db \
    -e POSTGRES_USER=postgres \                                                                                
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=unravel \                                                                                   
    -p 5432:5432 \                                                                                           
    -d postgres:15-alpine

  Verify it's running:                                                                                         
  docker ps | grep unravel-db
                                                                                                               
  ---                                                                                                        
  Step 4 — Create environment files
                                                                                                               
  Frontend:
  cp /Users/mohsen/Desktop/projects/unravel/apps/frontend/.env.local.example \                                 
     /Users/mohsen/Desktop/projects/unravel/apps/frontend/.env.local                                         

  Backend:                                                                                                     
  cp /Users/mohsen/Desktop/projects/unravel/apps/backend/.env.example \
     /Users/mohsen/Desktop/projects/unravel/apps/backend/.env                                                  
                                                                                                             
  ---                                                                                                          
  Step 5 — Run DB migrations & seed data
                                                                                                               
  cd /Users/mohsen/Desktop/projects/unravel/apps/backend                                                     
  pnpm migration:run                                                                                           
  pnpm seed
                                                                                                               
  ---                                                                                                        
  Step 6 — Start both apps

  cd /Users/mohsen/Desktop/projects/unravel
  pnpm dev                                                                                                     
   
  - Frontend: http://localhost:3000                                                                            
  - Backend API: http://localhost:3001/api/v1                                                                

  ---
  Quick test endpoints (optional)
                                                                                                               
  Once running, verify the backend is alive:
  curl http://localhost:3001/api/v1/levels                                                                     
                                                                                                             
  Test auth:
  curl -X POST http://localhost:3001/api/v1/auth/register \                                                    
    -H "Content-Type: application/json" \                  
    -d '{"username":"testuser","email":"test@test.com","password":"password123"}'                              
                                                                                                             
  ---         

  - Backend ✅ http://localhost:3001/api/v1 — all routes mapped, DB connected, returning
  real data
  - Frontend ✅ http://localhost:3000 — Next.js serving

  Now open http://localhost:3000 in your browser to see the game.

  To start the servers again in the future (after reboot), run these two commands in
  separate terminals:

  # Terminal 1 — Backend
  cd /Users/mohsen/Desktop/projects/unravel/apps/backend && node dist/main.js

  # Terminal 2 — Frontend
  cd /Users/mohsen/Desktop/projects/unravel/apps/frontend && pnpm dev

  ▎ Note: Make sure Docker is running first (docker start unravel-db) each time you
  reboot.                                                                                                 
  ▎ Note: If pnpm migration:run or pnpm seed fail, it's likely because some import paths in the generated files
   need minor fixes — let me know and I'll debug them.  
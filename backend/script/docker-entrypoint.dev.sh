#!/bin/bash

npm i

# ATTENTION cette commande ne prend pas en compte les changements effectues dans le schema !!!
# Pour le developpement, remplacer par "npx prisma migrate dev"
npx prisma migrate deploy
npx prisma db seed

exec npm run start:dev

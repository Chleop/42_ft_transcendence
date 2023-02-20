#!/bin/bash

npm i
npx prisma migrate deploy

if [ -e "prisma/seed.ts" ]; then
	npx prisma db seed
	rm prisma/seed.ts
fi

npm run build
exec npm run start:prod

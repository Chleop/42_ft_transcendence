#!/bin/sh

npm install

exec npm run start:dev
# && npx prisma migrate dev
# && npx prisma db seed

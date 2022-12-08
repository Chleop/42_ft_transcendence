#!/bin/bash

npm i

npx prisma migrate dev --name init

exec npm run start:dev

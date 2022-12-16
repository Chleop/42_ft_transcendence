#!/bin/bash

npm i

exec npm run start:dev
# && npx prisma migrate dev (enfin j'aimerais bien mais ca marche pas)

#!/bin/sh

rm -rf /app/prisma/migrations
npx prisma migrate dev --name init
FROM node:19

WORKDIR /app
COPY . .

RUN apt update \
	&& apt upgrade -y \
	&& npm i -g npm \
	&& npm i -g @nestjs/cli \
	&& chown -R node:node /app

USER node

EXPOSE 3000
ENTRYPOINT ["/bin/bash", "/app/script/docker-entrypoint.sh"]

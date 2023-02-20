FROM node:19 AS builder

WORKDIR /app
COPY . .

RUN npm i -g npm \
	&& npm i \
	&& npm run build

FROM nginx:1.23.3

RUN rm /etc/nginx/conf.d/default.conf
COPY conf/nginx.conf /etc/nginx/conf.d
COPY --from=builder /app/www /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]

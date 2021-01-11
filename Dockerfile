FROM node:14.15.4-alpine AS setup

RUN addgroup -S app; \
	adduser -S app -G app; \
	mkdir -p /var/app; \
	chown -R app:app /var/app;

WORKDIR /var/app
USER app

COPY ./package* ./

RUN npm install

COPY ./tsconfig.json ./
COPY ./src ./src

CMD npm start

FROM setup AS dev

CMD npm run dev
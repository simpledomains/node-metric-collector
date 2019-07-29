FROM node:latest

EXPOSE 8000

ENV SERVER_PORT=8000

COPY . /app
WORKDIR /app

CMD ["node", "/app/src/app.js"]
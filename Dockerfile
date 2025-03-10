FROM node:23.9-alpine3.21

COPY ./build /app
WORKDIR /app

CMD [ "node", "index.js" ]

EXPOSE 3000
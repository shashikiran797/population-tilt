FROM node:20-alpine AS builder

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./
COPY docker.env .env
RUN yarn install --frozen-lockfile

COPY src ./src
EXPOSE 3000

CMD ["yarn", "start"]

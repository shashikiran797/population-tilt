FROM node:gallium-alpine AS builder

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./
COPY docker.env .env
RUN yarn install --frozen-lockfile

COPY src ./src

CMD ["yarn", "start"]

FROM --platform=linux/amd64 node:20-alpine AS builder

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY docker.env .env

COPY src ./src
EXPOSE 80

CMD ["yarn", "start"]

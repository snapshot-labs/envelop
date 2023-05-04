FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

ENV PORT=3000

EXPOSE 3000

CMD ["yarn", "run", "dev"]

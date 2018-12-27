FROM node:10.15 AS base

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npm", "start"]


FROM base AS build

WORKDIR /app
RUN npm run build


FROM node:10.15-alpine AS release

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

COPY --from=build /app/dist ./
COPY views /app/views
COPY static /app/static
COPY locales /app/locales

ENV NODE_ENV production
CMD ["node", "-r", "reflect-metadata", "src/server.js"]

# ==================================================
# STAGE 1 — BUILD REACT APP
# ==================================================
FROM node:20-alpine AS builder

WORKDIR /app

# copy package files trước để cache
COPY package*.json ./

RUN npm install

COPY . .

# build production
RUN npm run build

# ==================================================
# STAGE 2 — SERVE STATIC FILES
# ==================================================
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
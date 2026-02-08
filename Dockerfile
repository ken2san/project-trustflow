# ===== ビルドステージ =====
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# ===== プロダクションステージ =====
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# 作成したNginx設定ファイルをコピー
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

FROM oven/bun:1-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server.ts ./
COPY site ./site
ENV PORT=8080
EXPOSE 8080
CMD ["bun", "run", "server.ts"]

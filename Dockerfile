FROM oven/bun:1-alpine
WORKDIR /app
COPY server.ts index.html styles.css script.js favicon.svg og.jpg thank-you.html 404.html robots.txt sitemap.xml ./
ENV PORT=8080
EXPOSE 8080
CMD ["bun", "run", "server.ts"]

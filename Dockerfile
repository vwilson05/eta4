FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html styles.css script.js /srv/
ENV PORT=8080
EXPOSE 8080
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

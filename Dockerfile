# ===========================================
# Mostralo - Dockerfile para Deploy
# ===========================================
# Este Dockerfile garante que o nginx.conf seja
# incluído automaticamente no deploy, habilitando:
# - Rich Link Previews (crawlers detectados)
# - Compressão Gzip
# - Cache de assets
# - Security headers
# ===========================================

# Etapa 1: Build da aplicação com Bun
FROM oven/bun:1.2 as build

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json bun.lockb ./

# Instalar dependências
RUN bun install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação React
RUN bun run build

# ===========================================
# Etapa 2: Servidor Nginx
# ===========================================
FROM nginx:alpine

# Copiar arquivos do build (dist)
COPY --from=build /app/dist /usr/share/nginx/html

# ✅ CRITICAL: Copiar nginx.conf com configuração de crawlers
# Isso habilita rich link previews no WhatsApp, Facebook, etc.
COPY --from=build /app/nginx.conf /etc/nginx/nginx.conf

# Expor porta 80
EXPOSE 80

# Healthcheck para monitoramento
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Iniciar nginx em foreground
CMD ["nginx", "-g", "daemon off;"]

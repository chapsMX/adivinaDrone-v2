# Backup Pre-Actualización de Dependencias

## Estado del Proyecto (v0.1.0-pre-update)
Fecha de respaldo: 13/03/2024

### Dependencias Principales
```json
{
  "@farcaster/auth-client": "^0.3.0",
  "@farcaster/auth-kit": "^0.6.0",
  "@farcaster/frame-core": "^0.0.29",
  "@farcaster/frame-node": "^0.0.18",
  "@farcaster/frame-sdk": "^0.0.31",
  "@farcaster/frame-wagmi-connector": "^0.0.19",
  "@neondatabase/serverless": "^0.10.4",
  "@tanstack/react-query": "^5.69.0",
  "@upstash/redis": "^1.34.5",
  "@vercel/analytics": "^1.5.0",
  "next": "15.2.1",
  "next-auth": "^4.24.11",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "tailwind-merge": "^3.0.2",
  "vaul": "^1.1.2",
  "viem": "^2.23.12",
  "wagmi": "^2.14.15"
}
```

### Dependencias de Desarrollo
```json
{
  "@eslint/eslintrc": "^3",
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "15.2.1",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

### Scripts Configurados
```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

### Notas Importantes
- El proyecto usa Turbopack en desarrollo (--turbopack flag)
- Versión actual de Next.js: 15.2.1
- Versión actual de React: 19.0.0
- Se están usando múltiples integraciones de Farcaster en versiones tempranas
- El proyecto usa TailwindCSS v4

### Rama de Respaldo
- Nombre: `backup/pre-update-v15`
- Tag: `v0.1.0-pre-update`

### Archivos de Configuración
Se han respaldado los siguientes archivos:
- package.json
- next.config.js (si existe)
- tailwind.config.js (si existe)
- tsconfig.json
- .eslintrc.js/json (si existe)

### Estado de Git
- Rama original: season08
- Último commit antes del respaldo: "chore: backup current state before dependency updates"

### Estado de Build Actual
#### Errores
1. Error de conexión a la base de datos:
   ```
   Error: No database connection string was provided to `neon()`. Perhaps an environment variable has not been set?
   ```
   - Afecta a las rutas:
     - /api/extra-life/use
     - /api/game

#### Advertencias
1. Uso de `<img>` en lugar de `next/image`:
   - src/app/api/mint/app/artworkCard.tsx
   - src/app/api/mint/app/artworkImage.tsx
   - src/app/api/mint/app/mintSuccessSheet.tsx
   - src/app/api/mint/ui/avatar.tsx
   - src/app/api/og/[id]/route.tsx

2. React Hooks:
   - useCallback con dependencia innecesaria en mintSuccessSheet.tsx
   - useEffect con dependencia faltante en Dashboard.tsx

3. Vulnerabilidades:
   - 1 vulnerabilidad crítica reportada por npm audit

### Variables de Entorno Requeridas
- Se requiere configuración de conexión a la base de datos Neon
- Archivo .env.local está en uso 
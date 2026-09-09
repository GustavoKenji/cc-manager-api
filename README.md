# API — Gerenciador de cartões de crédito

## Setup local

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie um projeto no [Firebase Console](https://console.firebase.google.com), ative **Authentication** (método Email/Senha ou o que preferir) e **Firestore**.

3. Gere uma chave de service account em *Configurações do projeto > Contas de serviço > Gerar nova chave privada*, salve como `serviceAccountKey.json` na raiz do projeto (ela já está no `.gitignore`, não sobe pro git).

4. Copie `.env.example` para `.env` e ajuste se necessário.

5. Rode em modo desenvolvimento:
   ```bash
   npm run dev
   ```

6. Teste o health check: `GET http://localhost:8080/health`

## Testando rotas autenticadas

Todas as rotas em `/cards` exigem um header `Authorization: Bearer <idToken>`. Esse token vem do Firebase Auth do lado do frontend — ainda não temos frontend, então pra testar agora dá pra gerar um token de teste pelo [Firebase Auth REST API](https://firebase.google.com/docs/reference/rest/auth) ou esperar a próxima etapa (frontend) que vai gerar isso automaticamente.

## Deploy no Cloud Run

```bash
gcloud run deploy cc-manager-api \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated
```

O Cloud Run detecta as credenciais do Firebase automaticamente via Application Default Credentials, não precisa do `serviceAccountKey.json` em produção.

## Estrutura de pastas

```
src/
  index.ts              → entrada da aplicação
  firebase.ts           → inicialização do Firebase Admin SDK
  middleware/auth.ts     → validação do token do Firebase Auth
  types/index.ts         → tipos TypeScript (Card, Purchase, Installment)
  controllers/           → lógica de negócio de cada recurso
  routes/                → definição das rotas de cada recurso
```

## Próximos passos

- [ ] Controller/rotas de `purchases` (com geração automática de parcelas)
- [ ] Controller/rotas de `installments` e `invoices`
- [ ] Regras de segurança do Firestore

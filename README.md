# Pranarquia - Ficha React

Aplicação de ficha de personagem feita em React, com login/cadastro por Firebase, várias fichas por usuário e salvamento em nuvem no Firestore.

## Rodar Localmente

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal. Nesta máquina, normalmente será:

```text
http://127.0.0.1:5173
```

## Gerar Versão Publicável

```bash
npm run build
```

Os arquivos finais ficam na pasta `dist`.

## Configurar Firebase

1. Crie um projeto no Firebase.
2. Ative Authentication com login por e-mail e senha.
3. Ative Firestore Database.
4. Copie `.env.example` para `.env`.
5. Preencha o `.env` com as credenciais do app web do Firebase.
6. Reinicie o servidor local com `npm run dev`.

Enquanto o `.env` não existir, a ficha continua funcionando com salvamento local e download/carregamento de JSON.

## Regras Do Firestore

Use estas regras para garantir que cada usuário acesse apenas as próprias fichas:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return signedIn() && request.auth.uid == userId;
    }

    function isMaster() {
      return signedIn()
        && exists(/databases/$(database)/documents/masters/$(request.auth.uid));
    }

    match /masters/{masterId} {
      allow read: if isOwner(masterId) || isMaster();
      allow write: if false;
    }

    match /users/{userId}/sheets/{sheetId} {
      allow read, write: if isOwner(userId) || isMaster();
    }

    match /{path=**}/sheets/{sheetId} {
      allow read: if isMaster();
    }

    match /sharedSheets/{shareId} {
      allow read: if true;
      allow create: if signedIn()
        && (request.resource.data.ownerId == request.auth.uid || isMaster());
      allow update, delete: if signedIn()
        && (resource.data.ownerId == request.auth.uid || isMaster());
    }
  }
}
```

Para transformar uma conta em mestre, copie o ID exibido no painel da conta e crie manualmente no Firestore:

```text
Coleção: masters
Documento: ID_DA_CONTA
Campo sugerido: active = true
```

## Publicar

Em serviços como Vercel, Netlify ou Cloudflare Pages:

- Comando de build: `npm run build`
- Pasta de publicação: `dist`

No painel do serviço escolhido, cadastre as mesmas variáveis do `.env` para ativar o Firebase no site publicado.

Depois do deploy, adicione o domínio final em:

```text
Firebase Console > Authentication > Settings > Authorized domains
```

## Variáveis De Ambiente Para Deploy

Cadastre estas variáveis no painel do serviço de hospedagem:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Os valores são os mesmos do arquivo `.env` local. O arquivo `.env` fica fora do Git por segurança.

## Checklist De Publicação

1. Subir o repositório para o GitHub.
2. Importar o repositório na Vercel ou Netlify.
3. Conferir o comando de build: `npm run build`.
4. Conferir a pasta de saída: `dist`.
5. Cadastrar as variáveis `VITE_FIREBASE_*`.
6. Fazer o deploy.
7. Copiar o domínio gerado.
8. Adicionar o domínio em `Authorized domains` no Firebase Authentication.

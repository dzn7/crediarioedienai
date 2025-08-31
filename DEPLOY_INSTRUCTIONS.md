# 🚀 Deploy Instructions - Crediário Edienai Next.js

## 1. Configuração do Git (Manual)

Como o Git não está instalado no PATH, siga os passos:

### Opção A - Instalar Git:
1. Baixe Git: https://git-scm.com/download/win
2. Instale e reinicie o terminal
3. Execute os comandos abaixo

### Opção B - GitHub Desktop:
1. Baixe GitHub Desktop: https://desktop.github.com
2. Abra o projeto na pasta `crediario-nextjs-app`
3. Conecte ao repositório: `https://github.com/dzn7/crediarioedienai.git`

### Comandos Git (após instalação):
```bash
cd crediario-nextjs-app
git add .
git commit -m "feat: Complete Next.js Crediário App with MistralAI integration"
git branch -M main
git remote add origin https://github.com/dzn7/crediarioedienai.git
git push -u origin main
```

## 2. Deploy no Vercel 🌐

### Passo 1: Conectar Repositório
1. Acesse https://vercel.com
2. Conecte sua conta GitHub
3. Importe o repositório `dzn7/crediarioedienai`

### Passo 2: Configurar Environment Variables
No dashboard da Vercel, vá em **Settings > Environment Variables** e adicione:

**Nome da Variável:** `MISTRAL_API_KEY`  
**Valor:** `YkTCIOXtxMv8k6nz6oTbtwB4kU6CSJtH`  
**Environments:** Production, Preview, Development (marcar todos)

**Nome da Variável:** `NEXT_PUBLIC_BACKEND_URL`  
**Valor:** `https://southamerica-east1-edienailanches.cloudfunctions.net`  
**Environments:** Production, Preview, Development (marcar todos)

⚠️ **IMPORTANTE:** Adicione as variáveis MANUALMENTE no dashboard, não use secrets ou referências.

### Passo 3: Deploy Settings
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (automático)
- **Install Command:** `npm install`

## 3. Funcionalidades da IA Mistral 🤖

A IA está configurada para:

### Capacidades Analíticas:
- ✅ Análise completa de todos os crediários
- ✅ Identificação de clientes com risco
- ✅ Sugestões inteligentes de cobrança
- ✅ Monitoramento de padrões de consumo
- ✅ Relatórios personalizados

### Execução Automática de APIs:
- ✅ **Criar crediários:** "Criar crediário para João com R$ 50"
- ✅ **Adicionar pagamentos:** "Registrar pagamento de R$ 30 para Maria"
- ✅ **Adicionar consumos:** "Adicionar consumo de R$ 25 para Pedro"
- ✅ **Atualizar nomes:** "Mudar nome do cliente"
- ✅ **Concluir crediários:** "Finalizar crediário"
- ✅ **Buscar cardápio e pedidos**

### Exemplos de Comandos:
```
"Qual o total em aberto?"
"Quem são os maiores devedores?"
"Criar crediário para Ana Silva com R$ 100"
"Adicionar pagamento de R$ 50 para João"
"Que clientes estão com risco alto?"
"Sugestões para melhorar a cobrança"
```

## 4. Segurança 🔒

- ✅ Chave MistralAI em environment variable
- ✅ Autenticação por PIN
- ✅ Controle de acesso por role (owner/garçom)
- ✅ Headers de segurança configurados
- ✅ APIs protegidas com validação

## 5. Verificação Final ✅

Antes do deploy, certifique-se:
- [ ] Repositório Git configurado
- [ ] Environment variables no Vercel
- [ ] Teste local funcionando
- [ ] PWA e service worker ativos
- [ ] IA Mistral respondendo

🎉 **App está pronto para produção!**

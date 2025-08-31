@echo off
echo Configurando repositorio Git para Crediario Next.js...
echo.

REM Verificar se Git esta instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Git nao encontrado no PATH!
    echo.
    echo Para resolver:
    echo 1. Baixe Git em: https://git-scm.com/download/win
    echo 2. Instale com opcoes padrao
    echo 3. Reinicie o terminal
    echo 4. Execute este script novamente
    echo.
    pause
    exit /b 1
)

REM Inicializar repositorio
echo Inicializando repositorio Git...
git init

REM Adicionar todos os arquivos
echo Adicionando arquivos ao Git...
git add .

REM Fazer commit inicial
echo Fazendo commit inicial...
git commit -m "feat: Complete Next.js Crediario App with MistralAI integration"

REM Configurar branch main
echo Configurando branch main...
git branch -M main

REM Adicionar remote origin
echo Adicionando remote origin...
git remote add origin https://github.com/dzn7/crediarioedienai.git

REM Push para GitHub
echo Fazendo push para GitHub...
git push -u origin main

echo.
echo ===== CONFIGURACAO CONCLUIDA! =====
echo Repositorio configurado em: https://github.com/dzn7/crediarioedienai.git
echo.
echo Proximo passo: Deploy no Vercel
echo 1. Acesse: https://vercel.com
echo 2. Conecte sua conta GitHub
echo 3. Importe o repositorio dzn7/crediarioedienai
echo 4. Configure a environment variable: MISTRAL_API_KEY
echo.
pause

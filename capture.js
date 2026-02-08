const puppeteer = require('puppeteer');
const { WebhookClient } = require('discord.js');

// Argumentos vindos do Jenkins
const jobName = process.argv[2];
const buildNumber = process.argv[3];
const buildResult = process.argv[4];
const branchBuild = process.argv[5];
const webHook = process.argv[6];
// O argumento 7 é o "SKIP" que enviamos no Jenkinsfile
const allureUrl = process.argv[8]; 
const pPassed = process.argv[9];
const pFailed = process.argv[10];
const pBroken = process.argv[11];
const pTotal = process.argv[12];

async function captureScreenshotAndSend() {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome', // Garante o uso do Chrome no ambiente Linux/Jenkins
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    // Define um tempo de espera maior (60 segundos) para conexões lentas
    page.setDefaultNavigationTimeout(60000);

    try {
        console.log("Iniciando login no Jenkins...");
        
        // 1. Login no Jenkins (Usando localhost conforme seu log)
        await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle2' }); 
        await page.type('#j_username', 'admin'); 
        await page.type('#j_password', 'admin'); 
        
        // Clica e espera a navegação completar
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        console.log("Login realizado. Capturando Allure...");

        // 2. Captura da Screenshot do Dashboard Allure
        const allureReportUrl = `http://localhost:8080/job/${jobName}/${buildNumber}/allure/`;
        await page.goto(allureReportUrl, { waitUntil: 'networkidle0' });
        
        // Espera um pouco para os gráficos carregarem (animação do Allure)
        await new Promise(r => setTimeout(r, 5000)); 

        await page.setViewport({ width: 1920, height: 1080 });
        await page.screenshot({ path: 'screenshot.png' });

        // 3. Configuração de Estética
        const webhook = new WebhookClient({ url: webHook });
        let color;
        let statusEmoji;

        switch (buildResult) {
            case 'SUCCESS':
                color = 0x2ECC71;
                statusEmoji = '✅';
                break;
            case 'FAILURE':
                color = 0xFF4757;
                statusEmoji = '❌';
                break;
            case 'UNSTABLE':
                color = 0xFFA502;
                statusEmoji = '⚠️'; 
                break;
            case 'ABORTED':
                color = 0x707A8A;
                statusEmoji = '🔌';
                break;
            default: 
                color = 0xFF4757;
                statusEmoji = '❓';
                break;
        }

        // 4. Construção da Mensagem
        let message = `## 🛡️ Guardians Report\n`;
        message += `> **Relatório de testes api e web, build: \`#${buildNumber}\`**\n`;
        message += `> **Branch:** \`${branchBuild}\`\n`;
        message += `> **Resultado:** ${statusEmoji} **${buildResult}**\n\n`;
        
        message += `### 📊 Sumário de Testes\n`;
        message += `🔹 **Sucesso:** \`${pPassed}\` | 🔸 **Falhas:** \`${pFailed}\`\n`;
        message += `⚡ **Instáveis:** \`${pBroken}\` | 🧪 **Total:** \`${pTotal}\`\n\n`;

        // 5. Envio para o Discord
        await webhook.send({
            username: "Guardians Bot",
            avatarURL: "https://i.imgur.com/l65Mo6m.png",
            files: [{
                attachment: './screenshot.png',
                name: 'screenshot.png'
            }],
            embeds: [{
                description: message,
                color: color,
                image: { url: "attachment://screenshot.png" },
                url: allureUrl,
                footer: {
                    text: "DBC Bank - Squad Guardians • Quality Assurance",
                    iconURL: "https://www.jenkins.io/images/logos/jenkins/jenkins.png"
                },
                timestamp: new Date()
            }]
        });

        console.log("Relatório Guardians enviado com sucesso!");

    } catch (err) {
        console.error("Erro crítico no capture.js:", err);
    } finally {
        await browser.close();
    }
}

captureScreenshotAndSend();



/*const puppeteer = require('puppeteer');
const fs = require('fs');
const { WebhookClient } = require('discord.js');

const jobName = process.argv[2];
const buildNumber = process.argv[3];
const buildResult = process.argv[4];
const branchBuild = process.argv[5];
const webHook = process.argv[6];


async function captureScreenshotAndSend() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/login'); // Página de login do Jenkins
    
    // Preencher formulário de login
    await page.type('#j_username', 'admin'); // Substitua 'seu-usuario' pelo nome de usuário do Jenkins
    await page.type('#j_password', 'admin'); // Substitua 'sua-senha' pela senha do Jenkins
    await page.click('form[name="login"] > button[type="submit"]'); // Enviar formulário de login

    await page.goto(`http://localhost:8080/job/${jobName}/${buildNumber}/allure/`);
    // Ir para a página do relatório Allure após o login
    await page.setViewport({
        width: 1920, // Largura da tela
        height: 1080, // Altura da tela
    });

    // Capturar a screenshot da página
    await page.screenshot({ path: 'screenshot.png' });

    const webhook = new WebhookClient({ url: '' + webHook });

    let message = "# Relatorio de Testes/API e UI/\n"
    message += `**Branch:** ${branchBuild}\n`
    message += `**Build:** ${buildNumber}\n`
    message += `**Status:** ${buildResult}\n`

    let color

    switch (buildResult) {
        case 'SUCCESS':
            color = 65280;
            break;
        case 'FAILURE':
            color = 16711680;
            break;
        case 'UNSTABLE':
            color = 16744192;
            break;
        case 'ABORTED':
            color = 8421504;
            break;
        default: 
            color = 16711680;
            break;
    }

    await webhook.send({
        username: "Jenkins",
        avatarURL: "https://i.imgur.com/l65Mo6m.png",
        files: [{
            attachment: './screenshot.png',
            name: 'screenshot.png'
        }],
        embeds: [{
            description: `${message}`,
            color,
            image:{ url:"attachment://screenshot.png"},
          }]
    });


    await browser.close();

    return;
}

captureScreenshotAndSend();*/



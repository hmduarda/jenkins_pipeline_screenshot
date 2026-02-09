const puppeteer = require('puppeteer');
const { WebhookClient } = require('discord.js');

// Argumentos vindos do Jenkins
const jobName = process.argv[2];
const buildNumber = process.argv[3];
const buildResult = process.argv[4];
const branchBuild = process.argv[5];
const webHook = process.argv[6];
// O argumento 7 é o "SKIP"
const allureUrl = process.argv[8]; // Este agora é o seu link do ngrok vindo do Jenkinsfile
const pPassed = process.argv[9];
const pFailed = process.argv[10];
const pBroken = process.argv[11];
const pTotal = process.argv[12];

async function captureScreenshotAndSend() {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--headless=new'
        ]
    });
    
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    try {
        console.log(`Acessando Jenkins via ngrok: ${allureUrl}`);
        
        // 1. Login no Jenkins usando a URL do ngrok
        await page.goto(`${allureUrl.split('/job/')[0]}/login`, { waitUntil: 'networkidle2' }); 
        await page.type('#j_username', 'admin'); 
        await page.type('#j_password', 'admin'); 
        
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        console.log("Login realizado. Capturando screenshot do Allure...");

        // 2. Vai direto para a URL do relatório Allure (ngrok)
        await page.goto(allureUrl, { waitUntil: 'networkidle0' });
        
        // Espera os gráficos carregarem
        await new Promise(r => setTimeout(r, 7000)); 

        await page.setViewport({ width: 1920, height: 1080 });
        await page.screenshot({ path: 'screenshot.png' });

        const webhook = new WebhookClient({ url: webHook });
        
        // ... (lógica de switch/case de cores permanece a mesma)
        let color;
        let statusEmoji;
        switch (buildResult) {
            case 'SUCCESS': color = 0x2ECC71; statusEmoji = '✅'; break;
            case 'FAILURE': color = 0xFF4757; statusEmoji = '❌'; break;
            case 'UNSTABLE': color = 0xFFA502; statusEmoji = '⚠️'; break;
            case 'ABORTED': color = 0x707A8A; statusEmoji = '🔌'; break;
            default: color = 0xFF4757; statusEmoji = '❓'; break;
        }

        let message = `## 🛡️ Guardians Report\n`;
        message += `> **Build: \`#${buildNumber}\`**\n`;
        message += `> **Branch:** \`${branchBuild}\`\n`;
        message += `> **Resultado:** ${statusEmoji} **${buildResult}**\n\n`;
        message += `### 📊 Sumário de Testes\n`;
        message += `🔹 **Sucesso:** \`${pPassed}\` | 🔸 **Falhas:** \`${pFailed}\`\n`;
        message += `⚡ **Instáveis:** \`${pBroken}\` | 🧪 **Total:** \`${pTotal}\`\n\n`;

        // 3. Envio para o Discord com o link do ngrok embutido
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
                url: allureUrl, // O título do embed agora levará para o seu ngrok
                footer: {
                    text: "DBC Bank - Squad Guardians • Quality Assurance",
                    iconURL: "https://www.jenkins.io/images/logos/jenkins/jenkins.png"
                },
                timestamp: new Date()
            }]
        });

        console.log("Relatório enviado com sucesso!");

    } catch (err) {
        console.error("Erro no capture.js:", err);
    } finally {
        await browser.close();
    }
}

captureScreenshotAndSend();

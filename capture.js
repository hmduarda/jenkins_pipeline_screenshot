const puppeteer = require('puppeteer');
const { WebhookClient } = require('discord.js');

// Argumentos vindos do Jenkins
const jobName       = process.argv[2];
const buildNumber   = process.argv[3];
const buildResult   = process.argv[4];
const branchBuild   = process.argv[5];
const webHook       = process.argv[6];
// process.argv[7] é o SKIP ou Duração
const allureUrl     = process.argv[8]; // URL do GitHub Pages
const pPassed       = process.argv[9];
const pFailed       = process.argv[10];
const pBroken       = process.argv[11];
const pTotal        = process.argv[12];

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
        console.log(`[Guardians] Capturando dashboard Allure: ${allureUrl}`);

        // Define viewport antes de navegar
        await page.setViewport({ width: 1920, height: 1080 });

        // Acessa o relatório público
        await page.goto(allureUrl, { waitUntil: 'networkidle0' });

        // Aguarda gráficos e assets JS
        await new Promise(r => setTimeout(r, 6000));

        // Screenshot
        await page.screenshot({ path: screenshotName });
        
        const webhook = new WebhookClient({ url: webHook });
        let color, statusEmoji;

        switch (buildResult) {
            case 'SUCCESS': color = 0x2ECC71; statusEmoji = '✅'; break;
            case 'FAILURE': color = 0xFF4757; statusEmoji = '❌'; break;
            case 'UNSTABLE': color = 0xFFA502; statusEmoji = '⚠️'; break;
            case 'ABORTED': color = 0x707A8A; statusEmoji = '🔌'; break;
            default: color = 0xFF4757; statusEmoji = '❓'; break;
        }

        // 4. Construção da Mensagem (Sua estética original)
        let message = `## 🛡️ Guardians Report\n`;
        message += `> **Relatório de testes - API e WEB**\n`;
        message += `> **Build:** \`#${buildNumber}\`**\n`;
        message += `> **Branch:** \`${branchBuild}\`\n`;
        message += `> **Resultado:** ${statusEmoji} **${buildResult}**\n\n`;
        
        message += `### 📊 Sumário de Testes\n`;
        message += `🔹 **Sucesso:** \`${pPassed}\` | 🔸 **Falhas:** \`${pFailed}\`\n`;
        message += `⚡ **Instáveis:** \`${pBroken}\` | 🧪 **Total:** \`${pTotal}\`\n\n`;
        
        // Adicionando o link para o Pages aqui
        message += `🔗 **[Acessar Relatório Completo no GitHub Pages](${allureUrl})**`;

        await webhook.send({
            username: "Guardians Bot",
            avatarURL: "https://i.imgur.com/l65Mo6m.png",
            files: [{ attachment: './screenshot.png', name: 'screenshot.png' }],
            embeds: [{
                description: message,
                color: color,
                image: { url: "attachment://screenshot.png" },
                footer: {
                    text: "DBC Bank - Squad Guardians • Quality Assurance",
                    iconURL: "https://www.jenkins.io/images/logos/jenkins/jenkins.png"
                },
                timestamp: new Date()
            }]
        });

        console.log("[Guardians] Relatório enviado com sucesso ao Discord");

    } catch (err) {
        console.error("[Guardians] Erro crítico no capture.js:", err);
    } finally {
        await browser.close();
    }
}

captureScreenshotAndSend();

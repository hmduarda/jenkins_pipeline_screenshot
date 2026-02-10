const puppeteer = require('puppeteer');
const { WebhookClient } = require('discord.js');

// Argumentos vindos do Jenkins
const jobName       = process.argv[2];
const buildNumber   = process.argv[3];
const buildResult   = process.argv[4];
const branchBuild   = process.argv[5];
const webHook       = process.argv[6];
const buildDuration = process.argv[7];
const buildUrl      = process.argv[8];

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
    await page.goto('http://localhost:8080/login'); // Página de login do Jenkins
    
    // Preencher formulário de login
    await page.type('#j_username', 'admin'); // Substitua 'seu-usuario' pelo nome de usuário do Jenkins
    await page.type('#j_password', 'admin'); // Substitua 'sua-senha' pela senha do Jenkins
    await Promise.all([
        page.click('form[name="login"] > button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]); // Enviar formulário de login

    await page.goto(`http://localhost:8080/job/${jobName}/${buildNumber}/allure/`);
    // Ir para a página do relatório Allure após o login
    await page.setViewport({
        width: 1920, // Largura da tela
        height: 1080, // Altura da tela
    });

        await page.screenshot({ path: 'screenshot.png' });

        const webhook = new WebhookClient({ url: '' + webHook });

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


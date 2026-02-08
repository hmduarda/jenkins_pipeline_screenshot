const puppeteer = require('puppeteer');

const { WebhookClient } = require('discord.js');



// Argumentos vindos do Jenkins

const jobName = process.argv[2];

const buildNumber = process.argv[3];

const buildResult = process.argv[4];

const branchBuild = process.argv[5];

const webHook = process.argv[6];

const nextRun = process.argv[7];

const allureUrl = process.argv[8];

const pPassed = process.argv[9];

const pFailed = process.argv[10];

const pBroken = process.argv[11];

const pTotal = process.argv[12];



async function captureScreenshotAndSend() {

    const browser = await puppeteer.launch({

        args: ['--no-sandbox', '--disable-setuid-sandbox']

    });

    const page = await browser.newPage();



    try {

        // 1. Login no Jenkins

        await page.goto('http://jenkins:8080/login'); 

        await page.type('#j_username', 'admin'); 

        await page.type('#j_password', 'admin'); 

        await page.click('button[type="submit"]'); 

        await page.waitForNavigation();



        // 2. Captura da Screenshot do Dashboard Allure

        await page.goto(`http://jenkins:8080/job/${jobName}/${buildNumber}/allure/`, { waitUntil: 'networkidle0' });

        await page.setViewport({ width: 1920, height: 1080 });

        await page.screenshot({ path: 'screenshot.png' });



        // 3. Configuração de Estética (Cores e Emojis Customizados)

        const webhook = new WebhookClient({ url: webHook });

        

        let color;

        let statusEmoji;



        switch (buildResult) {

            case 'SUCCESS':

                color = 0x2ECC71; // Verde Esmeralda

                statusEmoji = '✅'; // Sucesso

                break;

            case 'FAILURE':

                color = 0xFF4757; // Vermelho Coral

                statusEmoji = '❌'; // Falha crítica

                break;

            case 'UNSTABLE':

                color = 0xFFA502; // Laranja Vibrante

                statusEmoji = '⚠️'; 

                break;

            case 'ABORTED':

                color = 0x707A8A; // Cinza Metálico

                statusEmoji = '🔌'; // Tomada desligada

                break;

            default: 

                color = 0xFF4757;

                statusEmoji = '❓';

                break;

        }



        // 4. Construção da Mensagem Informativa

        let message = `## 🛡️ Guardians Report | #${buildNumber}\n`;

        message += `> **Ambiente:** \`Sistemas de Informação\`\n`;

        message += `> **Branch:** \`${branchBuild}\`\n`;

        message += `> **Resultado:** ${statusEmoji} **${buildResult}**\n\n`;

        

        message += `### 📊 Sumário de Testes\n`;

        message += `🔹 **Sucesso:** \`${pPassed}\` | 🔸 **Falhas:** \`${pFailed}\`\n`;

        message += `⚡ **Instáveis:** \`${pBroken}\` | 🧪 **Total:** \`${pTotal}\`\n\n`;

        

        message += `⏭️ **Próximo Ciclo:** \`${nextRun}\``;



        // 5. Envio para o Discord

        await webhook.send({

            username: "Guardians Bot",

            avatarURL: "https://i.imgur.com/l65Mo6m.png", // Seu avatar personalizado

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

                    text: "DBC Bank Bank - Squad Guardians • Quality Assurance",

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

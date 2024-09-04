import dotenv from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import schedule from 'node-schedule';
import express from 'express';
import axios from 'axios';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const app = express();
const port = 3000;

// OAuth2 인증 콜백 처리
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.send('No code provided');
    }

    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'http://localhost:3000/callback',
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token } = response.data;
        res.send('Authentication successful! You can close this window.');
        
        // 이제 access_token을 사용하여 디스코드 API와 상호작용할 수 있습니다.

    } catch (error) {
        console.error('Error during authentication:', error);
        res.send('Authentication failed.');
    }
});

// 시작 날짜 설정 (8월 19일)
const startDate = new Date('2024-08-19');

// 주차 계산 함수
function calculateWeeksPassed() {
    const today = new Date();
    return Math.floor((today - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

// 해당 주차의 날짜 범위 계산 함수
function getWeekDateRange(weekNumber) {
    const weekStartDate = new Date(startDate.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);

    const options = { month: 'numeric', day: 'numeric' };
    const start = weekStartDate.toLocaleDateString('ko-KR', options);
    const end = weekEndDate.toLocaleDateString('ko-KR', options);

    return ${start}부터 ${end}까지;
}

// 디스코드 클라이언트가 준비되었을 때
client.once('ready', () => {
    console.log(Logged in as ${client.user.tag}!);

    // 스케줄링 작업: 매주 월요일 00:00에 실행
    const job = schedule.scheduleJob('0 0 * * 1', () => {
        const weeksPassed = calculateWeeksPassed();
        const dateRange = getWeekDateRange(weeksPassed);

        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        const channel = guild.channels.cache.get(process.env.CHANNEL_ID);

        if (channel) {
            channel.send(이번 주는 스터디 ${weeksPassed}주차 입니다. (${dateRange}) 계속해서 열심히 해봅시다! 💪);
        }
    });
});

// 메시지 이벤트 처리
client.on('messageCreate', message => {
    if (!message.author.bot) {
        // "스터디"라는 단어가 포함된 메시지를 감지
        if (message.content.toLowerCase().includes('스터디')) {
            const weeksPassed = calculateWeeksPassed();
            const dateRange = getWeekDateRange(weeksPassed);
            message.channel.send(오늘은 스터디 ${weeksPassed}주차 입니다. (${dateRange}) 열심히 해봅시다!);
        }
    }
});

// 서버 시작
app.listen(port, () => {
    console.log(Server is running on http://localhost:${port});
});

// 봇 로그인
client.login(process.env.DISCORD_TOKEN);
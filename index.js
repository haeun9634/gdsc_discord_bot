import { Client, GatewayIntentBits } from 'discord.js';
import schedule from 'node-schedule';
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const app = express();
const port = process.env.PORT || 3000; // Heroku의 포트 환경 변수 사용

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
            redirect_uri: `${process.env.BASE_URL}/callback`,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token } = response.data;
        res.send('Authentication successful! You can close this window.');
    } catch (error) {
        console.error('Error during authentication:', error);
        res.send('Authentication failed.');
    }
});

// 시작 날짜 설정 (9월 16일)
const startDate = new Date('2024-09-16');

// 명언 배열
const quotes = [
    "성공은 열심히 하는 사람의 것이다. - 알버트 아인슈타인",
    "포기하지 마세요. 지금 고난이 오히려 당신을 더 강하게 할 것입니다. - 빌 게이츠",
    "실패는 성공으로 가는 첫 걸음입니다. - 헨리 포드",
    "오늘의 노력이 내일의 성공을 만듭니다. - 벤자민 프랭클린",
    "성공하려면 실패를 두려워하지 마세요. - 스티브 잡스",
    "성공의 비밀은 목표를 설정하는 것입니다. - 나폴레온 힐",
    "매일 조금씩 나아가면 결국 도달합니다. - 브루스 리",
    "성공은 계속하는 사람의 것이다. - 윈스턴 처칠",
    "자신을 믿으세요. 그 믿음이 힘이 됩니다. - 오프라 윈프리",
    "실패는 끝이 아니라 새로운 시작입니다. - 존 록펠러"
];

// 현재 주차에 맞는 명언을 선택하는 함수
function getWeeklyQuote(weekNumber) {
    const quoteIndex = (weekNumber - 1) % quotes.length; // 10개의 명언 순환
    return quotes[quoteIndex];
}

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

    return `${start}부터 ${end}까지`;
}

// 디스코드 클라이언트가 준비되었을 때
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// 매주 월요일 자정에 작업을 수행하는 엔드포인트
app.get('/execute', (req, res) => {
    const now = new Date();
    const koreanTimeOffset = 9 * 60 * 60 * 1000; // 한국은 UTC+9
    const koreanTime = new Date(now.getTime() + koreanTimeOffset);

    const dayOfWeek = koreanTime.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일

    if (dayOfWeek === 1) { // 월요일일 때
        console.log("매주 월요일 자정 실행 중...");
        const weeksPassed = calculateWeeksPassed();
        const dateRange = getWeekDateRange(weeksPassed);
        const weeklyQuote = getWeeklyQuote(weeksPassed); // 주차별 명언 가져오기

        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        const channel = guild.channels.cache.get(process.env.CHANNEL_ID);

        if (channel) {
            console.log("메시지를 보낼 채널 발견!");
            
            channel.send(`이번 주는 스터디 ${weeksPassed}주차 입니다! (${dateRange}) 🚀\n"${weeklyQuote}" \n이번 주도 열심히 달려봅시다! 🔥`);
        } else {
            console.log("메시지를 보낼 채널을 찾지 못함.");
        }
    }
});


// 서버 시작
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// 봇 로그인
client.login(process.env.DISCORD_TOKEN);
